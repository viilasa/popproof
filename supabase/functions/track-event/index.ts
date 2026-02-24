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

    // Optional API key validation (if header is present, validate it)
    const apiKeyHeader = req.headers.get('x-proofedge-api-key');
    if (apiKeyHeader) {
      const { data: keyRecord, error: keyError } = await supabase
        .from('api_keys')
        .select('id, is_active, usage_count')
        .eq('public_key', apiKeyHeader)
        .eq('is_active', true)
        .single();

      if (keyError || !keyRecord) {
        console.log('Invalid API key provided:', apiKeyHeader);
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid API key',
          message: 'The provided API key is invalid or inactive'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Bump usage count
      await supabase
        .from('api_keys')
        .update({ usage_count: (keyRecord.usage_count || 0) + 1, last_used: new Date().toISOString() })
        .eq('id', keyRecord.id);

      console.log('API key validated:', keyRecord.id);
    }

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
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                    req.headers.get('x-real-ip') || 
                    req.headers.get('cf-connecting-ip') ||
                    'unknown';

    // Try to get location from IP using free geolocation API
    let geoLocation = { city: '', region: '', country: '' };
    if (clientIP && clientIP !== 'unknown' && !clientIP.startsWith('127.') && !clientIP.startsWith('192.168.') && !clientIP.startsWith('10.')) {
      try {
        const geoResponse = await fetch(`http://ip-api.com/json/${clientIP}?fields=city,regionName,country`);
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          geoLocation = {
            city: geoData.city || '',
            region: geoData.regionName || '',
            country: geoData.country || ''
          };
          console.log('Geo location resolved:', geoLocation);
        }
      } catch (geoError) {
        console.warn('Failed to get geo location:', geoError);
      }
    }

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
      timestamp: timestamp,
      // Add geo location data
      city: geoLocation.city,
      region: geoLocation.region,
      country: geoLocation.country,
      location: geoLocation.city || geoLocation.region || geoLocation.country || ''
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

    // Increment visitors_used counter for page_view events
    if (eventData.event_type === 'page_view') {
      try {
        const { data: siteData } = await supabase
          .from('sites')
          .select('user_id')
          .eq('id', eventData.site_id)
          .single();

        if (siteData?.user_id) {
          await supabase.rpc('increment_visitors_used', { p_user_id: siteData.user_id });
        }
      } catch (visitorError) {
        console.error('Failed to increment visitors_used:', visitorError);
      }
    }

    // Auto-detect platform integrations and mark as connected
    const platform = eventData.platform || metadata.platform;
    const platformToIntegrationType: Record<string, string> = {
      'medusajs': 'medusa',
      'woocommerce': 'woocommerce',
      'shopify': 'shopify',
      'wordpress': 'wordpress',
    };
    const integrationType = platformToIntegrationType[platform];
    if (integrationType) {
      try {
        await supabase.from('site_integrations').upsert({
          site_id: eventData.site_id,
          integration_type: integrationType,
          is_active: true,
          last_sync: new Date().toISOString(),
          sync_status: 'success',
        }, { onConflict: 'site_id,integration_type' });
        console.log(`Auto-detected ${integrationType} integration for site:`, eventData.site_id);
      } catch (integrationError) {
        console.error('Failed to auto-detect integration:', integrationError);
      }
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