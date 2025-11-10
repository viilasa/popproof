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
            padding: isCompact ? '8px' : isMinimal ? '12px' : '16px',
            overflow: 'hidden'
        };

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
        widgetElement.innerHTML = html;

        widgetElement.setAttribute('data-position', position);
        widgetElement.setAttribute('data-animation', animationType);
        widgetElement.setAttribute('data-fade-out', String(fadeOutDuration));

        if (container instanceof HTMLElement) {
            container.appendChild(widgetElement);
        } else {
            document.body.appendChild(widgetElement);
        }

        currentNotificationElement = widgetElement;
        
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
            const exitState = getAnimationExitState(animationType, position);
            if (exitState.opacity !== undefined) {
                widgetElement.style.opacity = exitState.opacity;
            }
            if (exitState.transform) {
                widgetElement.style.transform = exitState.transform;
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
