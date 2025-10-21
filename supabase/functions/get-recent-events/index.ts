import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Edge function to get recent events for dashboard display
Deno.serve(async (req) => {
  console.log('get-recent-events function called');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get parameters
    const url = new URL(req.url);
    const siteId = url.searchParams.get('site_id');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const eventType = url.searchParams.get('event_type'); // Optional filter
    const hoursAgo = parseInt(url.searchParams.get('hours_ago') || '24');

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
    timeThreshold.setHours(timeThreshold.getHours() - hoursAgo);
    const thresholdISO = timeThreshold.toISOString();

    console.log('Querying events for site:', siteId);
    console.log('Time threshold:', thresholdISO);
    console.log('Limit:', limit);

    // Build query
    let query = supabase
      .from('events')
      .select('*')
      .eq('site_id', siteId)
      .gte('timestamp', thresholdISO)
      .order('timestamp', { ascending: false })
      .limit(limit);

    // Add event type filter if specified
    if (eventType) {
      query = query.eq('type', eventType);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to query events',
        details: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Transform events into notification-ready format
    const transformedEvents = events?.map(event => {
      // Extract data from metadata
      const metadata = event.metadata || {};
      
      // Determine notification type and template
      const notificationType = event.type || event.event_type;
      
      // Generate user-friendly message based on event type
      let title = '';
      let message = '';
      let icon = 'bell';
      
      switch (notificationType) {
        case 'purchase':
          title = metadata.customer_name || metadata.user_name || 'Someone';
          message = `purchased ${metadata.product_name || metadata.product || 'a product'}`;
          icon = 'shopping-bag';
          if (event.value) {
            message += ` for $${event.value}`;
          }
          break;
          
        case 'signup':
          title = metadata.customer_name || metadata.user_name || 'New user';
          message = 'signed up';
          icon = 'user-plus';
          if (metadata.location || event.location) {
            message += ` from ${metadata.location || event.location}`;
          }
          break;
          
        case 'form_submit':
          title = metadata.customer_name || metadata.user_name || 'Someone';
          message = `submitted ${metadata.form_type || 'a form'}`;
          icon = 'file-text';
          break;
          
        case 'review':
          title = metadata.customer_name || metadata.user_name || 'A customer';
          message = `left a ${metadata.rating || '5'}-star review`;
          icon = 'star';
          break;
          
        case 'add_to_cart':
          title = metadata.customer_name || metadata.user_name || 'Someone';
          message = `added ${metadata.product_name || 'a product'} to cart`;
          icon = 'shopping-cart';
          break;
          
        case 'page_view':
          title = 'Page View';
          message = event.path || event.url || 'Page visited';
          icon = 'eye';
          break;
          
        case 'visitor_active':
          // Skip visitor_active events for notifications
          return null;
          
        default:
          title = notificationType;
          message = metadata.description || 'Activity detected';
          icon = 'activity';
      }
      
      // Calculate time ago
      const timeAgo = calculateTimeAgo(new Date(event.timestamp));
      
      return {
        id: event.id,
        event_id: event.id,
        site_id: event.site_id,
        type: notificationType,
        title,
        message,
        icon,
        customer_name: metadata.customer_name || metadata.user_name || null,
        location: metadata.location || event.location || null,
        product_name: metadata.product_name || event.product_name || null,
        value: event.value || metadata.value || null,
        currency: event.currency || metadata.currency || 'USD',
        timestamp: event.timestamp,
        timeAgo,
        url: event.url,
        session_id: event.session_id,
        platform: event.platform || metadata.platform || 'custom',
        metadata: metadata,
        // Notification-ready config
        notification_config: {
          template: notificationType,
          displayDuration: 8,
          showTimestamp: true,
          showLocation: !!metadata.location,
          icon: icon,
          title: title,
          message: message,
          timestamp: timeAgo
        }
      };
    }).filter(e => e !== null) || []; // Filter out null events (like visitor_active)

    // Calculate event statistics
    const stats = {
      total_events: transformedEvents.length,
      event_types: {},
      last_event: transformedEvents[0]?.timestamp || null,
      time_range_hours: hoursAgo
    };

    // Count events by type
    transformedEvents.forEach(event => {
      const type = event.type;
      stats.event_types[type] = (stats.event_types[type] || 0) + 1;
    });

    console.log('Transformed events:', transformedEvents.length);

    return new Response(JSON.stringify({
      success: true,
      site_id: siteId,
      events: transformedEvents,
      stats: stats,
      query_time: new Date().toISOString()
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
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper function to calculate time ago
function calculateTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return `${Math.floor(seconds / 604800)} weeks ago`;
}
