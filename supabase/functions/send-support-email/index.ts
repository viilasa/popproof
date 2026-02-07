import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { name, email, queryType, subject, message } = await req.json()

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: 'All fields are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Store support ticket in database
    const { data: ticket, error: dbError } = await supabase
      .from('support_tickets')
      .insert({
        name,
        email,
        query_type: queryType || 'general',
        subject,
        message,
        status: 'open',
      })
      .select()
      .single()

    if (dbError) {
      console.error('DB insert error:', dbError)
      throw new Error('Failed to save support ticket')
    }

    const queryTypeLabels: Record<string, string> = {
      general: 'General Inquiry',
      technical: 'Technical Support',
      bug: 'Bug Report',
      feature: 'Feature Request',
      billing: 'Billing Question',
    }
    const categoryLabel = queryTypeLabels[queryType] || queryType

    // Send email via Resend
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    let emailSent = false
    if (RESEND_API_KEY) {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'PopProof Support <onboarding@resend.dev>',
          to: ['support@proofedge.io'],
          reply_to: email,
          subject: `[${categoryLabel}] ${subject}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
              <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:24px;border-radius:12px 12px 0 0">
                <h1 style="color:#fff;margin:0;font-size:20px">New Support Request</h1>
              </div>
              <div style="background:#f9fafb;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
                <table style="width:100%;border-collapse:collapse">
                  <tr><td style="padding:8px 12px;font-weight:bold;color:#374151;width:120px">Category:</td><td style="padding:8px 12px"><span style="background:#eff6ff;color:#2563eb;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600">${categoryLabel}</span></td></tr>
                  <tr><td style="padding:8px 12px;font-weight:bold;color:#374151">Name:</td><td style="padding:8px 12px;color:#6b7280">${name}</td></tr>
                  <tr><td style="padding:8px 12px;font-weight:bold;color:#374151">Email:</td><td style="padding:8px 12px"><a href="mailto:${email}" style="color:#2563eb">${email}</a></td></tr>
                  <tr><td style="padding:8px 12px;font-weight:bold;color:#374151">Subject:</td><td style="padding:8px 12px;color:#6b7280">${subject}</td></tr>
                </table>
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
                <div style="padding:8px 12px">
                  <p style="font-weight:bold;color:#374151;margin-bottom:8px">Message:</p>
                  <div style="background:#fff;padding:16px;border-radius:8px;border:1px solid #e5e7eb;color:#374151;line-height:1.6;white-space:pre-wrap">${message}</div>
                </div>
              </div>
              <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px">Ticket ID: ${ticket.id} | PopProof Support</p>
            </div>
          `,
        }),
      })
      emailSent = resendResponse.ok
      if (!resendResponse.ok) {
        console.error('Resend error:', await resendResponse.text())
      }
    }

    return new Response(
      JSON.stringify({ success: true, ticketId: ticket.id, emailSent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-support-email:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Failed to process support request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
