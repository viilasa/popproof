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
    const { paypal_order_id, payer_id } = await req.json()

    if (!paypal_order_id || !payer_id) {
      return new Response(
        JSON.stringify({ error: 'PayPal order ID and payer ID are required' }),
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

    // Get order details from PayPal
    const orderResponse = await fetch(`${paypalBaseUrl}/v2/checkout/orders/${paypal_order_id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!orderResponse.ok) {
      const errorData = await orderResponse.text()
      console.error('Failed to get PayPal order:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve PayPal order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const order = await orderResponse.json()

    // Verify order status
    if (order.status !== 'APPROVED') {
      return new Response(
        JSON.stringify({ error: 'Order is not approved', status: order.status }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Capture the payment
    const captureResponse = await fetch(`${paypalBaseUrl}/v2/checkout/orders/${paypal_order_id}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!captureResponse.ok) {
      const errorData = await captureResponse.text()
      console.error('Failed to capture PayPal payment:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to capture payment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const captureData = await captureResponse.json()

    if (captureData.status !== 'COMPLETED') {
      return new Response(
        JSON.stringify({ error: 'Payment capture failed', status: captureData.status }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the pending payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payment_history')
      .select('*')
      .eq('paypal_order_id', paypal_order_id)
      .eq('user_id', user.id)
      .single()

    if (paymentError || !payment) {
      return new Response(
        JSON.stringify({ error: 'Payment record not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get plan details from metadata
    const planSlug = payment.metadata?.plan_slug
    const planId = payment.metadata?.plan_id

    if (!planSlug || !planId) {
      return new Response(
        JSON.stringify({ error: 'Plan information missing' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update payment record
    await supabase
      .from('payment_history')
      .update({
        paypal_payment_id: captureData.purchase_units[0].payments.captures[0].id,
        paypal_payer_id: payer_id,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id)

    // Calculate subscription period (1 month from now)
    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setMonth(periodEnd.getMonth() + 1)

    // Update or create user subscription
    const { data: existingSub } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existingSub) {
      // Update existing subscription
      await supabase
        .from('user_subscriptions')
        .update({
          plan_id: planId,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
          cancelled_at: null,
          visitors_used: 0,
          paypal_payer_id: payer_id,
          updated_at: now.toISOString(),
        })
        .eq('user_id', user.id)
    } else {
      // Create new subscription
      await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          plan_id: planId,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          visitors_used: 0,
          paypal_payer_id: payer_id,
        })
    }

    // Link payment to subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (subscription) {
      await supabase
        .from('payment_history')
        .update({ subscription_id: subscription.id })
        .eq('id', payment.id)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'PayPal payment verified and subscription activated',
        subscription: {
          plan_slug: planSlug,
          current_period_end: periodEnd.toISOString(),
          gateway: 'paypal',
        },
        payment: {
          paypal_payment_id: captureData.purchase_units[0].payments.captures[0].id,
          amount: captureData.purchase_units[0].payments.captures[0].amount,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error verifying PayPal payment:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
