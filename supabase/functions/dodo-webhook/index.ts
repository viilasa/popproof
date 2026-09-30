import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, webhook-id, webhook-signature, webhook-timestamp',
}

const TIMESTAMP_TOLERANCE_SECONDS = 5 * 60

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function b64decode(s: string): Uint8Array {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

// Standard Webhooks signature verification (used by Dodo Payments):
// signed content = `${webhook-id}.${webhook-timestamp}.${body}`, HMAC-SHA256 with the
// base64 secret (after the `whsec_` prefix), base64 encoded, sent as `v1,<sig>` (space separated).
async function verifySignature(req: Request, rawBody: string, secret: string): Promise<boolean> {
  const id = req.headers.get('webhook-id')
  const timestamp = req.headers.get('webhook-timestamp')
  const signatureHeader = req.headers.get('webhook-signature')
  if (!id || !timestamp || !signatureHeader) return false

  const ts = Number(timestamp)
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > TIMESTAMP_TOLERANCE_SECONDS) return false

  const keyBytes = b64decode(secret.startsWith('whsec_') ? secret.slice(6) : secret)
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${timestamp}.${rawBody}`))
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)))

  return signatureHeader
    .split(' ')
    .map((part) => part.split(',')[1])
    .some((candidate) => candidate && timingSafeEqual(candidate, expected))
}

// deno-lint-ignore no-explicit-any
async function processWebhook(payload: any) {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const eventType: string = payload.type
  const data = payload.data ?? {}
  const now = new Date()

  switch (eventType) {
    case 'payment.succeeded': {
      const sessionId = data.checkout_session_id
      let userId = data.metadata?.user_id
      let planSlug = data.metadata?.plan_slug

      // Fall back to our own pending record for THIS checkout session only.
      if ((!userId || !planSlug) && sessionId) {
        const { data: pending } = await supabase
          .from('payment_history')
          .select('user_id, metadata')
          .eq('dodo_session_id', sessionId)
          .eq('payment_gateway', 'dodo')
          .maybeSingle()
        userId = userId || pending?.user_id
        planSlug = planSlug || pending?.metadata?.plan_slug
      }

      if (!userId || !planSlug) {
        throw new Error(`payment.succeeded without resolvable user/plan (payment ${data.payment_id})`)
      }

      // Idempotency: Dodo retries deliveries.
      if (data.payment_id) {
        const { data: done } = await supabase
          .from('payment_history')
          .select('id')
          .eq('dodo_payment_id', data.payment_id)
          .eq('status', 'completed')
          .maybeSingle()
        if (done) return
      }

      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('slug', planSlug)
        .single()
      if (planError || !plan) throw new Error(`Plan lookup failed for ${planSlug}: ${planError?.message}`)

      const periodEnd = new Date(data.next_billing_date ?? now)
      if (!data.next_billing_date) periodEnd.setMonth(periodEnd.getMonth() + 1)

      const { error: upsertError } = await supabase.from('user_subscriptions').upsert(
        {
          user_id: userId,
          plan_id: plan.id,
          status: 'active',
          dodo_subscription_id: data.subscription_id || null,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
          cancelled_at: null,
          visitors_used: 0,
          updated_at: now.toISOString(),
        },
        { onConflict: 'user_id' },
      )
      if (upsertError) throw new Error(`Subscription upsert failed: ${upsertError.message}`)

      // Complete the record for this session (or insert one for renewals).
      const update = {
        status: 'completed',
        dodo_payment_id: data.payment_id,
        completed_at: now.toISOString(),
        updated_at: now.toISOString(),
      }
      const { data: updated } = sessionId
        ? await supabase
            .from('payment_history')
            .update(update)
            .eq('dodo_session_id', sessionId)
            .eq('payment_gateway', 'dodo')
            .select('id')
        : { data: [] }

      if (!updated || updated.length === 0) {
        await supabase.from('payment_history').insert({
          user_id: userId,
          dodo_session_id: sessionId ?? null,
          amount_usd: (data.total_amount ?? 0) / 100,
          currency: data.currency ?? 'USD',
          payment_gateway: 'dodo',
          metadata: { plan_slug: planSlug, renewal: true },
          ...update,
        })
      }

      // Best-effort receipt email.
      const { data: authUser } = await supabase.auth.admin.getUserById(userId)
      if (authUser?.user?.email) {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-payment-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            to: authUser.user.email,
            type: 'payment_success',
            data: {
              customerName: authUser.user.user_metadata?.full_name,
              planName: data.metadata?.plan_name ?? planSlug,
              amount: (data.total_amount ?? 0) / 100,
              currency: data.currency ?? 'USD',
              paymentId: data.payment_id,
              date: now.toISOString(),
            },
          }),
        }).catch((e) => console.error('Payment email failed:', e))
      }
      console.log('Plan activated for', userId, planSlug)
      return
    }

    case 'payment.failed': {
      if (data.checkout_session_id) {
        await supabase
          .from('payment_history')
          .update({ status: 'failed', dodo_payment_id: data.payment_id, updated_at: now.toISOString() })
          .eq('dodo_session_id', data.checkout_session_id)
          .eq('payment_gateway', 'dodo')
          .eq('status', 'pending')
      }
      return
    }

    case 'subscription.cancelled':
    case 'subscription.expired':
    case 'subscription.failed':
    case 'subscription.on_hold': {
      if (!data.subscription_id) return
      const status =
        eventType === 'subscription.cancelled' ? 'cancelled'
        : eventType === 'subscription.on_hold' ? 'past_due'
        : 'expired'
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status,
          ...(status === 'cancelled' ? { cancelled_at: now.toISOString() } : {}),
          updated_at: now.toISOString(),
        })
        .eq('dodo_subscription_id', data.subscription_id)
      if (error) throw new Error(`Subscription status update failed: ${error.message}`)
      return
    }

    default:
      console.log('Ignoring event type:', eventType)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const secret = Deno.env.get('DODO_PAYMENTS_WEBHOOK_KEY')
  if (!secret) {
    console.error('DODO_PAYMENTS_WEBHOOK_KEY not configured')
    return json({ error: 'Webhook not configured' }, 500)
  }

  const rawBody = await req.text()

  let valid = false
  try {
    valid = await verifySignature(req, rawBody, secret)
  } catch (err) {
    console.error('Signature verification error:', err)
  }
  if (!valid) return json({ error: 'Invalid signature' }, 401)

  try {
    await processWebhook(JSON.parse(rawBody))
    return json({ received: true })
  } catch (err) {
    // Non-2xx makes Dodo retry, so transient failures are not silently lost.
    console.error('Webhook processing error:', err)
    return json({ error: 'Processing failed' }, 500)
  }
})
