import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const DODO_API_KEY = Deno.env.get('DODO_PAYMENTS_API_KEY')
    const DODO_ENV = Deno.env.get('DODO_PAYMENTS_ENVIRONMENT') || 'test_mode'
    const DODO_API_URL = DODO_ENV === 'live_mode' 
      ? 'https://live.dodopayments.com' 
      : 'https://test.dodopayments.com'
    
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!DODO_API_KEY) {
      throw new Error('Dodo Payments API key not configured')
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { plan_slug, return_url } = await req.json()

    if (!plan_slug) {
      return new Response(
        JSON.stringify({ error: 'Plan slug is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get plan from subscription_plans table
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

    if (plan.price_usd === 0) {
      return new Response(
        JSON.stringify({ error: 'Free plan does not require payment' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if plan has dodo_product_id configured
    if (!plan.dodo_product_id) {
      return new Response(
        JSON.stringify({ error: 'Dodo product not configured for this plan' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Creating Dodo checkout:', {
      plan_slug,
      price_usd: plan.price_usd,
      user_id: user.id,
      environment: DODO_ENV
    })

    // Create checkout session
    const checkoutResponse = await fetch(`${DODO_API_URL}/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DODO_API_KEY}`,
      },
      body: JSON.stringify({
        product_cart: [{ product_id: plan.dodo_product_id, quantity: 1 }],
        customer: {
          email: user.email,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer',
        },
        return_url: return_url || `${req.headers.get('origin')}/billing?payment=success`,
        metadata: {
          user_id: user.id,
          user_email: user.email,
          plan_slug: plan_slug,
          plan_name: plan.name,
          plan_id: plan.id,
        },
      }),
    })

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.text()
      console.error('Dodo checkout creation failed:', errorData, 'Status:', checkoutResponse.status)
      return new Response(
        JSON.stringify({ error: 'Failed to create checkout session', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { session_id, checkout_url } = await checkoutResponse.json()

    // Store pending payment in payment_history
    const { error: insertError } = await supabase
      .from('payment_history')
      .insert({
        user_id: user.id,
        dodo_session_id: session_id,
        amount_usd: plan.price_usd,
        currency: 'USD',
        status: 'pending',
        payment_gateway: 'dodo',
        metadata: {
          plan_slug: plan_slug,
          plan_name: plan.name,
          plan_id: plan.id,
        },
      })

    if (insertError) {
      console.error('Failed to store pending payment:', insertError)
    }

    console.log('Dodo checkout created successfully:', session_id)

    return new Response(
      JSON.stringify({
        session_id,
        checkout_url,
        plan: {
          name: plan.name,
          slug: plan.slug,
          price_usd: plan.price_usd,
          visitor_limit: plan.visitor_limit,
          website_limit: plan.website_limit,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error creating checkout:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
