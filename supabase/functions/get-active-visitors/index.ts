import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Edge function to get active visitor count for a site
Deno.serve(async (req) => {
  console.log('get-active-visitors function called');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow GET and POST requests
    if (req.method !== 'GET' && req.method !== 'POST') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Method not allowed'
      }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get site_id from query params or body
    let siteId: string | null = null;
    let timeWindowMinutes = 5; // Default: 5 minutes

    if (req.method === 'GET') {
      const url = new URL(req.url);
      siteId = url.searchParams.get('site_id');
      const timeParam = url.searchParams.get('time_window');
      if (timeParam) timeWindowMinutes = parseInt(timeParam);
    } else {
      const body = await req.json();
      siteId = body.site_id;
      timeWindowMinutes = body.time_window || 5;
    }

    if (!siteId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'site_id is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Calculate time threshold
    const timeThreshold = new Date();
    timeThreshold.setMinutes(timeThreshold.getMinutes() - timeWindowMinutes);
    const thresholdISO = timeThreshold.toISOString();

    console.log('Querying active visitors for site:', siteId);
    console.log('Time threshold:', thresholdISO);

    // Get unique active sessions in the time window
    const { data: events, error } = await supabase
      .from('events')
      .select('session_id, timestamp')
      .eq('site_id', siteId)
      .eq('type', 'visitor_active')
      .gte('timestamp', thresholdISO)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to query visitors',
        details: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Count unique sessions
    const uniqueSessions = new Set();
    const recentVisitors: any[] = [];

    if (events) {
      for (const event of events) {
        if (event.session_id && !uniqueSessions.has(event.session_id)) {
          uniqueSessions.add(event.session_id);
          recentVisitors.push({
            session_id: event.session_id,
            last_seen: event.timestamp
          });
        }
      }
    }

    const visitorCount = uniqueSessions.size;

    console.log('Active visitors found:', visitorCount);

    // Get site information for context
    const { data: site } = await supabase
      .from('sites')
      .select('name, domain')
      .eq('id', siteId)
      .single();

    return new Response(JSON.stringify({
      success: true,
      site_id: siteId,
      site_name: site?.name || 'Unknown',
      site_domain: site?.domain || null,
      visitor_count: visitorCount,
      time_window_minutes: timeWindowMinutes,
      query_time: new Date().toISOString(),
      recent_visitors: recentVisitors.slice(0, 10), // Last 10 for debugging
      details: {
        total_events_checked: events?.length || 0,
        unique_sessions: visitorCount,
        time_threshold: thresholdISO
      }
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate' // Don't cache visitor counts
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
