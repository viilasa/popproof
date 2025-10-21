import { corsHeaders } from '../_shared/cors.ts';

// Edge function to serve the widget engine script
Deno.serve((req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const engineCode = `(function() {
    console.log("ProofPop Widget Engine v2.0 Loaded");

    const WIDGET_API_URL = 'https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/get-widgets';
    const TRACK_EVENT_URL = 'https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/track-event';
    const VERIFY_PIXEL_URL = 'https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/verify-pixel';
    const WIDGET_NOTIFICATIONS_URL = 'https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/get-widget-notifications';

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
    
    // Track page view immediately
    trackEvent('page_view', {
        url: window.location.href,
        title: document.title,
        referrer: document.referrer
    });
    
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

    let notificationQueue = [];
    let currentNotificationIndex = 0;

    async function fetchAndDisplayWidgets() {
        try {
            // Fetch widgets and their real notifications
            const response = await fetch(\`\${WIDGET_NOTIFICATIONS_URL}?site_id=\${siteId}&limit=20\`);
            if (!response.ok) {
                throw new Error('Failed to fetch widget notifications.');
            }
            const data = await response.json();
            console.log('ProofPop: Fetched notifications:', data);
            
            if (data.success && data.widgets && data.widgets.length > 0) {
                // Collect all notifications from all widgets
                data.widgets.forEach(widgetData => {
                    if (widgetData.notifications && widgetData.notifications.length > 0) {
                        widgetData.notifications.forEach(notification => {
                            notificationQueue.push({
                                ...notification,
                                widgetName: widgetData.widget_name,
                                widgetType: widgetData.widget_type
                            });
                        });
                    }
                });
                
                console.log('ProofPop: Total notifications queued:', notificationQueue.length);
                
                // Start displaying notifications if we have any
                if (notificationQueue.length > 0) {
                    // Show first notification after 2 seconds
                    setTimeout(() => {
                        showNextNotification();
                    }, 2000);
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
        
        // Get next notification (cycle through)
        const notification = notificationQueue[currentNotificationIndex];
        currentNotificationIndex = (currentNotificationIndex + 1) % notificationQueue.length;
        
        showNotificationWidget(notification);
        
        // Schedule next notification
        const displayDuration = (notification.displayDuration || 8) * 1000;
        const delayBetween = 10000; // 10 seconds between notifications
        setTimeout(() => {
            showNextNotification();
        }, displayDuration + delayBetween);
    }

    function showNotificationWidget(notification) {
        const widgetElement = document.createElement('div');
        
        // Apply styles
        Object.assign(widgetElement.style, {
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            zIndex: '9999',
            backgroundColor: '#ffffff',
            color: '#333333',
            padding: '16px 20px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid rgba(0,0,0,0.08)',
            maxWidth: '350px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '14px',
            lineHeight: '1.4',
            transform: 'translateX(-100%)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer'
        });

        // Get first letter for avatar
        const initial = notification.title ? notification.title.charAt(0).toUpperCase() : '?';
        
        // Build location part
        let locationText = '';
        if (notification.showLocation && notification.location) {
            locationText = \` • 📍 \${notification.location}\`;
        }
        
        // Build timestamp part
        let timestampText = '';
        if (notification.showTimestamp && notification.timeAgo) {
            timestampText = \` • \${notification.timeAgo}\`;
        }
        
        widgetElement.innerHTML = \`
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 16px;">
                    \${initial}
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; margin-bottom: 2px;">\${notification.title}</div>
                    <div style="color: #666; font-size: 13px;">\${notification.message}</div>
                    <div style="color: #999; font-size: 12px; margin-top: 4px;">\${timestampText}\${locationText}</div>
                </div>
                <div style="width: 8px; height: 8px; border-radius: 50%; background: #10b981;"></div>
            </div>
        \`;

        document.body.appendChild(widgetElement);
        
        // Track notification impression
        trackEvent('notification_impression', {
            notification_id: notification.id,
            notification_type: notification.event_type,
            widget_id: notification.widget_id,
            title: notification.title
        });

        // Slide in animation
        setTimeout(() => {
            widgetElement.style.transform = 'translateX(0)';
        }, 100);
        
        // Add click handler
        widgetElement.addEventListener('click', () => {
            trackEvent('notification_click', {
                notification_id: notification.id,
                notification_type: notification.event_type,
                widget_id: notification.widget_id
            });
        });

        // Hide after duration
        const displayDuration = (notification.displayDuration || 8) * 1000;
        setTimeout(() => {
            widgetElement.style.transform = 'translateX(-100%)';
            setTimeout(() => {
                if (widgetElement.parentNode) {
                    widgetElement.remove();
                }
            }, 300);
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
      'Cache-Control': 'public, max-age=300' // 5 minutes cache for development
    }
  });
});
