import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Edge function to get notifications for a specific widget based on its rules
// Public endpoint - no auth required since we use service role internally
Deno.serve(async (req) => {
  console.log('get-widget-notifications function called');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Allow GET requests without authentication (public read-only endpoint)
  // Using service role key internally to bypass RLS
  
  try {
    const url = new URL(req.url);
    const widgetId = url.searchParams.get('widget_id');
    const siteId = url.searchParams.get('site_id');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    if (!widgetId && !siteId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'widget_id or site_id is required'
      }), {
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch widgets for the site
    let widgetsQuery = supabase
      .from('widgets')
      .select('*')
      .eq('is_active', true);

    if (widgetId) {
      widgetsQuery = widgetsQuery.eq('id', widgetId);
    } else if (siteId) {
      widgetsQuery = widgetsQuery.eq('site_id', siteId);
    }

    const { data: widgets, error: widgetsError } = await widgetsQuery;

    if (widgetsError) {
      console.error('Error fetching widgets:', widgetsError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch widgets',
        details: widgetsError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!widgets || widgets.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        widgets: [],
        notifications: []
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Process each widget and fetch matching events
    const widgetNotifications = [];

    for (const widget of widgets) {
      const config = widget.config || {};
      const rules = config.rules || {};
      const display = config.display || {};
      
      // Extract rule parameters
      const eventTypes = rules.eventTypes || ['purchase', 'signup', 'form_submit'];
      const timeWindowHours = rules.timeWindowHours || 24;
      const minValue = rules.minValue || 0;
      const excludeTestEvents = rules.excludeTestEvents !== false;

      // Calculate time threshold
      const timeThreshold = new Date();
      timeThreshold.setHours(timeThreshold.getHours() - timeWindowHours);
      const thresholdISO = timeThreshold.toISOString();

      console.log('Fetching events for widget:', widget.id);
      console.log('Event types:', eventTypes);
      console.log('Time threshold:', thresholdISO);

      // Build query for events
      let eventsQuery = supabase
        .from('events')
        .select('*')
        .eq('site_id', widget.site_id)
        .in('type', eventTypes)
        .gte('timestamp', thresholdISO)
        .order('timestamp', { ascending: false })
        .limit(limit);

      const { data: events, error: eventsError } = await eventsQuery;

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
        continue;
      }

      if (!events || events.length === 0) {
        console.log('No events found for widget:', widget.id);
        continue;
      }

      console.log(`Found ${events.length} events for widget:`, widget.id);

      // Transform events into notifications
      const notifications = events.map(event => {
        const metadata = event.metadata || {};
        const eventType = event.type || event.event_type;
        
        // Generate notification content based on event type
        let title = '';
        let message = '';
        let icon = '🔔';
        
        switch (eventType) {
          case 'purchase':
            title = metadata.customer_name || metadata.user_name || 'Someone';
            message = `purchased ${metadata.product_name || metadata.product || 'a product'}`;
            icon = '🛍️';
            if (metadata.value || metadata.amount) {
              message += ` for $${metadata.value || metadata.amount}`;
            }
            break;
            
          case 'signup':
            title = metadata.customer_name || metadata.user_name || 'Someone';
            message = 'signed up';
            icon = '👤';
            if (metadata.location) {
              message += ` from ${metadata.location}`;
            }
            break;
            
          case 'form_submit':
            title = metadata.customer_name || metadata.user_name || 'Someone';
            message = `submitted ${metadata.form_type || 'a form'}`;
            icon = '📝';
            if (metadata.location) {
              message += ` from ${metadata.location}`;
            }
            break;
            
          case 'review':
            title = metadata.customer_name || metadata.user_name || 'A customer';
            message = `left a ${metadata.rating || '5'}-star review`;
            icon = '⭐';
            break;
            
          case 'add_to_cart':
            title = metadata.customer_name || metadata.user_name || 'Someone';
            message = `added ${metadata.product_name || 'an item'} to cart`;
            icon = '🛒';
            break;
            
          default:
            title = metadata.customer_name || metadata.user_name || 'Someone';
            message = eventType.replace('_', ' ');
            icon = '🔔';
        }

        // Calculate time ago
        const eventTime = new Date(event.timestamp);
        const now = new Date();
        const diffMs = now.getTime() - eventTime.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        
        let timeAgo = '';
        if (diffMins < 1) timeAgo = 'Just now';
        else if (diffMins < 60) timeAgo = `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
        else if (diffMins < 1440) timeAgo = `${Math.floor(diffMins / 60)} ${Math.floor(diffMins / 60) === 1 ? 'hour' : 'hours'} ago`;
        else timeAgo = `${Math.floor(diffMins / 1440)} ${Math.floor(diffMins / 1440) === 1 ? 'day' : 'days'} ago`;

        return {
          id: event.id,
          widget_id: widget.id,
          event_type: eventType,
          title,
          message,
          icon,
          location: metadata.location || null,
          timestamp: event.timestamp,
          timeAgo,
          displayDuration: display.displayDuration || 8,
          showTimestamp: display.showTimestamp !== false,
          showLocation: display.showLocation !== false && !!metadata.location,
          metadata: metadata
        };
      });

      widgetNotifications.push({
        widget_id: widget.id,
        widget_name: widget.name || config.name,
        widget_type: config.template_id || widget.type,
        notifications: notifications,
        count: notifications.length
      });
    }

    return new Response(JSON.stringify({
      success: true,
      widgets: widgetNotifications,
      total_notifications: widgetNotifications.reduce((sum, w) => sum + w.count, 0),
      query_time: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
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
