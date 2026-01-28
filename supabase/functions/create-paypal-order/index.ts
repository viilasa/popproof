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
    const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID')
    const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET')
    const PAYPAL_ENVIRONMENT = Deno.env.get('PAYPAL_ENVIRONMENT') || 'sandbox'
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error('PayPal credentials not configured')
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
    const { plan_slug, return_url, cancel_url } = await req.json()

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

    // Get PayPal access token
    const paypalBaseUrl = PAYPAL_ENVIRONMENT === 'live' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com'

    const authResponse = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })

    if (!authResponse.ok) {
      const errorData = await authResponse.text()
      console.error('PayPal auth failed:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to authenticate with PayPal' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const authData = await authResponse.json()
    const accessToken = authData.access_token

    // Create PayPal order
    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: `order_${user.id.substring(0, 8)}_${Date.now()}`,
        description: `${plan.name} - Monthly Subscription`,
        amount: {
          currency_code: 'USD',
          value: plan.price_usd.toFixed(2),
        },
        custom_id: JSON.stringify({
          user_id: user.id,
          user_email: user.email,
          plan_slug: plan_slug,
          plan_name: plan.name,
        }),
      }],
      application_context: {
        return_url: return_url || `${req.headers.get('origin')}/billing?success=true`,
        cancel_url: cancel_url || `${req.headers.get('origin')}/billing?cancelled=true`,
        brand_name: 'ProofEdge',
        locale: 'en-US',
        user_action: 'PAY_NOW',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
        },
      },
    }

    const orderResponse = await fetch(`${paypalBaseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(orderPayload),
    })

    if (!orderResponse.ok) {
      const errorData = await orderResponse.text()
      console.error('PayPal order creation failed:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to create PayPal order', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const order = await orderResponse.json()

    // Store order in payment_history with pending status
    const { error: insertError } = await supabase
      .from('payment_history')
      .insert({
        user_id: user.id,
        paypal_order_id: order.id,
        payment_gateway: 'paypal',
        amount_usd: plan.price_usd,
        currency: 'USD',
        status: 'pending',
        metadata: {
          plan_slug: plan_slug,
          plan_name: plan.name,
          plan_id: plan.id,
          paypal_order_id: order.id,
        },
      })

    if (insertError) {
      console.error('Failed to store PayPal order:', insertError)
    }

    console.log('PayPal order created successfully:', order.id)

    return new Response(
      JSON.stringify({
        order_id: order.id,
        approval_url: order.links.find((link: any) => link.rel === 'approve')?.href,
        gateway: 'paypal',
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
    console.error('Error creating PayPal order:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
