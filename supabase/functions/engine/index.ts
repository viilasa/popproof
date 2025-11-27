import { corsHeaders } from '../_shared/cors.ts';

// Edge function to serve the widget engine script
Deno.serve((req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const engineCode = `(function() {
    console.log("ProofPop Widget Engine v2.6 Loaded - CENTER-TOP VERTICAL SLIDE");

    const WIDGET_API_URL = 'https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/get-widgets';
    const TRACK_EVENT_URL = 'https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/track-event';
    const VERIFY_PIXEL_URL = 'https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/verify-pixel';
    const WIDGET_NOTIFICATIONS_URL = 'https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/get-widget-notifications';
    const TRACK_IMPRESSION_URL = 'https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/track-impression';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaW9idXVibW52bGF1a2V5dXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0Njg2MzcsImV4cCI6MjA3MTA0NDYzN30.NR47GOGkExUmoNKQqdhWO4DR7SAQd9W3iZ5r8t1nC7s';

    // Find the script tag and get the site_id
    const scriptTag = document.querySelector('script[data-site-id]') || document.currentScript;
    if (!scriptTag) {
        console.error('ProofPop: Widget script tag with data-site-id not found.');
        return;
    }
    const siteId = scriptTag.getAttribute('data-site-id');
    
    if (!siteId) {
        console.error('ProofPop: data-site-id attribute is required.');
        return;
    }
    
    console.log('ProofPop: Initializing for site:', siteId);

    // Generate session ID for tracking
    const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Note: page_view tracking is handled by pixel-loader, not engine
    // This prevents duplicate page_view events
    
    // ==================== TRIGGER VALIDATION FUNCTIONS ====================
    
    // Check if current URL matches widget's URL patterns
    function matchesUrlPattern(urlPatterns) {
        if (!urlPatterns || (!urlPatterns.include || urlPatterns.include.length === 0)) {
            return true; // No patterns = show on all pages
        }
        
        const currentUrl = window.location.href;
        const currentPath = window.location.pathname;
        
        // Check include patterns
        for (let i = 0; i < urlPatterns.include.length; i++) {
            const pattern = urlPatterns.include[i];
            const matchType = urlPatterns.matchTypes && urlPatterns.matchTypes[i] ? urlPatterns.matchTypes[i] : 'contains';
            
            if (matchType === 'exact') {
                if (currentUrl === pattern || currentPath === pattern) return true;
            } else if (matchType === 'contains') {
                if (currentUrl.includes(pattern) || currentPath.includes(pattern)) return true;
            } else if (matchType === 'starts') {
                if (currentUrl.startsWith(pattern) || currentPath.startsWith(pattern)) return true;
            }
        }
        
        return false; // No match found
    }
    
    // Check if device matches display settings
    function matchesDeviceDisplay(displaySettings) {
        const isMobile = window.innerWidth < 768;
        
        if (isMobile && displaySettings.responsive.hideOnMobile) {
            return false;
        }
        if (!isMobile && displaySettings.responsive.hideOnDesktop) {
            return false;
        }
        
        return true;
    }
    
    // Track and check frequency limits
    function checkFrequencyLimit(widgetId, displayFrequency, maxPerSession) {
        const storageKey = 'proofpop_frequency_' + widgetId;
        const sessionKey = 'proofpop_session_' + widgetId;
        
        try {
            if (displayFrequency === 'once_per_session') {
                const shown = sessionStorage.getItem(sessionKey);
                if (shown) return false;
                sessionStorage.setItem(sessionKey, 'true');
                return true;
            } else if (displayFrequency === 'once_per_day') {
                const lastShown = localStorage.getItem(storageKey);
                if (lastShown) {
                    const daysSince = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60 * 24);
                    if (daysSince < 1) return false;
                }
                localStorage.setItem(storageKey, Date.now().toString());
                return true;
            } else {
                // all_time - check max per session
                let count = parseInt(sessionStorage.getItem(sessionKey) || '0');
                if (count >= maxPerSession) return false;
                sessionStorage.setItem(sessionKey, (count + 1).toString());
                return true;
            }
        } catch (e) {
            console.warn('ProofPop: Storage not available, showing notification anyway');
            return true;
        }
    }
    
    // Verify pixel installation
    verifyPixelInstallation();

    // Verify pixel installation
    async function verifyPixelInstallation() {
        try {
            const response = await fetch(VERIFY_PIXEL_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    site_id: siteId,
                    url: window.location.href,
                    user_agent: navigator.userAgent,
                    session_id: sessionId
                })
            });
            
            if (response.ok) {
                console.log('ProofPop: Pixel verification successful');
                // Dispatch custom event for verification success
                window.dispatchEvent(new CustomEvent('proofpop:verified', {
                    detail: { success: true, siteId: siteId }
                }));
            }
        } catch (error) {
            console.warn('ProofPop: Pixel verification failed:', error);
        }
    }
    
    // Track events
    async function trackEvent(eventType, eventData = {}) {
        try {
            const response = await fetch(TRACK_EVENT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    site_id: siteId,
                    event_type: eventType,
                    session_id: sessionId,
                    url: window.location.href,
                    user_agent: navigator.userAgent,
                    referrer: document.referrer,
                    timestamp: new Date().toISOString(),
                    event_data: eventData
                })
            });
            
            if (response.ok) {
                console.log('ProofPop: Event tracked:', eventType);
                // Dispatch custom event
                window.dispatchEvent(new CustomEvent('proofpop:event-tracked', {
                    detail: { eventType, success: true }
                }));
            }
        } catch (error) {
            console.warn('ProofPop: Event tracking failed:', error);
        }
    }
    
    // Track notification impressions using Edge Function
    async function trackNotificationImpression(notification) {
        try {
            const response = await fetch(TRACK_IMPRESSION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event_id: notification.id,
                    site_id: siteId,
                    widget_id: notification.widget_id || null,
                    notification_type: notification.event_type || 'unknown',
                    title: notification.title || '',
                    message: notification.message || '',
                    customer_name: notification.metadata?.customer_name || null,
                    location: notification.location || null,
                    product_name: notification.metadata?.product_name || null,
                    amount: notification.metadata?.value || notification.metadata?.amount || null,
                    currency: notification.metadata?.currency || 'USD',
                    icon: notification.icon || null,
                    display_timestamp: notification.timeAgo || null,
                    notification_config: notification.metadata || {}
                })
            });
            
            if (response.ok) {
                console.log('ProofPop: Notification impression tracked');
            } else {
                const errorData = await response.json();
                console.error('ProofPop: Impression tracking failed:', errorData);
            }
        } catch (error) {
            console.error('ProofPop: Impression tracking error:', error);
        }
    }
    
    let notificationQueue = [];
    let currentNotificationIndex = 0;
    let isDisplaying = false; // Flag to prevent overlapping notifications
    let currentNotificationElement = null; // Track current notification element
    const widgetDesignSettings = {}; // Map widget_id -> design settings
    const widgetDisplaySettings = {}; // Map widget_id -> display settings
    const widgetTriggerSettings = {}; // Map widget_id -> trigger settings (delay, etc.)
    const notificationContainers = {}; // Map position -> DOM container

    // Anonymize names based on privacy settings
    function anonymizeName(name, style = 'first-initial') {
        if (!name || typeof name !== 'string') return name;
        
        const parts = name.trim().split(' ');
        if (parts.length === 0) return name;
        
        if (style === 'first-initial') {
            // "John Doe" → "John D."
            const firstName = parts[0];
            const lastInitial = parts.length > 1 ? parts[parts.length - 1].charAt(0).toUpperCase() + '.' : '';
            return lastInitial ? firstName + ' ' + lastInitial : firstName;
        } else if (style === 'first-last-initial') {
            // "John Doe" → "J. D."
            return parts.map(part => part.charAt(0).toUpperCase() + '.').join(' ');
        } else if (style === 'random') {
            // "John Doe" → "User 1234"
            const randomNum = Math.floor(Math.random() * 9000) + 1000;
            return 'User ' + randomNum;
        }
        return name;
    }

    function formatValue(value, format = 'currency', currency = 'USD', position = 'before') {
        const numericValue = typeof value === 'number' ? value : Number(value);
        if (Number.isNaN(numericValue)) {
            return typeof value === 'string' ? value : '';
        }

        if (format === 'currency') {
            try {
                if (position === 'after') {
                    const simple = new Intl.NumberFormat(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(numericValue);
                    return simple + ' ' + currency;
                }
                return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(numericValue);
            } catch (error) {
                console.warn('ProofPop: Currency formatting failed, falling back', error);
                return currency + ' ' + numericValue.toFixed(2);
            }
        }

        if (format === 'number') {
            return new Intl.NumberFormat().format(numericValue);
        }

        return typeof value === 'string' ? value : String(numericValue);
    }

    function getAnimationInitialState(animationType, position) {
        const isRight = position.includes('right');
        const isTop = position.includes('top');
        const isCenterTop = position === 'center-top';

        switch (animationType) {
            case 'fade':
                return { transform: 'none', opacity: '0' };
            case 'bounce':
                return { transform: 'translateY(' + (isTop ? '-24px' : '24px') + ')', opacity: '0' };
            case 'zoom':
                return { transform: 'scale(0.9)', opacity: '0' };
            case 'none':
                return { transform: 'none', opacity: '1' };
            case 'slide':
            default:
                // Center-top slides from above, others slide horizontally
                if (isCenterTop) {
                    return { transform: 'translateY(-120%)', opacity: '0' };
                }
                return { transform: 'translateX(' + (isRight ? '120%' : '-120%') + ')', opacity: '0' };
        }
    }

    function getAnimationFinalState(animationType, position) {
        const isCenterTop = position === 'center-top';
        
        switch (animationType) {
            case 'fade':
            case 'none':
                return { transform: 'none', opacity: '1' };
            case 'bounce':
                return { transform: 'translateY(0)', opacity: '1' };
            case 'zoom':
                return { transform: 'scale(1)', opacity: '1' };
            case 'slide':
            default:
                // Center-top uses translateY(0), others use translateX(0)
                if (isCenterTop) {
                    return { transform: 'translateY(0)', opacity: '1' };
                }
                return { transform: 'translateX(0)', opacity: '1' };
        }
    }

    function getAnimationExitState(animationType, position) {
        const isRight = position.includes('right');
        const isTop = position.includes('top');
        const isCenterTop = position === 'center-top';

        switch (animationType) {
            case 'fade':
                return { transform: 'none', opacity: '0' };
            case 'bounce':
                return { transform: 'translateY(' + (isTop ? '-24px' : '24px') + ')', opacity: '0' };
            case 'zoom':
                return { transform: 'scale(0.9)', opacity: '0' };
            case 'none':
                return { transform: 'none', opacity: '0' };
            case 'slide':
            default:
                // Center-top slides back up, others slide horizontally
                if (isCenterTop) {
                    return { transform: 'translateY(-120%)', opacity: '0' };
                }
                return { transform: 'translateX(' + (isRight ? '120%' : '-120%') + ')', opacity: '0' };
        }
    }

    function getAnimationTransition(animationType, durationMs) {
        switch (animationType) {
            case 'fade':
                return 'opacity ' + durationMs + 'ms ease-out';
            case 'bounce':
                return 'transform ' + Math.max(durationMs, 400) + 'ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 250ms ease-out';
            case 'zoom':
                return 'transform ' + durationMs + 'ms ease-out, opacity 250ms ease-out';
            case 'none':
                return 'none';
            case 'slide':
            default:
                return 'transform ' + durationMs + 'ms cubic-bezier(0.4, 0, 0.2, 1), opacity 240ms ease-out';
        }
    }

    async function fetchAndDisplayWidgets() {
        try {
            // Fetch widgets and their real notifications (public endpoint, no auth needed)
            const response = await fetch(\`\${WIDGET_NOTIFICATIONS_URL}?site_id=\${siteId}&limit=20\`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch widget notifications.');
            }
            const data = await response.json();
            console.log('ProofPop: Fetched notifications:', data);
            
            if (data.success && data.widgets && data.widgets.length > 0) {
                // Store trigger settings for each widget and calculate minimum delay
                let minDelaySeconds = Infinity; // Start with infinity to find true minimum
                
                data.widgets.forEach(widgetData => {
                    widgetDisplaySettings[widgetData.widget_id] = widgetData.display || {};
                    
                    // DEBUG: Log what delay we're receiving from API
                    console.log('ProofPop DEBUG: Widget', widgetData.widget_id, 'show_after_delay from API:', widgetData.show_after_delay, 'type:', typeof widgetData.show_after_delay);
                    
                    // Store trigger settings for each widget
                    const showAfterDelay = widgetData.show_after_delay ?? 3;
                    widgetTriggerSettings[widgetData.widget_id] = {
                        showAfterDelay: showAfterDelay,
                        displayFrequency: widgetData.display_frequency || 'all_time',
                        maxNotificationsPerSession: widgetData.max_notifications_per_session || 3,
                        urlPatterns: widgetData.url_patterns || {}
                    };
                    
                    // Track minimum delay across all widgets for initial display
                    minDelaySeconds = Math.min(minDelaySeconds, showAfterDelay);
                    widgetDesignSettings[widgetData.widget_id] = {
                        position: widgetData.position || 'bottom-left',
                        offset_x: widgetData.offset_x || 20,
                        offset_y: widgetData.offset_y || 20,
                        layout_style: widgetData.layout_style || 'card',
                        max_width: widgetData.max_width || 280,
                        min_width: widgetData.min_width || 240,
                        border_radius: widgetData.border_radius || 12,
                        border_width: widgetData.border_width || 1,
                        border_color: widgetData.border_color || 'rgba(59, 130, 246, 0.2)',
                        border_left_accent: widgetData.border_left_accent ?? true,
                        border_left_accent_width: widgetData.border_left_accent_width || 4,
                        border_left_accent_color: widgetData.border_left_accent_color || '#3B82F6',
                        shadow_enabled: widgetData.shadow_enabled ?? true,
                        shadow_size: widgetData.shadow_size || 'lg',
                        glassmorphism: widgetData.glassmorphism ?? true,
                        backdrop_blur: widgetData.backdrop_blur || 10,
                        background_color: widgetData.background_color || 'rgba(255, 255, 255, 0.95)',
                        background_gradient: widgetData.background_gradient ?? false,
                        gradient_start: widgetData.gradient_start || '#ffffff',
                        gradient_end: widgetData.gradient_end || '#f3f4f6',
                        gradient_direction: widgetData.gradient_direction || 'to-br'
                    };
                });
                
                // Filter and collect notifications from widgets that pass trigger rules
                // NOTE: Do NOT check frequency limits here - that blocks entire widgets
                // Frequency should only be checked when actually displaying notifications
                const allNotifications = [];
                data.widgets.forEach(widgetData => {
                    // Apply trigger validations
                    const urlPatterns = widgetData.url_patterns || {};
                    const displaySettings = widgetData.display || {};
                    
                    // Check URL pattern match
                    if (!matchesUrlPattern(urlPatterns)) {
                        console.log('ProofPop: Widget ' + widgetData.widget_id + ' skipped (URL pattern mismatch)');
                        return;
                    }
                    
                    // Check device display match
                    if (!matchesDeviceDisplay(displaySettings)) {
                        console.log('ProofPop: Widget ' + widgetData.widget_id + ' skipped (device mismatch)');
                        return;
                    }
                    
                    // REMOVED: Frequency limit check during filtering phase
                    // This was causing widgets to be blocked entirely after a few page loads
                    // Frequency limits are now managed by session storage per actual notification display
                    
                    // Widget passed all trigger rules, collect notifications
                    if (widgetData.notifications && widgetData.notifications.length > 0) {
                        widgetData.notifications.forEach(notification => {
                            allNotifications.push({
                                ...notification,
                                widgetName: widgetData.widget_name,
                                widgetType: widgetData.widget_type
                            });
                        });
                    }
                });
                
                // Sort notifications by timestamp (latest first)
                const sortedNotifications = allNotifications.sort((a, b) => {
                    const timeA = new Date(a.timestamp).getTime();
                    const timeB = new Date(b.timestamp).getTime();
                    return timeB - timeA; // Descending order (newest first)
                });
                
                // Smart randomization: Group by widget, then interleave with randomization
                // This ensures we show variety across widgets while keeping recent notifications
                const widgetGroups = {};
                sortedNotifications.forEach(notification => {
                    const widgetId = notification.widget_id;
                    if (!widgetGroups[widgetId]) {
                        widgetGroups[widgetId] = [];
                    }
                    widgetGroups[widgetId].push(notification);
                });
                
                // Interleave notifications from different widgets with randomization
                notificationQueue = [];
                const widgetKeys = Object.keys(widgetGroups);
                let maxLength = Math.max(...Object.values(widgetGroups).map(arr => arr.length));
                
                for (let i = 0; i < maxLength; i++) {
                    // Get one notification from each widget at this index
                    const batch = [];
                    widgetKeys.forEach(widgetId => {
                        if (widgetGroups[widgetId][i]) {
                            batch.push(widgetGroups[widgetId][i]);
                        }
                    });
                    
                    // Shuffle this batch to randomize between widgets
                    for (let j = batch.length - 1; j > 0; j--) {
                        const k = Math.floor(Math.random() * (j + 1));
                        [batch[j], batch[k]] = [batch[k], batch[j]];
                    }
                    
                    notificationQueue.push(...batch);
                }
                
                console.log('ProofPop: Total notifications queued:', notificationQueue.length);
                console.log('ProofPop: Queue (randomized across widgets):', notificationQueue.map(n => ({
                    widget: n.widgetType,
                    title: n.title,
                    timestamp: n.timestamp,
                    timeAgo: n.timeAgo
                })));
                
                // Start displaying notifications if we have any
                if (notificationQueue.length > 0) {
                    // Show first notification after minimum configured delay across all widgets
                    const initialDelayMs = minDelaySeconds * 1000;
                    console.log('ProofPop: Starting notifications after ' + minDelaySeconds + ' seconds (minimum delay across all widgets)');
                    setTimeout(() => {
                        showNextNotification();
                    }, initialDelayMs);
                }
                
                // Dispatch ready event
                window.dispatchEvent(new CustomEvent('proofpop:ready', {
                    detail: { 
                        widgetCount: data.widgets.length,
                        notificationCount: notificationQueue.length
                    }
                }));
            } else {
                console.log('ProofPop: No active notifications found');
            }
        } catch (error) {
            console.error('ProofPop: Error fetching widgets:', error);
        }
    }

    function showNextNotification() {
        if (notificationQueue.length === 0) return;
        
        // Prevent overlapping notifications
        if (isDisplaying) {
            console.log('ProofPop: Notification already displaying, skipping...');
            return;
        }
        
        // Get next notification (cycle through)
        const nextNotification = notificationQueue[currentNotificationIndex];
        const widgetId = nextNotification.widget_id;
        const widgetDisplay = widgetDisplaySettings[widgetId] || {};
        currentNotificationIndex = (currentNotificationIndex + 1) % notificationQueue.length;

        showNotificationWidget(nextNotification, widgetDisplay);
        
        console.log('ProofPop: Showing notification ' + currentNotificationIndex + '/' + notificationQueue.length, {
            title: nextNotification.title,
            message: nextNotification.message,
            timeAgo: nextNotification.timeAgo
        });
        
        // Schedule next notification
        const displayDuration = (widgetDisplay.duration?.displayDuration ?? nextNotification.displayDuration ?? 8) * 1000;
        
        // Use the next widget's trigger delay as the gap between notifications
        const nextWidgetId = notificationQueue[currentNotificationIndex]?.widget_id;
        const nextTriggerSettings = nextWidgetId ? widgetTriggerSettings[nextWidgetId] : null;
        const delayBetween = (nextTriggerSettings?.showAfterDelay ?? 5) * 1000;
        
        // Add fade-out duration to ensure no overlap
        const fadeOutDuration = (widgetDisplay.duration?.fadeOutDuration ?? nextNotification.fadeOutDuration ?? 300);
        const totalWaitTime = displayDuration + fadeOutDuration + delayBetween;
        
        console.log('ProofPop: Next notification in', totalWaitTime / 1000, 'seconds (display:', displayDuration / 1000, 's + fadeOut:', fadeOutDuration / 1000, 's + delay:', delayBetween / 1000, 's)');
        
        setTimeout(() => {
            showNextNotification();
        }, totalWaitTime);
    }

    function getOrCreateContainer(position, design) {
        const key = position || 'bottom-left';
        const offsetX = typeof design.offset_x === 'number' ? design.offset_x : 20;
        const offsetY = typeof design.offset_y === 'number' ? design.offset_y : 20;
        let container = notificationContainers[key];

        if (!container || !document.body.contains(container)) {
            container = document.createElement('div');
            container.setAttribute('data-proofpop-container', key);
            container.style.position = 'fixed';
            container.style.pointerEvents = 'none';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '12px';
            container.style.margin = '0';
            container.style.padding = '0';
            notificationContainers[key] = container;
            document.body.appendChild(container);
        }

        container.style.zIndex = '9998';
        container.style.maxWidth = (design.max_width || 280) + 'px';
        container.style.top = '';
        container.style.bottom = '';
        container.style.left = '';
        container.style.right = '';
        container.style.transform = 'none';
        container.style.alignItems = key.includes('right') ? 'flex-end' : 'flex-start';

        switch (key) {
            case 'top-left':
                container.style.top = offsetY + 'px';
                container.style.left = offsetX + 'px';
                break;
            case 'top-right':
                container.style.top = offsetY + 'px';
                container.style.right = offsetX + 'px';
                break;
            case 'bottom-right':
                container.style.bottom = offsetY + 'px';
                container.style.right = offsetX + 'px';
                break;
            case 'center-top':
                container.style.top = offsetY + 'px';
                container.style.left = '50%';
                container.style.transform = 'translateX(-50%)';
                container.style.alignItems = 'center';
                break;
            case 'bottom-left':
            default:
                container.style.bottom = offsetY + 'px';
                container.style.left = offsetX + 'px';
                break;
        }

        return container;
    }

    function showNotificationWidget(notification, displaySettings = {}) {
        // Remove previous notification if still visible
        if (currentNotificationElement) {
            const outgoing = currentNotificationElement;
            const outgoingPosition = outgoing.getAttribute('data-position') || 'bottom-left';
            const outgoingAnimation = outgoing.getAttribute('data-animation') || 'slide';
            const outgoingFadeOut = Number(outgoing.getAttribute('data-fade-out')) || 300;
            const exitState = getAnimationExitState(outgoingAnimation, outgoingPosition);
            if (exitState.transform) {
                outgoing.style.transform = exitState.transform;
            }
            if (exitState.opacity !== undefined) {
                outgoing.style.opacity = exitState.opacity;
            }
            setTimeout(() => {
                if (outgoing.parentNode) {
                    outgoing.remove();
                }
            }, outgoingFadeOut);
        }

        // Mark as displaying
        isDisplaying = true;

        const widgetElement = document.createElement('div');
        widgetElement.setAttribute('data-proofpop-notification', 'true');

        // Apply dynamic design settings from database
        const design = widgetDesignSettings[notification.widget_id] || {};
        const position = design.position || 'bottom-left';
        const shadowMap = {
            'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        };

        const durationSettings = displaySettings.duration || {};
        const contentSettings = displaySettings.content || {};
        const privacySettings = displaySettings.privacy || {};

        const displayDuration = (durationSettings.displayDuration ?? notification.displayDuration ?? 8) * 1000;
        const fadeInDuration = durationSettings.fadeInDuration ?? notification.fadeInDuration ?? 300;
        const fadeOutDuration = durationSettings.fadeOutDuration ?? notification.fadeOutDuration ?? 300;
        const animationType = durationSettings.animationType ?? notification.animationType ?? 'slide';
        const progressBar = durationSettings.progressBar ?? notification.progressBar ?? true;
        const progressBarColor = durationSettings.progressBarColor ?? notification.progressBarColor ?? '#3B82F6';
        const progressBarPosition = durationSettings.progressBarPosition ?? notification.progressBarPosition ?? 'top';
        const showEventIcon = contentSettings.showEventIcon ?? notification.showEventIcon ?? true;
        const showUserAvatar = contentSettings.showUserAvatar ?? notification.showUserAvatar ?? false;
        const showValue = contentSettings.showValue ?? notification.showValue ?? true;
        const showTimestamp = contentSettings.showTimestamp ?? notification.showTimestamp ?? true;
        const timestampPrefix = contentSettings.timestampPrefix ?? notification.timestampPrefix ?? '• ';

        const initialState = getAnimationInitialState(animationType, position);
        const transitionStyle = getAnimationTransition(animationType, fadeInDuration);

        // Base styles
        const layoutStyle = design.layout_style || 'card';
        const isFullWidth = layoutStyle === 'full-width';
        const isCompact = layoutStyle === 'compact';
        const isMinimal = layoutStyle === 'minimal';
        const isRipple = layoutStyle === 'ripple';
        const isParallax = layoutStyle === 'parallax';
        const isPuzzle = layoutStyle === 'puzzle';
        const isPeekaboo = layoutStyle === 'peekaboo';
        const isFloatingTag = layoutStyle === 'floating-tag';
        const isStoryPop = layoutStyle === 'story-pop';
        const isFrostedToken = layoutStyle === 'frosted-token';
        
        // DEBUG: Log layout style detection
        console.log('ProofPop DEBUG: Widget', notification.widget_id, 'layout_style:', layoutStyle, 'isRipple:', isRipple, 'isParallax:', isParallax, 'isPuzzle:', isPuzzle, 'isPeekaboo:', isPeekaboo, 'isFloatingTag:', isFloatingTag, 'isStoryPop:', isStoryPop, 'isFrostedToken:', isFrostedToken, 'design:', design);

        const baseStyles = {
            position: 'relative',
            zIndex: '9999',
            transition: transitionStyle,
            maxWidth: isFullWidth ? '100%' : (design.max_width || 280) + 'px',
            minWidth: isFullWidth ? '100%' : (design.min_width || 240) + 'px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '14px',
            lineHeight: '1.4',
            transform: initialState.transform,
            opacity: initialState.opacity,
            cursor: 'pointer',
            pointerEvents: 'auto',
            padding: isRipple ? '8px 20px 8px 8px' : isCompact ? '8px' : isMinimal ? '12px' : '16px',
            overflow: 'hidden'
        };

        // Special styling for Ripple layout - clean white pill
        if (isRipple) {
            baseStyles.borderRadius = '9999px';
            baseStyles.borderWidth = '0';
            baseStyles.borderStyle = 'none';
            baseStyles.borderColor = 'transparent';
            baseStyles.backgroundColor = '#ffffff';
            baseStyles.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)';
        } else if (isParallax) {
            // Special styling for Parallax 3D card - dark glassmorphic card
            baseStyles.borderRadius = '12px';
            baseStyles.borderWidth = '1px';
            baseStyles.borderStyle = 'solid';
            baseStyles.borderColor = 'rgba(255, 255, 255, 0.1)';
            baseStyles.backgroundColor = 'rgba(17, 24, 39, 0.9)';
            baseStyles.backdropFilter = 'blur(16px)';
            baseStyles.WebkitBackdropFilter = 'blur(16px)';
            baseStyles.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5)';
            baseStyles.padding = '16px';
            baseStyles.overflow = 'visible';
        } else if (isPuzzle) {
            // Special styling for Puzzle layout - transparent container for pieces
            baseStyles.borderRadius = '0';
            baseStyles.borderWidth = '0';
            baseStyles.borderStyle = 'none';
            baseStyles.borderColor = 'transparent';
            baseStyles.backgroundColor = 'transparent';
            baseStyles.boxShadow = 'none';
            baseStyles.padding = '0';
            baseStyles.overflow = 'visible';
        } else if (isPeekaboo) {
            // Special styling for Peekaboo layout - white card with rounded right edge
            baseStyles.borderRadius = '12px 24px 24px 12px';
            baseStyles.borderWidth = '1px';
            baseStyles.borderStyle = 'solid';
            baseStyles.borderColor = 'rgba(243, 244, 246, 1)';
            baseStyles.backgroundColor = '#ffffff';
            baseStyles.boxShadow = '4px 4px 20px rgba(0, 0, 0, 0.1)';
            baseStyles.padding = '16px 48px 16px 16px';
            baseStyles.overflow = 'visible';
            baseStyles.transformOrigin = 'left center';
        } else if (isFloatingTag) {
            // Special styling for Floating Tag layout - pill-shaped glassmorphic
            baseStyles.borderRadius = '50px';
            baseStyles.borderWidth = '1px';
            baseStyles.borderStyle = 'solid';
            baseStyles.borderColor = 'rgba(255, 255, 255, 0.4)';
            baseStyles.backgroundColor = 'rgba(255, 255, 255, 0.7)';
            baseStyles.backdropFilter = 'blur(12px)';
            baseStyles.WebkitBackdropFilter = 'blur(12px)';
            baseStyles.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.05)';
            baseStyles.padding = '8px 16px 8px 8px';
            baseStyles.overflow = 'visible';
        } else if (isStoryPop) {
            // Special styling for Story Pop layout - vertical card like stories
            baseStyles.width = '160px';
            baseStyles.height = '220px';
            baseStyles.maxWidth = '160px';
            baseStyles.minWidth = '160px';
            baseStyles.borderRadius = '16px';
            baseStyles.borderWidth = '2px';
            baseStyles.borderStyle = 'solid';
            baseStyles.borderColor = '#ffffff';
            baseStyles.backgroundColor = '#ffffff';
            baseStyles.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)';
            baseStyles.padding = '0';
            baseStyles.overflow = 'hidden';
        } else if (isFrostedToken) {
            // Special styling for Frosted Token layout - transparent container for token + label
            baseStyles.borderRadius = '0';
            baseStyles.borderWidth = '0';
            baseStyles.borderStyle = 'none';
            baseStyles.borderColor = 'transparent';
            baseStyles.backgroundColor = 'transparent';
            baseStyles.boxShadow = 'none';
            baseStyles.padding = '0';
            baseStyles.overflow = 'visible';
        } else {
            // Apply position, layout, border, shadow, glassmorphism, background based on 'design' object
            baseStyles.borderRadius = (design.border_radius || 12) + 'px';
            baseStyles.borderWidth = (design.border_width || 1) + 'px';
            baseStyles.borderStyle = 'solid';
            baseStyles.borderColor = design.border_color || 'rgba(0,0,0,0.08)';

            // Apply left accent
            if (design.border_left_accent) {
                baseStyles.borderLeftWidth = (design.border_left_accent_width || 4) + 'px';
                baseStyles.borderLeftColor = design.border_left_accent_color || '#3B82F6';
            }

            // Apply glassmorphism or shadow
            if (design.glassmorphism) {
                // Glassmorphism effect
                const blurAmount = design.backdrop_blur || 16;
                baseStyles.backdropFilter = 'blur(' + blurAmount + 'px)';
                baseStyles.WebkitBackdropFilter = 'blur(' + blurAmount + 'px)';
                baseStyles.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                baseStyles.borderColor = 'rgba(255, 255, 255, 0.5)';
                baseStyles.boxShadow = 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.3), 0 20px 27px rgba(0, 0, 0, 0.05)';
                if (design.border_left_accent) {
                    baseStyles.borderLeftColor = design.border_left_accent_color || '#3B82F6';
                }
            } else {
                // Normal shadow
                if (design.shadow_enabled !== false) {
                    baseStyles.boxShadow = shadowMap[design.shadow_size || 'lg'] || shadowMap.lg;
                }
                // Normal background
                if (design.background_gradient) {
                    const gradientDirection = design.gradient_direction || 'to-br';
                    const gradientStart = design.gradient_start || '#ffffff';
                    const gradientEnd = design.gradient_end || '#f3f4f6';
                    baseStyles.background = 'linear-gradient(' + gradientDirection + ', ' + gradientStart + ', ' + gradientEnd + ')';
                } else {
                    baseStyles.backgroundColor = design.background_color || '#ffffff';
                }
            }
        }

        Object.assign(widgetElement.style, baseStyles);

        const container = getOrCreateContainer(position, design);

        // Apply privacy settings to name
        const shouldAnonymize = privacySettings.anonymizeNames ?? false;
        const anonymizationStyle = privacySettings.anonymizationStyle || 'first-initial';
        const displayName = shouldAnonymize ? anonymizeName(notification.title, anonymizationStyle) : notification.title;
        
        // DEBUG: Log privacy application
        console.log('ProofPop PRIVACY: Title:', notification.title, '→ Display:', displayName, '| Anonymize:', shouldAnonymize, '| Style:', anonymizationStyle);
        
        // Get first letter for avatar
        const initial = displayName ? displayName.charAt(0).toUpperCase() : '?';

        // Build location part
        let locationText = '';
        if (notification.showLocation && notification.location) {
            locationText = ' • 📍 ' + notification.location;
        }

        const gapSize = isCompact ? '8px' : '12px';
        const iconSize = isCompact ? '32px' : isMinimal ? '36px' : '40px';
        const iconFontSize = isCompact ? '14px' : '16px';
        const textSize = isCompact ? '12px' : '13px';
        const titleSize = isCompact ? '13px' : '14px';
        
        // High contrast colors for glassmorphism
        const isGlass = design.glassmorphism;
        const iconBg = isGlass ? '#2563eb' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        const titleColor = isGlass ? '#1d4ed8' : '#111827';
        const titleWeight = isGlass ? '700' : '600';
        const textColor = isGlass ? '#111827' : '#666';
        const textWeight = isGlass ? '500' : '400';
        const textShadow = isGlass ? 'text-shadow: 0 0 1px rgba(255,255,255,0.5);' : '';

        const showCustomerName = contentSettings.showCustomerName !== false; // Default to true
        const showRating = contentSettings.showRating !== false; // Default to true
        const showReviewContent = contentSettings.showReviewContent !== false; // Default to true
        
        let html = '';
        
        // Special Ripple Bubble Layout - Exact match to design
        if (isRipple) {
            // Get product image from metadata if available
            const productImage = notification.metadata?.product_image || notification.metadata?.image || '';
            const userAvatar = notification.metadata?.avatar || '';
            const locationCity = notification.location || 'Unknown';
            
            // Main content wrapper - horizontal flex
            html += '<div style="display: flex; align-items: center; gap: 12px;">';
            
            // Image cluster container (overlapping circles)
            html += '<div style="position: relative; flex-shrink: 0; width: 56px; height: 44px;">';
            
            // User avatar (front circle - blue/teal person image)
            if (userAvatar) {
                html += '<img src="' + userAvatar + '" alt="' + displayName + '" style="position: absolute; left: 0; top: 2px; width: 40px; height: 40px; border-radius: 50%; border: 2px solid white; object-fit: cover; box-shadow: 0 2px 4px rgba(0,0,0,0.1); z-index: 2;" />';
            } else {
                html += '<div style="position: absolute; left: 0; top: 2px; width: 40px; height: 40px; border-radius: 50%; border: 2px solid white; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); box-shadow: 0 2px 4px rgba(0,0,0,0.1); z-index: 2; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 16px;">' + initial + '</div>';
            }
            
            // Product image (back circle - yellow headphones)
            if (productImage) {
                html += '<img src="' + productImage + '" alt="Product" style="position: absolute; left: 20px; top: 2px; width: 40px; height: 40px; border-radius: 50%; border: 2px solid white; object-fit: cover; background: #fbbf24; box-shadow: 0 2px 4px rgba(0,0,0,0.1); z-index: 1;" />';
            } else {
                html += '<div style="position: absolute; left: 20px; top: 2px; width: 40px; height: 40px; border-radius: 50%; border: 2px solid white; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); box-shadow: 0 2px 4px rgba(0,0,0,0.1); z-index: 1;"></div>';
            }
            
            // Heart badge (small red heart at bottom)
            html += '<div style="position: absolute; left: 24px; bottom: 0; z-index: 3; background: white; border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,0.12);">';
            html += '<svg width="10" height="10" viewBox="0 0 24 24" fill="#ef4444"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
            html += '</div>';
            
            html += '</div>'; // End image cluster
            
            // Text content
            html += '<div style="display: flex; flex-direction: column; justify-content: center; min-width: 0; padding-right: 8px;">';
            
            // First line: "Maya from Toronto"
            html += '<div style="font-size: 14px; color: #374151; font-weight: 400; white-space: nowrap;">';
            html += '<span style="font-weight: 600; color: #6366f1;">' + displayName + '</span>';
            html += ' from ' + locationCity;
            html += '</div>';
            
            // Second line: "is looking at this"
            html += '<div style="font-size: 13px; color: #9ca3af; font-weight: 400; white-space: nowrap;">';
            html += notification.message;
            html += '</div>';
            
            html += '</div>'; // End text content
            
            html += '</div>'; // End main wrapper
        } else if (isParallax) {
            // 3D Parallax Card Layout - Dark glassmorphic with floating product image
            const productImage = notification.metadata?.product_image || notification.metadata?.image || '';
            const productName = notification.metadata?.product_name || notification.metadata?.product || 'Product';
            const buyerRole = notification.metadata?.role || notification.metadata?.title || '';
            
            // Glossy shine effect (moves with mouse)
            html += '<div data-parallax-shine style="position: absolute; inset: 0; width: 100%; height: 100%; background: linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%); pointer-events: none; opacity: 0; transition: opacity 0.5s ease; border-radius: 12px;"></div>';
            
            // Subtle grain overlay using CSS gradient noise approximation
            html += '<div style="position: absolute; inset: 0; background: repeating-radial-gradient(circle at 50% 50%, transparent 0, rgba(255,255,255,0.03) 1px, transparent 2px); opacity: 0.3; pointer-events: none; border-radius: 12px;"></div>';
            
            // Content container
            html += '<div style="position: relative; display: flex; align-items: center; gap: 16px;">';
            
            // Floating product image with border glow
            html += '<div style="flex-shrink: 0; position: relative;">';
            if (productImage) {
                html += '<div style="width: 64px; height: 64px; border-radius: 8px; overflow: hidden; border: 2px solid rgba(255,255,255,0.2); box-shadow: 0 8px 16px rgba(0,0,0,0.3), 0 0 20px rgba(99,102,241,0.15);">';
                html += '<img src="' + productImage + '" alt="' + productName + '" style="width: 100%; height: 100%; object-fit: cover;" />';
                html += '</div>';
            } else {
                html += '<div style="width: 64px; height: 64px; border-radius: 8px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border: 2px solid rgba(255,255,255,0.2); box-shadow: 0 8px 16px rgba(0,0,0,0.3), 0 0 20px rgba(99,102,241,0.15); display: flex; align-items: center; justify-content: center;">';
                html += '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>';
                html += '</div>';
            }
            // NEW badge
            html += '<div style="position: absolute; top: -6px; right: -6px; background: #6366f1; color: white; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); border: 1px solid #818cf8;">NEW</div>';
            html += '</div>';
            
            // Text content
            html += '<div style="flex: 1; min-width: 0;">';
            
            // Header with lightning icon
            html += '<div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">';
            html += '<svg width="12" height="12" viewBox="0 0 24 24" fill="#facc15"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>';
            html += '<span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #9ca3af;">Just Grabbed</span>';
            html += '</div>';
            
            // Product name
            html += '<h4 style="font-size: 14px; font-weight: 700; color: white; margin: 0 0 4px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + productName + '</h4>';
            
            // Buyer info
            html += '<p style="font-size: 12px; color: #9ca3af; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">';
            html += 'by <span style="color: #e5e7eb; font-weight: 500;">' + displayName + '</span>';
            if (buyerRole) {
                html += ' • ' + buyerRole;
            }
            html += '</p>';
            
            html += '</div>'; // End text content
            html += '</div>'; // End content container
            
            // Bottom gradient bar
            html += '<div style="position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: linear-gradient(to right, #6366f1, #a855f7, #ec4899); opacity: 0.5; border-radius: 0 0 12px 12px;"></div>';
        } else if (isPuzzle) {
            // Puzzle Reveal Layout - Three pieces that snap together
            const userAvatar = notification.metadata?.avatar || '';
            const productImage = notification.metadata?.product_image || notification.metadata?.image || '';
            const productName = notification.metadata?.product_name || notification.metadata?.product || 'Product';
            const actionText = notification.metadata?.action || 'purchased';
            const accentColor = notification.metadata?.color || '#facc15'; // Yellow default
            
            // Container for all pieces
            html += '<div data-puzzle-container style="display: flex; align-items: center; height: 56px; filter: drop-shadow(0 10px 25px rgba(0,0,0,0.2));">';
            
            // PIECE 1: Avatar (Left) - slides from left
            html += '<div data-puzzle-piece="1" style="position: relative; z-index: 30; display: flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: white; border-radius: 16px 6px 6px 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transform: translateX(-50px); opacity: 0; transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);">';
            if (userAvatar) {
                html += '<img src="' + userAvatar + '" alt="' + displayName + '" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" />';
            } else {
                html += '<div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 16px; border: 2px solid white;">' + initial + '</div>';
            }
            // Connector dot (puzzle tab)
            html += '<div style="position: absolute; right: -6px; width: 12px; height: 12px; background: white; border-radius: 50%; z-index: 10;"></div>';
            html += '</div>';
            
            // PIECE 2: Message (Middle) - slides from top
            html += '<div data-puzzle-piece="2" style="position: relative; z-index: 20; margin-left: -8px; display: flex; flex-direction: column; justify-content: center; padding: 0 24px; height: 56px; background: #111827; color: white; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); min-width: 160px; transform: translateY(-50px); opacity: 0; transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s;">';
            // Action badge
            html += '<div style="display: flex; align-items: center; gap: 4px; margin-bottom: 2px;">';
            html += '<span style="display: inline-flex; align-items: center; justify-content: center; padding: 2px 4px; border-radius: 3px; background: ' + accentColor + '; color: #111827;">';
            html += '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>';
            html += '</span>';
            html += '<span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af;">' + actionText + '</span>';
            html += '</div>';
            // User and product text
            html += '<div style="font-size: 12px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">';
            html += '<span style="font-weight: 700; color: white;">' + displayName + '</span>';
            html += ' got <span style="color: #d1d5db;">' + productName + '</span>';
            html += '</div>';
            html += '</div>';
            
            // PIECE 3: Product Image (Right) - slides from right
            html += '<div data-puzzle-piece="3" style="position: relative; z-index: 10; margin-left: -8px; width: 56px; height: 56px; background: white; border-radius: 6px 16px 16px 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; transform: translateX(50px); opacity: 0; transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s;">';
            // Connector dot (puzzle notch - dark to match middle piece)
            html += '<div style="position: absolute; left: -6px; top: 50%; transform: translateY(-50%); width: 12px; height: 12px; background: #111827; border-radius: 50%; z-index: 20;"></div>';
            if (productImage) {
                html += '<img src="' + productImage + '" alt="' + productName + '" style="width: 100%; height: 100%; object-fit: cover;" />';
            } else {
                html += '<div style="width: 100%; height: 100%; background: linear-gradient(135deg, #fbbf24, #f59e0b); display: flex; align-items: center; justify-content: center;">';
                html += '<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>';
                html += '</div>';
            }
            // Close button
            html += '<button data-puzzle-close style="position: absolute; top: 2px; right: 2px; width: 16px; height: 16px; background: rgba(0,0,0,0.3); backdrop-filter: blur(4px); border: none; border-radius: 50%; color: white; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s;">×</button>';
            html += '</div>';
            
            html += '</div>'; // End puzzle container
        } else if (isPeekaboo) {
            // Peekaboo Layout - Playful peek animation with blinking eye
            const userAvatar = notification.metadata?.avatar || '';
            const viewCount = notification.metadata?.count || notification.metadata?.value || '18';
            const timeText = notification.metadata?.time || 'last hour';
            const messageText = notification.metadata?.message || 'people viewed this';
            
            // Inject blink animation CSS
            html += '<style>@keyframes proofpop-blink{0%,48%,52%,100%{transform:scaleY(1)}50%{transform:scaleY(0.1)}}.proofpop-blink{animation:proofpop-blink 3s infinite}</style>';
            
            // Decoration dot on right edge
            html += '<div style="position: absolute; right: -12px; top: 50%; transform: translateY(-50%); width: 24px; height: 24px; background: white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; border: 1px solid rgba(243,244,246,1); z-index: 0;">';
            html += '<div style="width: 6px; height: 6px; background: #818cf8; border-radius: 50%; animation: pulse 2s infinite;"></div>';
            html += '</div>';
            
            // Content container
            html += '<div style="position: relative; z-index: 10; display: flex; align-items: center; gap: 12px; width: 100%;">';
            
            // Avatar group with blinking eye
            html += '<div style="position: relative; flex-shrink: 0;">';
            // Eye icon
            html += '<div style="position: relative; z-index: 20; width: 32px; height: 32px; background: #e0e7ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #6366f1;">';
            html += '<svg class="proofpop-blink" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
            html += '</div>';
            // User avatar (hidden initially, slides out)
            if (userAvatar) {
                html += '<img data-peekaboo-avatar src="' + userAvatar + '" alt="User" style="position: absolute; top: 0; left: 0; width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); z-index: 10; transform: translateX(0) translateY(0); opacity: 0; transition: all 0.7s ease 0.3s;" />';
            }
            html += '</div>';
            
            // Text content
            html += '<div style="display: flex; flex-direction: column; min-width: 0;">';
            html += '<div style="display: flex; align-items: center; gap: 4px; line-height: 1;">';
            html += '<span style="font-size: 18px; font-weight: 700; color: #111827;">' + viewCount + '</span>';
            html += '<span style="font-size: 14px; font-weight: 500; color: #6b7280;">' + messageText + '</span>';
            html += '</div>';
            html += '<div style="font-size: 12px; font-weight: 500; color: #6366f1; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px;">In the ' + timeText + '</div>';
            html += '</div>';
            
            // Close button
            html += '<button data-peekaboo-close style="position: absolute; top: 8px; right: 8px; background: none; border: none; color: #d1d5db; cursor: pointer; padding: 4px; transition: color 0.2s;">';
            html += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>';
            html += '</button>';
            
            html += '</div>'; // End content container
        } else if (isFloatingTag) {
            // Floating Tag Layout - Pill-shaped glassmorphic tag with gentle float
            const tagText = notification.metadata?.text || 'Popular in Design';
            const subText = notification.metadata?.subtext || notification.metadata?.value || '120 viewing';
            const iconType = notification.metadata?.iconType || 'sparkles';
            
            // Determine icon color based on type
            let iconColor = '#f59e0b'; // amber default
            let iconBg = 'rgba(245, 158, 11, 0.1)';
            if (iconType === 'trending') { iconColor = '#10b981'; iconBg = 'rgba(16, 185, 129, 0.1)'; }
            else if (iconType === 'verified') { iconColor = '#6366f1'; iconBg = 'rgba(99, 102, 241, 0.1)'; }
            else if (iconType === 'zap') { iconColor = '#8b5cf6'; iconBg = 'rgba(139, 92, 246, 0.1)'; }
            
            // Inject float animation CSS
            html += '<style>@keyframes proofpop-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}.proofpop-float{animation:proofpop-float 3s ease-in-out infinite}@keyframes proofpop-ping{75%,100%{transform:scale(2);opacity:0}}</style>';
            
            // Floating container
            html += '<div class="proofpop-float" style="display: flex; align-items: center; gap: 12px;">';
            
            // Icon container
            html += '<div style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: ' + iconBg + '; backdrop-filter: blur(4px);">';
            // Sparkles icon (default)
            if (iconType === 'trending') {
                html += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="' + iconColor + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>';
            } else if (iconType === 'verified') {
                html += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="' + iconColor + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>';
            } else if (iconType === 'zap') {
                html += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="' + iconColor + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>';
            } else {
                html += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="' + iconColor + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.912 5.813a2 2 0 001.272 1.272L21 12l-5.813 1.912a2 2 0 00-1.272 1.272L12 21l-1.912-5.813a2 2 0 00-1.272-1.272L3 12l5.813-1.912a2 2 0 001.272-1.272L12 3z"></path></svg>';
            }
            html += '</div>';
            
            // Text content
            html += '<div style="display: flex; align-items: baseline; gap: 8px;">';
            html += '<span style="font-size: 14px; font-weight: 500; color: #1f2937; letter-spacing: -0.01em;">' + tagText + '</span>';
            if (subText) {
                html += '<span style="width: 4px; height: 4px; border-radius: 50%; background: #d1d5db;"></span>';
                html += '<span style="font-size: 12px; font-weight: 500; color: #6b7280;">' + subText + '</span>';
            }
            html += '</div>';
            
            // Ping indicator dot
            html += '<div style="position: absolute; top: -4px; right: -4px;">';
            html += '<span style="position: relative; display: flex; width: 8px; height: 8px;">';
            html += '<span style="animation: proofpop-ping 1s cubic-bezier(0, 0, 0.2, 1) infinite; position: absolute; display: inline-flex; width: 100%; height: 100%; border-radius: 50%; background: #818cf8; opacity: 0.75;"></span>';
            html += '<span style="position: relative; display: inline-flex; border-radius: 50%; width: 8px; height: 8px; background: #6366f1;"></span>';
            html += '</span>';
            html += '</div>';
            
            html += '</div>'; // End floating container
        } else if (isStoryPop) {
            // Story Pop Layout - Vertical card with micro-animations like stories
            const productImage = notification.metadata?.product_image || notification.metadata?.image || '';
            const userName = notification.metadata?.customer_name || notification.metadata?.name || 'Sarah J.';
            const actionText = notification.metadata?.action || 'just bought this!';
            const timeText = notification.metadata?.time || '2s ago';
            const storyType = notification.metadata?.storyType || 'product-spin';
            
            // Determine accent color based on type
            let accentColor = '#ef4444'; // red default
            if (storyType === 'check-draw') accentColor = '#22c55e';
            else if (storyType === 'location-pulse') accentColor = '#3b82f6';
            
            // Inject animations CSS
            html += '<style>';
            html += '@keyframes proofpop-spin-slow{0%{transform:rotateY(0deg)}100%{transform:rotateY(360deg)}}';
            html += '@keyframes proofpop-draw-check{to{stroke-dashoffset:0}}';
            html += '@keyframes proofpop-bounce-gentle{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}';
            html += '@keyframes proofpop-progress{from{width:0%}to{width:100%}}';
            html += '.proofpop-preserve-3d{transform-style:preserve-3d}';
            html += '</style>';
            
            // Close button
            html += '<button data-story-close style="position: absolute; top: 8px; right: 8px; z-index: 30; width: 20px; height: 20px; background: rgba(0,0,0,0.2); backdrop-filter: blur(4px); border: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; cursor: pointer; transition: background 0.2s;">';
            html += '<span style="font-size: 10px; font-weight: bold;">×</span>';
            html += '</button>';
            
            // Story content layer (the visual)
            html += '<div style="position: absolute; inset: 0; background: #f3f4f6; z-index: 0;">';
            
            if (storyType === 'product-spin' && productImage) {
                // Spinning product
                html += '<div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; perspective: 1000px;">';
                html += '<div class="proofpop-preserve-3d" style="width: 96px; height: 96px; animation: proofpop-spin-slow 4s linear infinite;">';
                html += '<img src="' + productImage + '" alt="Product" style="width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.2));" />';
                html += '</div>';
                html += '<div style="position: absolute; top: 25%; left: 25%; width: 4px; height: 4px; background: white; border-radius: 50%; animation: ping 1s infinite;"></div>';
                html += '<div style="position: absolute; bottom: 33%; right: 25%; width: 6px; height: 6px; background: white; border-radius: 50%; animation: pulse 2s infinite;"></div>';
                html += '</div>';
            } else if (storyType === 'check-draw') {
                // Animated checkmark
                html += '<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #ecfdf5;">';
                html += '<div style="position: relative; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; background: white; border-radius: 50%; box-shadow: 0 10px 25px rgba(0,0,0,0.1); animation: proofpop-bounce-gentle 2s infinite;">';
                html += '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">';
                html += '<path d="M5 13l4 4L19 7" style="stroke-dasharray: 24; stroke-dashoffset: 24; animation: proofpop-draw-check 1s ease-out forwards;"></path>';
                html += '</svg>';
                html += '</div>';
                html += '</div>';
            } else if (storyType === 'location-pulse') {
                // Pulsing location pin
                html += '<div style="position: relative; width: 100%; height: 100%; background: #eff6ff; display: flex; align-items: center; justify-content: center; overflow: hidden;">';
                html += '<div style="position: absolute; width: 192px; height: 192px; background: rgba(59, 130, 246, 0.2); border-radius: 50%; animation: ping 2s infinite;"></div>';
                html += '<div style="position: absolute; width: 128px; height: 128px; background: rgba(59, 130, 246, 0.2); border-radius: 50%; animation: ping 2s infinite 0.3s;"></div>';
                html += '<div style="position: relative; z-index: 10; color: #2563eb; animation: bounce 1s infinite;">';
                html += '<svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>';
                html += '</div>';
                html += '</div>';
            } else {
                // Default - show product image or gradient
                if (productImage) {
                    html += '<img src="' + productImage + '" alt="Product" style="width: 100%; height: 100%; object-fit: cover;" />';
                } else {
                    html += '<div style="width: 100%; height: 100%; background: linear-gradient(135deg, #6366f1, #8b5cf6);"></div>';
                }
            }
            html += '</div>';
            
            // Gradient overlay for text readability
            html += '<div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.2) 50%, transparent); z-index: 10; pointer-events: none;"></div>';
            
            // Text content layer
            html += '<div style="position: absolute; bottom: 0; left: 0; width: 100%; padding: 12px; z-index: 20; color: white;">';
            // User avatar/icon
            html += '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">';
            html += '<div style="width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; background: ' + accentColor + ';">' + userName.charAt(0) + '</div>';
            html += '<span style="font-size: 12px; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + userName + '</span>';
            html += '</div>';
            // Action text
            html += '<p style="font-size: 11px; font-weight: 500; line-height: 1.3; opacity: 0.9; margin-bottom: 4px;">' + actionText + '</p>';
            // Timestamp
            html += '<p style="font-size: 9px; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.5px;">' + timeText + '</p>';
            html += '</div>';
            
            // Progress bar (story-like)
            html += '<div style="position: absolute; top: 0; left: 0; height: 3px; background: rgba(255,255,255,0.3); width: 100%; z-index: 30;">';
            html += '<div data-story-progress style="height: 100%; background: white; width: 0%; animation: proofpop-progress ' + (displayDuration / 1000) + 's linear forwards;"></div>';
            html += '</div>';
            
        } else if (isFrostedToken) {
            // Frosted Token Layout - Glassmorphic token with breathing animation
            const countValue = notification.metadata?.count || notification.metadata?.value || '32';
            const labelText = notification.metadata?.label || 'purchased today';
            const tokenType = notification.metadata?.tokenType || 'shopping';
            
            // Determine gradient color based on type
            let gradientColor = 'linear-gradient(135deg, #fb923c, #ec4899)'; // orange-pink default
            if (tokenType === 'eye' || tokenType === 'viewing') gradientColor = 'linear-gradient(135deg, #60a5fa, #22d3d8)';
            else if (tokenType === 'trending' || tokenType === 'rating') gradientColor = 'linear-gradient(135deg, #34d399, #14b8a6)';
            
            // Inject breathing animation CSS
            html += '<style>@keyframes proofpop-breathe{0%{box-shadow:0 0 0 0 rgba(255,255,255,0.1)}50%{box-shadow:0 0 0 4px rgba(255,255,255,0.3)}100%{box-shadow:0 0 0 0 rgba(255,255,255,0.1)}}.proofpop-breathe{animation:proofpop-breathe 3s infinite ease-in-out}</style>';
            
            // Main container - flex row with label and token
            html += '<div style="display: flex; align-items: center; gap: 12px;">';
            
            // Text label (frosted pill)
            html += '<div data-frosted-label style="padding: 8px 16px; border-radius: 50px; background: rgba(255,255,255,0.1); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 4px 20px rgba(0,0,0,0.1); color: white; transform: translateX(16px); opacity: 0; transition: all 0.7s ease 0.1s;">';
            html += '<div style="display: flex; align-items: baseline; gap: 6px; white-space: nowrap;">';
            html += '<span style="font-weight: 700; font-size: 14px; letter-spacing: -0.01em;">' + countValue + '</span>';
            html += '<span style="font-size: 12px; font-weight: 500; opacity: 0.8; letter-spacing: 0.02em;">' + labelText + '</span>';
            html += '</div>';
            html += '</div>';
            
            // Circular token
            html += '<div class="proofpop-breathe" style="position: relative; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: ' + gradientColor + '; box-shadow: 0 8px 32px rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.2); flex-shrink: 0;">';
            
            // Inner gloss (top shine)
            html += '<div style="position: absolute; inset: 0; border-radius: 50%; background: linear-gradient(to bottom, rgba(255,255,255,0.4), transparent); opacity: 0.5; pointer-events: none;"></div>';
            
            // Icon
            html += '<div style="position: relative; z-index: 10; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); color: white;">';
            if (tokenType === 'eye' || tokenType === 'viewing') {
                html += '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
            } else if (tokenType === 'trending' || tokenType === 'rating') {
                html += '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>';
            } else {
                html += '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>';
            }
            html += '</div>';
            
            // Status dot on rim
            html += '<div style="position: absolute; top: 0; right: 0; width: 12px; height: 12px; background: white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center;">';
            html += '<div style="width: 6px; height: 6px; border-radius: 50%; background: #ef4444; animation: pulse 2s infinite;"></div>';
            html += '</div>';
            
            html += '</div>'; // End token
            html += '</div>'; // End main container
            
        } else {
            // Standard layouts (card, compact, minimal, full-width)
            html += '<div style="display: flex; align-items: center; gap: ' + gapSize + '; ' + textShadow + '">';
            if (showEventIcon) {
                html += '<div style="width: ' + iconSize + '; height: ' + iconSize + '; border-radius: 50%; background: ' + iconBg + '; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: ' + iconFontSize + '; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all ' + fadeInDuration + 'ms;">' + initial + '</div>';
            }
            html += '<div style="flex: 1;">';
            if (showCustomerName) {
                html += '<div style="font-weight: ' + titleWeight + '; color: ' + titleColor + '; margin-bottom: 2px; font-size: ' + titleSize + ';">' + displayName + '</div>';
            }
            html += '<div style="color: ' + textColor + '; font-weight: ' + textWeight + '; font-size: ' + textSize + ';">' + notification.message;
            if (showValue && notification.metadata && notification.metadata.value) {
                html += ' • <strong>' + formatValue(
                    notification.metadata.value,
                    contentSettings.valueFormat || 'currency',
                    contentSettings.currency || 'USD',
                    contentSettings.currencyPosition || 'before'
                ) + '</strong>';
            }
            html += '</div>';
            
            // Rating Stars for Reviews
            if (showRating && notification.metadata && notification.metadata.rating) {
                const rating = notification.metadata.rating;
                html += '<div style="display: flex; align-items: center; gap: 2px; margin-top: 4px;">';
                for (let i = 0; i < 5; i++) {
                    html += '<span style="color: ' + (i < rating ? '#FBBF24' : '#D1D5DB') + '; font-size: 14px;">★</span>';
                }
                html += '</div>';
            }
            
            // Review Content (support all field name variations)
            const reviewText = notification.metadata && (
                notification.metadata.review_text || 
                notification.metadata.reviewContent || 
                notification.metadata.review_content ||
                (notification.metadata.event_data && notification.metadata.event_data.review_text)
            );
            if (showReviewContent && reviewText) {
                html += '<div style="color: ' + (isGlass ? '#374151' : '#4B5563') + '; font-size: 11px; margin-top: 8px; font-style: italic; line-height: 1.4; max-height: 32px; overflow: hidden;">"' + reviewText + '"</div>';
            }
            
            const metaColor = isGlass ? '#374151' : '#999';
            const metaWeight = isGlass ? '500' : '400';
            html += '<div style="color: ' + metaColor + '; font-weight: ' + metaWeight + '; font-size: 12px; margin-top: 4px;">';
            if (showTimestamp) {
                html += timestampPrefix + notification.timeAgo;
            }
            html += locationText;
            html += '</div>';
            html += '</div>';
            html += '<div style="width: 8px; height: 8px; border-radius: 50%; background: #10b981;"></div>';
            html += '</div>';
            if (progressBar) {
                const borderRadius = design.border_radius || 12;
                const progressBarRadius = progressBarPosition === 'top' 
                    ? 'border-radius: ' + borderRadius + 'px ' + borderRadius + 'px 0 0;' 
                    : 'border-radius: 0 0 ' + borderRadius + 'px ' + borderRadius + 'px;';
                html += '<div data-proofpop-progress="bar" style="height: 3px; background: ' + progressBarColor + '; width: 0; position: absolute; ' + (progressBarPosition === 'top' ? 'top: 0;' : 'bottom: 0;') + ' left: 0; right: 0; ' + progressBarRadius + ' transition: width ' + displayDuration + 'ms linear; max-width: 100%;"></div>';
            }
        }
        
        widgetElement.innerHTML = html;

        widgetElement.setAttribute('data-position', position);
        widgetElement.setAttribute('data-animation', animationType);
        widgetElement.setAttribute('data-fade-out', String(fadeOutDuration));

        if (container instanceof HTMLElement) {
            container.appendChild(widgetElement);
        } else {
            document.body.appendChild(widgetElement);
        }

        // After inserting into the DOM, transition from the initial off-screen state
        // to the final visible state so the widget actually appears.
        const finalState = getAnimationFinalState(animationType, position);
        // Use requestAnimationFrame to ensure initial styles are committed first
        requestAnimationFrame(() => {
            if (finalState.transform) {
                widgetElement.style.transform = finalState.transform;
            }
            if (finalState.opacity !== undefined) {
                widgetElement.style.opacity = finalState.opacity;
            }
        });

        currentNotificationElement = widgetElement;
        
        // Add 3D Parallax interaction for parallax layout
        if (isParallax) {
            let isHovering = false;
            
            // Create inner card wrapper for 3D transform
            const innerCard = widgetElement.querySelector('[data-parallax-card]') || widgetElement;
            
            widgetElement.style.perspective = '1000px';
            widgetElement.style.transformStyle = 'preserve-3d';
            
            widgetElement.addEventListener('mousemove', (e) => {
                if (!isHovering) return;
                const rect = widgetElement.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const mouseX = e.clientX - centerX;
                const mouseY = e.clientY - centerY;
                
                // Calculate rotation (Max 12 degrees)
                const rotateX = (mouseY / (rect.height / 2)) * -12;
                const rotateY = (mouseX / (rect.width / 2)) * 12;
                
                widgetElement.style.transform = 'rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg)';
                widgetElement.style.transition = 'transform 0.1s ease-out';
                
                // Move shine effect
                const shine = widgetElement.querySelector('[data-parallax-shine]');
                if (shine) {
                    shine.style.transform = 'translate(' + (rotateY * 2) + 'px, ' + (rotateX * 2) + 'px)';
                    shine.style.opacity = '1';
                }
            });
            
            widgetElement.addEventListener('mouseenter', () => {
                isHovering = true;
                widgetElement.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(99, 102, 241, 0.2)';
            });
            
            widgetElement.addEventListener('mouseleave', () => {
                isHovering = false;
                widgetElement.style.transform = 'rotateX(0deg) rotateY(0deg)';
                widgetElement.style.transition = 'transform 0.5s ease-out, box-shadow 0.3s ease-out';
                widgetElement.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5)';
                
                const shine = widgetElement.querySelector('[data-parallax-shine]');
                if (shine) {
                    shine.style.opacity = '0';
                }
            });
        }
        
        // Add Puzzle animation for puzzle layout
        if (isPuzzle) {
            // Animate pieces in after a short delay
            requestAnimationFrame(() => {
                setTimeout(() => {
                    const pieces = widgetElement.querySelectorAll('[data-puzzle-piece]');
                    pieces.forEach((piece) => {
                        piece.style.transform = 'translateX(0) translateY(0)';
                        piece.style.opacity = '1';
                    });
                }, 50);
            });
            
            // Add close button handler
            const closeBtn = widgetElement.querySelector('[data-puzzle-close]');
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Animate pieces out
                    const pieces = widgetElement.querySelectorAll('[data-puzzle-piece]');
                    const piece1 = pieces[0];
                    const piece2 = pieces[1];
                    const piece3 = pieces[2];
                    if (piece1) { piece1.style.transform = 'translateX(-50px)'; piece1.style.opacity = '0'; }
                    if (piece2) { piece2.style.transform = 'translateY(-50px)'; piece2.style.opacity = '0'; }
                    if (piece3) { piece3.style.transform = 'translateX(50px)'; piece3.style.opacity = '0'; }
                    
                    setTimeout(() => {
                        if (widgetElement.parentNode) {
                            widgetElement.remove();
                        }
                        isDisplaying = false;
                        currentNotificationElement = null;
                    }, 500);
                });
                
                // Hover effect for close button
                closeBtn.addEventListener('mouseenter', () => {
                    closeBtn.style.background = 'rgba(0,0,0,0.5)';
                });
                closeBtn.addEventListener('mouseleave', () => {
                    closeBtn.style.background = 'rgba(0,0,0,0.3)';
                });
            }
        }
        
        // Add Peekaboo animation for peekaboo layout
        if (isPeekaboo) {
            // Start hidden off-screen
            widgetElement.style.transform = 'translateX(-120%) rotate(-10deg)';
            widgetElement.style.opacity = '1';
            
            // Step 1: Peek (show just the edge) after 500ms
            setTimeout(() => {
                widgetElement.style.transform = 'translateX(-85%) rotate(5deg)';
                widgetElement.style.transition = 'transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)';
                
                // Step 2: Full reveal after 1 second of peeking
                setTimeout(() => {
                    widgetElement.style.transform = 'translateX(0) rotate(0deg)';
                    
                    // Animate avatar sliding out
                    const avatar = widgetElement.querySelector('[data-peekaboo-avatar]');
                    if (avatar) {
                        setTimeout(() => {
                            avatar.style.transform = 'translateX(16px) translateY(12px) scale(0.75)';
                            avatar.style.opacity = '1';
                        }, 300);
                    }
                }, 1000);
            }, 500);
            
            // Add close button handler
            const closeBtn = widgetElement.querySelector('[data-peekaboo-close]');
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    widgetElement.style.transform = 'translateX(-120%) rotate(-10deg)';
                    setTimeout(() => {
                        if (widgetElement.parentNode) {
                            widgetElement.remove();
                        }
                        isDisplaying = false;
                        currentNotificationElement = null;
                    }, 700);
                });
                
                closeBtn.addEventListener('mouseenter', () => {
                    closeBtn.style.color = '#6b7280';
                });
                closeBtn.addEventListener('mouseleave', () => {
                    closeBtn.style.color = '#d1d5db';
                });
            }
        }
        
        // Add Floating Tag animation for floating-tag layout
        if (isFloatingTag) {
            // Start hidden with blur
            widgetElement.style.opacity = '0';
            widgetElement.style.transform = 'translateY(16px)';
            widgetElement.style.filter = 'blur(4px)';
            widgetElement.style.transition = 'all 0.7s cubic-bezier(0.2, 0.8, 0.2, 1)';
            
            // Animate in after small delay
            setTimeout(() => {
                widgetElement.style.opacity = '1';
                widgetElement.style.transform = 'translateY(0)';
                widgetElement.style.filter = 'blur(0)';
            }, 100);
        }
        
        // Add Story Pop animation for story-pop layout
        if (isStoryPop) {
            // Start hidden below
            widgetElement.style.opacity = '0';
            widgetElement.style.transform = 'translateY(80px) scale(0.9)';
            widgetElement.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
            
            // Animate in
            setTimeout(() => {
                widgetElement.style.opacity = '1';
                widgetElement.style.transform = 'translateY(0) scale(1)';
            }, 100);
            
            // Add close button handler
            const closeBtn = widgetElement.querySelector('[data-story-close]');
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    widgetElement.style.opacity = '0';
                    widgetElement.style.transform = 'translateY(80px) scale(0.9)';
                    setTimeout(() => {
                        if (widgetElement.parentNode) {
                            widgetElement.remove();
                        }
                        isDisplaying = false;
                        currentNotificationElement = null;
                    }, 500);
                });
                
                closeBtn.addEventListener('mouseenter', () => {
                    closeBtn.style.background = 'rgba(0,0,0,0.4)';
                });
                closeBtn.addEventListener('mouseleave', () => {
                    closeBtn.style.background = 'rgba(0,0,0,0.2)';
                });
            }
        }
        
        // Add Frosted Token animation for frosted-token layout
        if (isFrostedToken) {
            // Start hidden
            widgetElement.style.opacity = '0';
            widgetElement.style.transform = 'translateY(32px) scale(0.95)';
            widgetElement.style.transition = 'all 0.7s cubic-bezier(0.19, 1, 0.22, 1)';
            
            // Animate in
            setTimeout(() => {
                widgetElement.style.opacity = '1';
                widgetElement.style.transform = 'translateY(0) scale(1)';
                
                // Animate the label sliding in
                const label = widgetElement.querySelector('[data-frosted-label]');
                if (label) {
                    setTimeout(() => {
                        label.style.transform = 'translateX(0)';
                        label.style.opacity = '1';
                    }, 100);
                }
            }, 100);
        }
        
        // Add click handler
        widgetElement.addEventListener('click', () => {
            trackEvent('notification_click', {
                notification_id: notification.id,
                notification_type: notification.event_type,
                widget_id: notification.widget_id
            });
        });

        // Hide after duration
        setTimeout(() => {
            if (isPuzzle) {
                // Puzzle exit animation - pieces slide out
                const pieces = widgetElement.querySelectorAll('[data-puzzle-piece]');
                const piece1 = pieces[0];
                const piece2 = pieces[1];
                const piece3 = pieces[2];
                if (piece1) { piece1.style.transform = 'translateX(-50px)'; piece1.style.opacity = '0'; }
                if (piece2) { piece2.style.transform = 'translateY(-50px)'; piece2.style.opacity = '0'; }
                if (piece3) { piece3.style.transform = 'translateX(50px)'; piece3.style.opacity = '0'; }
            } else if (isPeekaboo) {
                // Peekaboo exit animation - slide back off screen
                widgetElement.style.transform = 'translateX(-120%) rotate(-10deg)';
            } else if (isFloatingTag) {
                // Floating Tag exit animation - fade down with blur
                widgetElement.style.opacity = '0';
                widgetElement.style.transform = 'translateY(16px)';
                widgetElement.style.filter = 'blur(4px)';
            } else if (isStoryPop) {
                // Story Pop exit animation - slide down and scale
                widgetElement.style.opacity = '0';
                widgetElement.style.transform = 'translateY(80px) scale(0.9)';
            } else if (isFrostedToken) {
                // Frosted Token exit animation - fade down and scale
                const label = widgetElement.querySelector('[data-frosted-label]');
                if (label) {
                    label.style.transform = 'translateX(16px)';
                    label.style.opacity = '0';
                }
                setTimeout(() => {
                    widgetElement.style.opacity = '0';
                    widgetElement.style.transform = 'translateY(32px) scale(0.95)';
                }, 200);
            } else {
                const exitState = getAnimationExitState(animationType, position);
                if (exitState.opacity !== undefined) {
                    widgetElement.style.opacity = exitState.opacity;
                }
                if (exitState.transform) {
                    widgetElement.style.transform = exitState.transform;
                }
            }
            setTimeout(() => {
                if (widgetElement.parentNode) {
                    widgetElement.remove();
                }
                // Mark as not displaying anymore
                isDisplaying = false;
                currentNotificationElement = null;
            }, fadeOutDuration);
        }, displayDuration);
        
        // Dispatch notification event
        window.dispatchEvent(new CustomEvent('proofpop:notification', {
            detail: { 
                id: notification.id,
                title: notification.title,
                message: notification.message,
                type: notification.event_type
            }
        }));
    }

    // Auto-track form submissions
    document.addEventListener('submit', (e) => {
        const form = e.target;
        const trackingAttr = form.getAttribute('data-proof-track');
        if (trackingAttr) {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            trackEvent(trackingAttr, {
                form_data: data,
                form_id: form.id,
                form_action: form.action
            });
        }
    });
    
    // Auto-track button clicks with data attributes
    document.addEventListener('click', (e) => {
        const element = e.target.closest('[data-proof-event], [data-proof-purchase]');
        if (element) {
            const eventType = element.getAttribute('data-proof-event') || 'purchase';
            const eventData = {};
            
            // Collect all data attributes
            Array.from(element.attributes).forEach(attr => {
                if (attr.name.startsWith('data-')) {
                    const key = attr.name.replace('data-', '').replace(/-/g, '_');
                    eventData[key] = attr.value;
                }
            });
            
            trackEvent(eventType, eventData);
        }
    });
    
    // Expose global API
    window.socialProofWidget = {
        trackEvent: trackEvent,
        getSiteId: () => siteId,
        getSessionId: () => sessionId,
        trackSignup: (data) => trackEvent('signup', data),
        trackPurchase: (data) => trackEvent('purchase', data),
        trackReview: (data) => trackEvent('review', data),
        getConfig: () => ({ siteId, sessionId }),
        getNotifications: () => document.querySelectorAll('[data-proofpop-notification]').length,
        debug: {
            testNotification: (title, message) => {
                window.dispatchEvent(new CustomEvent('proofpop:notification', {
                    detail: { title, message }
                }));
            },
            getCustomerData: () => ({ sessionId, siteId, url: window.location.href })
        }
    };

    // Initialize widgets after a short delay
    setTimeout(() => {
        fetchAndDisplayWidgets();
    }, 1000);

})();`;

  return new Response(engineCode, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache, no-store, must-revalidate', // Disable cache for testing
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
});
