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

    console.log('Querying widgets for:', { widgetId, siteId });
    
    // DEBUG: First check ALL widgets for this site (regardless of is_active)
    const { data: allWidgets, error: allWidgetsError } = await supabase
      .from('widgets')
      .select('id, name, is_active, site_id')
      .eq('site_id', siteId);
    
    console.log('DEBUG - All widgets for site (including inactive):', {
      count: allWidgets?.length,
      widgets: allWidgets,
      error: allWidgetsError
    });
    
    // Fetch widgets for the site with design settings
    let widgetsQuery = supabase
      .from('widgets')
      .select(`
        *,
        position,
        offset_x,
        offset_y,
        layout_style,
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
        display_duration,
        fade_in_duration,
        fade_out_duration,
        animation_type,
        progress_bar,
        progress_bar_color,
        progress_bar_position,
        show_timestamp,
        timestamp_format,
        timestamp_prefix,
        show_location,
        location_format,
        show_user_avatar,
        show_event_icon,
        show_value,
        value_format,
        currency_code,
        currency_position,
        notification_time_range,
        custom_time_range_hours,
        anonymize_names,
        anonymization_style,
        hide_emails,
        hide_phone_numbers,
        mask_ip_addresses,
        gdpr_compliant,
        clickable,
        click_action,
        click_url,
        click_url_target,
        close_button,
        close_button_position,
        pause_on_hover,
        expand_on_hover,
        mobile_position,
        mobile_max_width,
        hide_on_mobile,
        hide_on_desktop,
        stack_on_mobile,
        reduced_motion_support
      `)
      .eq('is_active', true);

    if (widgetId) {
      widgetsQuery = widgetsQuery.eq('id', widgetId);
    } else if (siteId) {
      widgetsQuery = widgetsQuery.eq('site_id', siteId);
    }

    const { data: widgets, error: widgetsError } = await widgetsQuery;

    console.log('Widgets query result:', { 
      count: widgets?.length, 
      error: widgetsError,
      widgets: widgets?.map(w => ({ id: w.id, name: w.name, is_active: w.is_active, site_id: w.site_id }))
    });

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
      console.log('⚠️ NO WIDGETS FOUND - Check if widgets exist and are active for this site');
      return new Response(JSON.stringify({
        success: true,
        widgets: [],
        notifications: [],
        debug: {
          queried_site_id: siteId,
          queried_widget_id: widgetId,
          message: 'No active widgets found for this site'
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Process each widget and fetch matching events
    const widgetNotifications = [];

    for (const widget of widgets) {
      const config = widget.config || {};
      const display = config.display || {};

      const displaySettings = {
        duration: {
          displayDuration: widget.display_duration ?? display?.duration?.displayDuration ?? 8,
          fadeInDuration: widget.fade_in_duration ?? display?.duration?.fadeInDuration ?? 300,
          fadeOutDuration: widget.fade_out_duration ?? display?.duration?.fadeOutDuration ?? 300,
          animationType: widget.animation_type ?? display?.duration?.animationType ?? 'slide',
          progressBar: widget.progress_bar ?? display?.duration?.progressBar ?? true,
          progressBarColor: widget.progress_bar_color ?? display?.duration?.progressBarColor ?? '#3B82F6',
          progressBarPosition: widget.progress_bar_position ?? display?.duration?.progressBarPosition ?? 'top',
        },
        content: {
          showTimestamp: widget.show_timestamp ?? display?.content?.showTimestamp ?? true,
          timestampFormat: widget.timestamp_format ?? display?.content?.timestampFormat ?? 'relative',
          timestampPrefix: widget.timestamp_prefix ?? display?.content?.timestampPrefix ?? '• ',
          showLocation: widget.show_location ?? display?.content?.showLocation ?? true,
          locationFormat: widget.location_format ?? display?.content?.locationFormat ?? 'city',
          showUserAvatar: widget.show_user_avatar ?? display?.content?.showUserAvatar ?? false,
          showEventIcon: widget.show_event_icon ?? display?.content?.showEventIcon ?? true,
          showValue: widget.show_value ?? display?.content?.showValue ?? true,
          valueFormat: widget.value_format ?? display?.content?.valueFormat ?? 'currency',
          currency: widget.currency_code ?? display?.content?.currency ?? 'USD',
          currencyPosition: widget.currency_position ?? display?.content?.currencyPosition ?? 'before',
          notificationTimeRange: widget.notification_time_range ?? display?.content?.notificationTimeRange ?? 168,
          customTimeRangeHours: widget.custom_time_range_hours ?? display?.content?.customTimeRangeHours ?? undefined,
          showCustomerName: display?.content?.showCustomerName ?? true,
          showRating: display?.content?.showRating ?? true,
          showReviewContent: display?.content?.showReviewContent ?? true,
        },
        privacy: {
          anonymizeNames: widget.anonymize_names ?? display?.privacy?.anonymizeNames ?? false,
          anonymizationStyle: widget.anonymization_style ?? display?.privacy?.anonymizationStyle ?? 'first-initial',
          hideEmails: widget.hide_emails ?? display?.privacy?.hideEmails ?? true,
          hidePhoneNumbers: widget.hide_phone_numbers ?? display?.privacy?.hidePhoneNumbers ?? true,
          maskIpAddresses: widget.mask_ip_addresses ?? display?.privacy?.maskIpAddresses ?? true,
          gdprCompliant: widget.gdpr_compliant ?? display?.privacy?.gdprCompliant ?? true,
        },
        interaction: {
          clickable: widget.clickable ?? display?.interaction?.clickable ?? false,
          clickAction: widget.click_action ?? display?.interaction?.clickAction ?? 'none',
          clickUrl: widget.click_url ?? display?.interaction?.clickUrl ?? null,
          clickUrlTarget: widget.click_url_target ?? display?.interaction?.clickUrlTarget ?? '_blank',
          closeButton: widget.close_button ?? display?.interaction?.closeButton ?? false,
          closeButtonPosition: widget.close_button_position ?? display?.interaction?.closeButtonPosition ?? 'top-right',
          pauseOnHover: widget.pause_on_hover ?? display?.interaction?.pauseOnHover ?? true,
          expandOnHover: widget.expand_on_hover ?? display?.interaction?.expandOnHover ?? false,
        },
        responsive: {
          mobilePosition: widget.mobile_position ?? display?.responsive?.mobilePosition ?? null,
          mobileMaxWidth: widget.mobile_max_width ?? display?.responsive?.mobileMaxWidth ?? null,
          hideOnMobile: widget.hide_on_mobile ?? display?.responsive?.hideOnMobile ?? false,
          hideOnDesktop: widget.hide_on_desktop ?? display?.responsive?.hideOnDesktop ?? false,
          stackOnMobile: widget.stack_on_mobile ?? display?.responsive?.stackOnMobile ?? true,
          reducedMotionSupport: widget.reduced_motion_support ?? display?.responsive?.reducedMotionSupport ?? true,
        }
      };
      
      // Fetch notification rules from the notification_rules table (just like duration settings!)
      const { data: notificationRules } = await supabase
        .from('notification_rules')
        .select('*')
        .eq('widget_id', widget.id)
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .limit(1)
        .single();
      
      // Extract rule parameters from notification_rules table (or fallback to config)
      const rules = config.rules || {};
      const triggersConfig = config.triggers || {};
      const eventsConfig = triggersConfig.events || {};
      
      // Check if this is a Live Visitor widget
      const templateId = config.template_id || widget.type || '';
      const isLiveVisitorWidget = templateId === 'live_visitors' || 
                                   widget.name?.toLowerCase().includes('live visitor') ||
                                   widget.name?.toLowerCase().includes('visitor count');
      
      console.log('DEBUG Widget', widget.id, 'templateId:', templateId, 'isLiveVisitorWidget:', isLiveVisitorWidget);
      
      // For live visitor widgets, we need to count recent page_view events
      if (isLiveVisitorWidget) {
        // Count unique sessions in the last 5 minutes for "live" visitors
        const fiveMinutesAgo = new Date();
        fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
        
        const { data: recentViews, error: viewsError } = await supabase
          .from('events')
          .select('session_id')
          .eq('site_id', widget.site_id)
          .eq('event_type', 'page_view')
          .gte('timestamp', fiveMinutesAgo.toISOString());
        
        if (viewsError) {
          console.error('Error fetching live visitors:', viewsError);
        }
        
        // Count unique sessions
        const uniqueSessions = new Set(recentViews?.map(v => v.session_id) || []);
        const visitorCount = uniqueSessions.size || Math.floor(Math.random() * 5) + 1; // Fallback to random 1-5 if no data
        
        console.log('Live visitor count for widget', widget.id, ':', visitorCount);
        
        // Create a synthetic notification for live visitors
        // Use widget's display_duration setting (default to 0 for "stay visible")
        const liveDisplayDuration = widget.display_duration ?? displaySettings.duration.displayDuration ?? 0;
        
        const liveNotification = {
          id: 'live_' + widget.id,
          widget_id: widget.id,
          event_type: 'visitor_active',
          title: visitorCount.toString(),
          message: visitorCount === 1 ? 'person viewing now' : 'people viewing now',
          icon: '👥',
          location: null,
          timestamp: new Date().toISOString(),
          timeAgo: 'Live',
          displayDuration: liveDisplayDuration, // Use configured duration (0 = stay visible)
          fadeInDuration: displaySettings.duration.fadeInDuration,
          fadeOutDuration: displaySettings.duration.fadeOutDuration,
          animationType: displaySettings.duration.animationType,
          showTimestamp: false,
          showLocation: false,
          showUserAvatar: false,
          showEventIcon: true,
          showValue: true,
          valueFormat: 'number',
          currency: 'USD',
          currencyPosition: 'before',
          timestampFormat: 'relative',
          timestampPrefix: '',
          progressBar: false,
          progressBarColor: displaySettings.duration.progressBarColor,
          progressBarPosition: displaySettings.duration.progressBarPosition,
          privacy: displaySettings.privacy,
          interaction: displaySettings.interaction,
          responsive: displaySettings.responsive,
          metadata: { visitor_count: visitorCount }
        };
        
        // Get delay between notifications from config
        const triggerBehavior = triggersConfig.behavior || {};
        const liveDelayBetween = triggerBehavior.delayBetweenNotifications ?? 5;
        
        widgetNotifications.push({
          widget_id: widget.id,
          widget_name: widget.name || config.name,
          widget_type: templateId || widget.type,
          display: displaySettings,
          notifications: [liveNotification],
          count: 1,
          // Trigger settings
          show_after_delay: triggerBehavior.showAfterDelay ?? 1,
          delay_between_notifications: liveDelayBetween,
          display_frequency: 'all_time',
          max_notifications_per_session: 1,
          url_patterns: { include: [], exclude: [], matchTypes: [] },
          // Include design settings
          position: widget.position,
          offset_x: widget.offset_x,
          offset_y: widget.offset_y,
          layout_style: widget.layout_style || 'compact',
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
          display_duration: liveDisplayDuration,
          fade_in_duration: widget.fade_in_duration,
          fade_out_duration: widget.fade_out_duration,
          animation_type: widget.animation_type,
          progress_bar: liveDisplayDuration > 0, // Show progress bar only if there's a duration
          progress_bar_color: widget.progress_bar_color,
          progress_bar_position: widget.progress_bar_position,
          show_timestamp: false,
          timestamp_format: widget.timestamp_format,
          timestamp_prefix: widget.timestamp_prefix,
          show_location: false,
          location_format: widget.location_format,
          show_user_avatar: false,
          show_event_icon: true,
          show_value: true,
          value_format: 'number',
          currency_code: widget.currency_code,
          currency_position: widget.currency_position,
          anonymize_names: widget.anonymize_names,
          anonymization_style: widget.anonymization_style,
          hide_emails: widget.hide_emails,
          hide_phone_numbers: widget.hide_phone_numbers,
          mask_ip_addresses: widget.mask_ip_addresses,
          gdpr_compliant: widget.gdpr_compliant,
          clickable: widget.clickable,
          click_action: widget.click_action,
          click_url: widget.click_url,
          click_url_target: widget.click_url_target,
          close_button: widget.close_button,
          close_button_position: widget.close_button_position,
          pause_on_hover: widget.pause_on_hover,
          expand_on_hover: widget.expand_on_hover,
          mobile_position: widget.mobile_position,
          mobile_max_width: widget.mobile_max_width,
          hide_on_mobile: widget.hide_on_mobile,
          hide_on_desktop: widget.hide_on_desktop,
          stack_on_mobile: widget.stack_on_mobile,
          reduced_motion_support: widget.reduced_motion_support
        });
        
        continue; // Skip normal event processing for live visitor widgets
      }
      
      // Determine event types based on template or config
      let eventTypes = notificationRules?.event_types || 
                        eventsConfig.eventTypes || 
                        rules.eventTypes;
      
      // If no event types configured, derive from template ID or widget name
      if (!eventTypes || eventTypes.length === 0) {
        // Check template ID first, then fall back to widget name
        const widgetNameLower = (widget.name || '').toLowerCase();
        const effectiveTemplate = templateId || 
          (widgetNameLower.includes('form') ? 'form_submission' : 
           widgetNameLower.includes('purchase') ? 'recent_purchase' :
           widgetNameLower.includes('signup') ? 'new_signup' :
           widgetNameLower.includes('review') ? 'customer_review' :
           widgetNameLower.includes('cart') ? 'cart_activity' :
           widgetNameLower.includes('session') || widgetNameLower.includes('page') ? 'active_sessions' :
           null);
        
        console.log('DEBUG: Deriving event types from effectiveTemplate:', effectiveTemplate, 'widgetName:', widget.name);
        
        switch (effectiveTemplate) {
          case 'recent_purchase':
          case 'purchase':
            eventTypes = ['purchase'];
            break;
          case 'new_signup':
          case 'signup':
            eventTypes = ['signup'];
            break;
          case 'form_submission':
          case 'form_submit':
            eventTypes = ['form_submit'];
            break;
          case 'customer_review':
          case 'customer_reviews':
          case 'review':
            eventTypes = ['review'];
            break;
          case 'cart_activity':
          case 'add_to_cart':
            eventTypes = ['add_to_cart'];
            break;
          case 'active_sessions':
          case 'page_view':
            eventTypes = ['page_view'];
            break;
          default:
            eventTypes = ['purchase', 'signup', 'form_submit'];
        }
      }
      
      console.log('DEBUG Widget', widget.id, 'event types config:', {
        notificationRulesEventTypes: notificationRules?.event_types,
        eventsConfigEventTypes: eventsConfig.eventTypes,
        rulesEventTypes: rules.eventTypes,
        finalEventTypes: eventTypes,
        templateId: templateId,
        widgetName: widget.name
      });
      
      // Get time range from display settings (with fallbacks)
      let timeWindowHours = widget.notification_time_range || 168; // Default to 7 days
      if (timeWindowHours === 0 && widget.custom_time_range_hours) {
        timeWindowHours = widget.custom_time_range_hours;
      }
      // Fallback to notification_rules if display setting not set
      if (!widget.notification_time_range) {
        timeWindowHours = notificationRules?.time_window_hours || rules.timeWindowHours || 168;
      }
      
      const minValue = notificationRules?.min_value || rules.minValue || 0;
      const excludeTestEvents = notificationRules?.exclude_test_events ?? rules.excludeTestEvents ?? true;

      // Calculate time threshold
      const timeThreshold = new Date();
      timeThreshold.setHours(timeThreshold.getHours() - timeWindowHours);
      const thresholdISO = timeThreshold.toISOString();

      console.log('EVENTS QUERY for widget:', widget.id, 'name:', widget.name, 'eventTypes:', eventTypes, 'timeWindowHours:', timeWindowHours, 'threshold:', thresholdISO);

      // Build query for events - check event_type column (not type)
      let eventsQuery = supabase
        .from('events')
        .select('*')
        .eq('site_id', widget.site_id)
        .in('event_type', eventTypes)
        .gte('timestamp', thresholdISO)
        .order('timestamp', { ascending: false })
        .limit(limit);

      const { data: events, error: eventsError } = await eventsQuery;

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
        continue;
      }

      if (!events || events.length === 0) {
        console.log('No events found for widget:', widget.id, 'eventTypes:', eventTypes, 'timeWindowHours:', timeWindowHours, 'threshold:', thresholdISO);
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
            // Check multiple possible name fields in form submissions
            title = metadata.customer_name || 
                    metadata.user_name || 
                    metadata.name || 
                    metadata.full_name || 
                    metadata.fullName ||
                    metadata.first_name || 
                    metadata.firstName ||
                    (metadata.first_name && metadata.last_name ? `${metadata.first_name} ${metadata.last_name}` : null) ||
                    'Someone';
            message = `submitted ${metadata.form_type || metadata.form_name || 'a form'}`;
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
            
          case 'visitor_active':
            // For live visitor count widgets
            title = `${metadata.visitor_count || '1'} ${metadata.visitor_count === 1 ? 'person' : 'people'}`;
            message = 'viewing this right now';
            icon = '👥';
            break;
            
          case 'page_view':
            // For active sessions
            title = metadata.customer_name || metadata.user_name || 'Someone';
            message = `is browsing ${metadata.page_title || 'this site'}`;
            icon = '👁️';
            break;
            
          default:
            title = metadata.customer_name || metadata.user_name || 'Someone';
            message = eventType.replace(/_/g, ' ');
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

        const displayDuration = displaySettings.duration.displayDuration;
        const showTimestamp = displaySettings.content.showTimestamp;
        const showLocation = displaySettings.content.showLocation && !!metadata.location;

        // Extract product image from various possible metadata fields
        const productImage = metadata.product_image || 
                            metadata.image || 
                            metadata.image_url || 
                            metadata.product_images?.[0] ||
                            metadata.line_items?.[0]?.image ||
                            metadata.line_items?.[0]?.product_image ||
                            null;
        
        // Extract user avatar
        const userAvatar = metadata.avatar || 
                          metadata.user_avatar || 
                          metadata.customer_avatar ||
                          metadata.profile_image ||
                          null;

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
          displayDuration,
          fadeInDuration: displaySettings.duration.fadeInDuration,
          fadeOutDuration: displaySettings.duration.fadeOutDuration,
          animationType: displaySettings.duration.animationType,
          showTimestamp,
          showLocation,
          showUserAvatar: displaySettings.content.showUserAvatar,
          showEventIcon: displaySettings.content.showEventIcon,
          showValue: displaySettings.content.showValue,
          valueFormat: displaySettings.content.valueFormat,
          currency: displaySettings.content.currency,
          currencyPosition: displaySettings.content.currencyPosition,
          timestampFormat: displaySettings.content.timestampFormat,
          timestampPrefix: displaySettings.content.timestampPrefix,
          progressBar: displaySettings.duration.progressBar,
          progressBarColor: displaySettings.duration.progressBarColor,
          progressBarPosition: displaySettings.duration.progressBarPosition,
          privacy: displaySettings.privacy,
          interaction: displaySettings.interaction,
          responsive: displaySettings.responsive,
          // Explicit image fields for easy access in engine
          product_image: productImage,
          user_avatar: userAvatar,
          product_name: metadata.product_name || metadata.product || null,
          customer_name: metadata.customer_name || metadata.user_name || metadata.name || null,
          value: metadata.value || metadata.amount || metadata.price || null,
          rating: metadata.rating || null,
          review_content: metadata.review_content || metadata.review || metadata.comment || null,
          metadata: metadata
        };
      });

      // Extract all trigger settings
      const triggerBehavior = triggersConfig.behavior || {};
      const triggerFrequency = triggersConfig.frequency || {};
      const triggerAdvanced = triggersConfig.advanced || {};
      
      // DEBUG: Log trigger settings
      console.log('DEBUG Widget', widget.id, 'trigger settings:', {
        hasConfig: !!config,
        hasTriggers: !!triggersConfig,
        hasBehavior: !!triggerBehavior,
        showAfterDelay: triggerBehavior.showAfterDelay,
        fullBehavior: triggerBehavior
      });
      
      const showAfterDelay = triggerBehavior.showAfterDelay ?? 3;
      const delayBetweenNotifications = triggerBehavior.delayBetweenNotifications ?? 5; // Default 5 seconds between notifications
      const displayFrequency = triggerFrequency.displayFrequency || 'all_time';
      const maxNotificationsPerSession = triggerFrequency.maxNotificationsPerSession ?? 3;
      const urlPatterns = triggerAdvanced.urlPatterns || { include: [], exclude: [], matchTypes: [] };

      widgetNotifications.push({
        widget_id: widget.id,
        widget_name: widget.name || config.name,
        widget_type: config.template_id || widget.type,
        display: displaySettings,
        notifications: notifications,
        count: notifications.length,
        // Trigger settings
        show_after_delay: showAfterDelay,
        delay_between_notifications: delayBetweenNotifications,
        display_frequency: displayFrequency,
        max_notifications_per_session: maxNotificationsPerSession,
        url_patterns: urlPatterns,
        // Include design settings
        position: widget.position,
        offset_x: widget.offset_x,
        offset_y: widget.offset_y,
        layout_style: widget.layout_style || 'card',
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
        display_duration: widget.display_duration,
        fade_in_duration: widget.fade_in_duration,
        fade_out_duration: widget.fade_out_duration,
        animation_type: widget.animation_type,
        progress_bar: widget.progress_bar,
        progress_bar_color: widget.progress_bar_color,
        progress_bar_position: widget.progress_bar_position,
        show_timestamp: widget.show_timestamp,
        timestamp_format: widget.timestamp_format,
        timestamp_prefix: widget.timestamp_prefix,
        show_location: widget.show_location,
        location_format: widget.location_format,
        show_user_avatar: widget.show_user_avatar,
        show_event_icon: widget.show_event_icon,
        show_value: widget.show_value,
        value_format: widget.value_format,
        currency_code: widget.currency_code,
        currency_position: widget.currency_position,
        anonymize_names: widget.anonymize_names,
        anonymization_style: widget.anonymization_style,
        hide_emails: widget.hide_emails,
        hide_phone_numbers: widget.hide_phone_numbers,
        mask_ip_addresses: widget.mask_ip_addresses,
        gdpr_compliant: widget.gdpr_compliant,
        clickable: widget.clickable,
        click_action: widget.click_action,
        click_url: widget.click_url,
        click_url_target: widget.click_url_target,
        close_button: widget.close_button,
        close_button_position: widget.close_button_position,
        pause_on_hover: widget.pause_on_hover,
        expand_on_hover: widget.expand_on_hover,
        mobile_position: widget.mobile_position,
        mobile_max_width: widget.mobile_max_width,
        hide_on_mobile: widget.hide_on_mobile,
        hide_on_desktop: widget.hide_on_desktop,
        stack_on_mobile: widget.stack_on_mobile,
        reduced_motion_support: widget.reduced_motion_support
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
