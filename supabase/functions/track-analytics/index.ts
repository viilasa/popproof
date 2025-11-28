import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      widget_id,
      site_id,
      action_type, // 'view', 'click', 'close', 'conversion'
      session_id,
      page_url,
      event_notification_id,
      metadata
    } = await req.json();

    // Validate required fields
    if (!widget_id || !site_id || !action_type) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: widget_id, site_id, action_type' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate action_type
    const validActions = ['view', 'click', 'close', 'conversion'];
    if (!validActions.includes(action_type)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid action_type. Must be one of: view, click, close, conversion' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user agent and other info from request
    const userAgent = req.headers.get('user-agent') || '';
    const referrer = req.headers.get('referer') || '';
    
    // Detect device type from user agent
    let deviceType = 'desktop';
    if (/mobile/i.test(userAgent)) {
      deviceType = 'mobile';
    } else if (/tablet|ipad/i.test(userAgent)) {
      deviceType = 'tablet';
    }

    // Insert analytics record
    const { error } = await supabase
      .from('notification_analytics')
      .insert({
        widget_id,
        site_id,
        event_notification_id: event_notification_id || null,
        action_type,
        session_id: session_id || null,
        user_agent: userAgent,
        referrer,
        page_url: page_url || null,
        device_type: deviceType,
        metadata: metadata || {}
      });

    if (error) {
      console.error('Error inserting analytics:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
