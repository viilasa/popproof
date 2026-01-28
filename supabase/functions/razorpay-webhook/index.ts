import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const RAZORPAY_WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!RAZORPAY_WEBHOOK_SECRET) {
      throw new Error('Webhook secret not configured')
    }

    // Get the raw body and signature
    const body = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'No signature provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify webhook signature
    const expectedSignature = createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex')

    if (expectedSignature !== signature) {
      console.error('Webhook signature verification failed')
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse the webhook payload
    const payload = JSON.parse(body)
    const event = payload.event

    console.log('Razorpay webhook received:', event)

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // Handle different webhook events
    switch (event) {
      case 'payment.captured': {
        const payment = payload.payload.payment.entity
        const orderId = payment.order_id
        const paymentId = payment.id

        console.log('Payment captured:', { orderId, paymentId })

        // Update payment record
        const { data: paymentRecord } = await supabase
          .from('payment_history')
          .select('*')
          .eq('razorpay_order_id', orderId)
          .single()

        if (paymentRecord) {
          await supabase
            .from('payment_history')
            .update({
              razorpay_payment_id: paymentId,
              status: 'completed',
              payment_method: payment.method,
              updated_at: new Date().toISOString(),
            })
            .eq('id', paymentRecord.id)

          // Activate subscription if not already done
          const planId = paymentRecord.metadata?.plan_id
          if (planId) {
            const now = new Date()
            const periodEnd = new Date(now)
            periodEnd.setMonth(periodEnd.getMonth() + 1)

            await supabase
              .from('user_subscriptions')
              .update({
                plan_id: planId,
                status: 'active',
                current_period_start: now.toISOString(),
                current_period_end: periodEnd.toISOString(),
                cancel_at_period_end: false,
                visitors_used: 0,
                updated_at: now.toISOString(),
              })
              .eq('user_id', paymentRecord.user_id)
          }
        }
        break
      }

      case 'payment.failed': {
        const payment = payload.payload.payment.entity
        const orderId = payment.order_id

        console.log('Payment failed:', { orderId })

        // Update payment record
        await supabase
          .from('payment_history')
          .update({
            status: 'failed',
            metadata: {
              error_code: payment.error_code,
              error_description: payment.error_description,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('razorpay_order_id', orderId)
        break
      }

      case 'refund.created': {
        const refund = payload.payload.refund.entity
        const paymentId = refund.payment_id

        console.log('Refund created:', { paymentId })

        // Update payment record
        await supabase
          .from('payment_history')
          .update({
            status: 'refunded',
            updated_at: new Date().toISOString(),
          })
          .eq('razorpay_payment_id', paymentId)

        // Get the payment to find user
        const { data: paymentRecord } = await supabase
          .from('payment_history')
          .select('user_id')
          .eq('razorpay_payment_id', paymentId)
          .single()

        if (paymentRecord) {
          // Get starter plan
          const { data: starterPlan } = await supabase
            .from('subscription_plans')
            .select('id')
            .eq('slug', 'starter')
            .single()

          if (starterPlan) {
            // Downgrade to starter plan
            await supabase
              .from('user_subscriptions')
              .update({
                plan_id: starterPlan.id,
                status: 'active',
                current_period_end: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(),
                visitors_used: 0,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', paymentRecord.user_id)
          }
        }
        break
      }

      default:
        console.log('Unhandled webhook event:', event)
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
