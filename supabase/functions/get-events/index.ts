import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true'
};

Deno.serve(async (req: Request) => {
  console.log('get-events function called');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight');
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      console.log('Method not allowed:', req.method);
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const url = new URL(req.url);
    const clientId = url.searchParams.get('client_id');
    const limitParam = url.searchParams.get('limit');
    
    console.log('Client ID:', clientId);
    console.log('Limit param:', limitParam);

    // Validate required parameters
    if (!clientId) {
      console.log('Missing client_id parameter');
      return new Response(
        JSON.stringify({ error: 'client_id parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate and set limit
    let limit = 10; // default limit
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        console.log('Invalid limit parameter:', limitParam);
        return new Response(
          JSON.stringify({ error: 'limit must be a positive integer' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      limit = Math.min(parsedLimit, 50); // maximum 50 events
    }

    // Calculate 24 hours ago timestamp
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    console.log('Querying events since:', twentyFourHoursAgo.toISOString());

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
    
    console.log('Supabase URL:', Deno.env.get('SUPABASE_URL'));
    console.log('Supabase Anon Key exists:', !!Deno.env.get('SUPABASE_ANON_KEY'));

    // Find the site by public_key (client_id)
    const { data: site } = await supabase
      .from('sites')
      .select('id')
      .eq('public_key', clientId)
      .single();

    // Get active widget design and display settings for this site
    let widgetDesign = null;
    let widgetDisplay = null;
    if (site) {
      const { data: widget } = await supabase
        .from('widgets')
        .select(`
          position,
          offset_x,
          offset_y,
          max_width,
          min_width,
          border_radius,
          border_width,
          border_color,
          border_left_accent,
          border_left_accent_width,
          border_left_accent_color,
          shadow_enabled,
          shadow_size,
          glassmorphism,
          backdrop_blur,
          background_color,
          background_gradient,
          gradient_start,
          gradient_end,
          gradient_direction,
          mobile_position,
          mobile_max_width,
          hide_on_mobile,
          hide_on_desktop,
          stack_on_mobile,
          reduced_motion_support
        `)
        .eq('site_id', site.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (widget) {
        widgetDesign = {
          position: widget.position,
          offset_x: widget.offset_x,
          offset_y: widget.offset_y,
          max_width: widget.max_width,
          min_width: widget.min_width,
          border_radius: widget.border_radius,
          border_width: widget.border_width,
          border_color: widget.border_color,
          border_left_accent: widget.border_left_accent,
          border_left_accent_width: widget.border_left_accent_width,
          border_left_accent_color: widget.border_left_accent_color,
          shadow_enabled: widget.shadow_enabled,
          shadow_size: widget.shadow_size,
          glassmorphism: widget.glassmorphism,
          backdrop_blur: widget.backdrop_blur,
          background_color: widget.background_color,
          background_gradient: widget.background_gradient,
          gradient_start: widget.gradient_start,
          gradient_end: widget.gradient_end,
          gradient_direction: widget.gradient_direction,
        };
        
        widgetDisplay = {
          responsive: {
            mobile_position: widget.mobile_position,
            mobile_max_width: widget.mobile_max_width,
            hide_on_mobile: widget.hide_on_mobile,
            hide_on_desktop: widget.hide_on_desktop,
            stack_on_mobile: widget.stack_on_mobile,
            reduced_motion_support: widget.reduced_motion_support,
          }
        };
      }
    }

    // Query events from database
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('client_id', clientId)
      .gte('timestamp', twentyFourHoursAgo.toISOString())
      .order('timestamp', { ascending: false })
      .limit(limit);

    console.log('Database query result:', { data, error });
    
    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve events' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Format response data
    const formattedEvents = data.map(event => ({
      id: event.id,
      event_type: event.event_type,
      user_name: event.user_name || event.metadata?.name || 'Someone',
      product_name: event.product_name || event.metadata?.product_name,
      location: event.location || event.metadata?.location || event.metadata?.city,
      value: event.value || event.metadata?.value || event.metadata?.amount,
      currency: event.currency || event.metadata?.currency || 'USD',
      timestamp: event.timestamp,
      url: event.url,
      path: event.path,
      domain: event.domain,
      session_id: event.session_id,
      metadata: event.metadata || {}
    }));

    console.log('Returning response:', {
      success: true,
      events: formattedEvents,
      count: formattedEvents.length,
      client_id: clientId,
      design: widgetDesign ? 'included' : 'null',
      display: widgetDisplay ? 'included' : 'null',
    });
    
    return new Response(
      JSON.stringify({
        success: true,
        events: formattedEvents,
        count: formattedEvents.length,
        client_id: clientId,
        design: widgetDesign, // Include widget design settings in response
        display: widgetDisplay, // Include widget display settings (responsive) in response
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});