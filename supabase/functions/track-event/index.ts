import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
Deno.serve(async (req)=>{
  console.log('track-event function called');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight');
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      console.log('Method not allowed:', req.method);
      return new Response(JSON.stringify({
        success: false,
        error: 'Method not allowed',
        message: 'Only POST requests are allowed'
      }), {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Parse request body
    let eventData;
    try {
      eventData = await req.json();
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid request body',
        message: 'Failed to parse JSON body'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('Event data:', eventData);
    // Validate required parameters - Updated for new schema
    if (!eventData.site_id || !eventData.event_type) {
      console.log('Missing required parameters');
      console.log('Received:', {
        site_id: eventData.site_id,
        event_type: eventData.event_type
      });
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameters',
        message: 'site_id and event_type are required',
        received: {
          has_site_id: !!eventData.site_id,
          has_event_type: !!eventData.event_type
        }
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Initialize Supabase client
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    // Extract domain from URL if available
    let domain = null;
    if (eventData.url) {
      try {
        domain = new URL(eventData.url).hostname;
      } catch (e) {
        console.warn('Failed to parse URL:', eventData.url);
      }
    }
    // Ensure timestamp is set
    const timestamp = eventData.timestamp || new Date().toISOString();
    // Get client IP
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';

    // Build comprehensive metadata with ALL event data
    const metadata: any = {
      tracked_at: new Date().toISOString(),
      user_agent: eventData.user_agent || req.headers.get('user-agent'),
      ip_address: clientIP,
      platform: eventData.platform || 'custom',
      url: eventData.url,
      path: eventData.path || (eventData.url ? new URL(eventData.url).pathname : null),
      referrer: eventData.referrer,
      domain: domain,
      session_id: eventData.session_id,
      timestamp: timestamp
    };
    
    // Add all event_data to metadata
    if (eventData.event_data && typeof eventData.event_data === 'object') {
      Object.assign(metadata, eventData.event_data);
    }
    
    // Add all other fields to metadata
    for (const [key, value] of Object.entries(eventData)) {
      if (!['site_id', 'event_type'].includes(key)) {
        metadata[key] = value;
      }
    }
    
    // Prepare event record - ABSOLUTE MINIMUM (only guaranteed fields)
    const eventRecord: any = {
      site_id: eventData.site_id,
      type: eventData.event_type,        // Required NOT NULL column
      event_type: eventData.event_type,  // Also set event_type for compatibility
      metadata: metadata
    };
    
    // Try to add these common fields if they exist in schema
    // If they don't exist, they'll be in metadata anyway
    try {
      if (eventData.session_id) eventRecord.session_id = eventData.session_id;
      if (eventData.url) eventRecord.url = eventData.url;
      if (timestamp) eventRecord.timestamp = timestamp;
    } catch (e) {
      // Field doesn't exist in schema, that's okay - it's in metadata
    }
    
    console.log('Attempting to insert event:', eventRecord);
    
    // Insert event into database
    const { data, error } = await supabase.from('events').insert([
      eventRecord
    ]);
    
    console.log('Insert result - data:', data, 'error:', error);
    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to track event',
        message: 'Database error occurred'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Update site last_ping for verification
    try {
      await supabase
        .from('sites')
        .update({
          last_ping: timestamp,
          last_used: timestamp
        })
        .eq('id', eventData.site_id);
      
      console.log('Updated site last_ping for:', eventData.site_id);
    } catch (updateError) {
      // Just log the error, don't fail the request
      console.error('Failed to update site activity:', updateError);
    }
    return new Response(JSON.stringify({
      success: true,
      message: 'Event tracked successfully',
      event: {
        client_id: eventData.client_id,
        event_type: eventData.event_type,
        timestamp: timestamp
      }
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});