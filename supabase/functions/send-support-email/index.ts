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

    // Send email via FormSubmit.co
    let emailSent = false
    try {
      const formSubmitResponse = await fetch('https://formsubmit.co/ajax/support@proofedge.io', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          email: email,
          _subject: `[${categoryLabel}] ${subject}`,
          'Query Type': categoryLabel,
          'Subject': subject,
          'Message': message,
          'Ticket ID': ticket.id,
          _template: 'table',
        }),
      })
      emailSent = formSubmitResponse.ok
      if (!formSubmitResponse.ok) {
        console.error('FormSubmit error:', await formSubmitResponse.text())
      }
    } catch (emailErr) {
      console.error('Email sending failed:', emailErr)
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
