import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured')
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // Verify user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get request body
    const { plan_slug } = await req.json()

    if (!plan_slug) {
      return new Response(
        JSON.stringify({ error: 'Plan slug is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('slug', plan_slug)
      .eq('is_active', true)
      .single()

    if (planError || !plan) {
      return new Response(
        JSON.stringify({ error: 'Plan not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Free plan doesn't need payment
    if (plan.price_usd === 0) {
      return new Response(
        JSON.stringify({ error: 'Free plan does not require payment' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Convert to paise (Razorpay uses smallest currency unit)
    // For INR, amount is in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(plan.price_inr * 100)

    console.log('Creating Razorpay order:', {
      plan_slug,
      price_inr: plan.price_inr,
      amount_paise: amountInPaise,
      user_id: user.id
    })

    // Create Razorpay order
    const razorpayAuth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)

    const orderResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${razorpayAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `order_${user.id.substring(0, 8)}_${Date.now()}`,
        notes: {
          user_id: user.id,
          user_email: user.email,
          plan_slug: plan_slug,
          plan_name: plan.name,
        },
      }),
    })

    if (!orderResponse.ok) {
      const errorData = await orderResponse.text()
      console.error('Razorpay order creation failed:', errorData, 'Status:', orderResponse.status)
      return new Response(
        JSON.stringify({ error: 'Failed to create Razorpay order', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const order = await orderResponse.json()

    // Store order in payment_history with pending status
    const { error: insertError } = await supabase
      .from('payment_history')
      .insert({
        user_id: user.id,
        razorpay_order_id: order.id,
        amount_usd: plan.price_usd,
        currency: 'USD',
        status: 'pending',
        metadata: {
          plan_slug: plan_slug,
          plan_name: plan.name,
          plan_id: plan.id,
        },
      })

    if (insertError) {
      console.error('Failed to store order:', insertError)
    }

    console.log('Razorpay order created successfully:', order.id)

    return new Response(
      JSON.stringify({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: RAZORPAY_KEY_ID,
        plan: {
          name: plan.name,
          slug: plan.slug,
          price_usd: plan.price_usd,
          price_inr: plan.price_inr,
          visitor_limit: plan.visitor_limit,
          website_limit: plan.website_limit,
        },
        prefill: {
          email: user.email,
          name: user.user_metadata?.full_name || '',
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error creating order:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
