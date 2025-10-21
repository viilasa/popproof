import { corsHeaders } from '../_shared/cors.ts';

// Edge function to serve the pixel loader script with automatic verification
Deno.serve((req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const pixelCode = `
// ProofPop Pixel Loader v3.0 - Enhanced Auto-Tracking System
(function() {
    console.log('ProofPop: Pixel Loader v3.0 initialized');
    
    // Extract site_id from the script tag
    const scriptTag = document.currentScript || document.querySelector('script[data-site-id]');
    if (!scriptTag) {
        console.error('ProofPop: Script tag with data-site-id not found');
        return;
    }
    
    const siteId = scriptTag.getAttribute('data-site-id');
    if (!siteId) {
        console.error('ProofPop: data-site-id attribute is required');
        return;
    }
    
    console.log('ProofPop: Initializing for site:', siteId);
    
    // Generate unique session ID
    const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const TRACK_EVENT_URL = 'https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/track-event';
    
    // ============================================
    // PLATFORM DETECTION
    // ============================================
    const detectPlatform = () => {
        // Shopify detection
        if (window.Shopify || document.querySelector('[data-shopify]') || 
            window.ShopifyAnalytics || document.querySelector('meta[content*="Shopify"]')) {
            return 'shopify';
        }
        
        // WooCommerce detection
        if (typeof wc_add_to_cart_params !== 'undefined' || 
            document.querySelector('body').classList.contains('woocommerce') ||
            document.querySelector('.woocommerce')) {
            return 'woocommerce';
        }
        
        // WordPress detection (without WooCommerce)
        if (document.querySelector('meta[name="generator"][content*="WordPress"]') ||
            typeof wp !== 'undefined' || 
            document.querySelector('body').classList.contains('wordpress')) {
            return 'wordpress';
        }
        
        // MedusaJS detection
        if (window.medusa || document.querySelector('[data-medusa]') ||
            window.__MEDUSA__) {
            return 'medusajs';
        }
        
        // Squarespace
        if (window.Static && window.Static.SQUARESPACE_CONTEXT) {
            return 'squarespace';
        }
        
        // Wix
        if (window.wixBiSession || document.querySelector('meta[name="generator"][content*="Wix"]')) {
            return 'wix';
        }
        
        return 'custom';
    };
    
    const platform = detectPlatform();
    console.log('ProofPop: Detected platform:', platform);
    
    // ============================================
    // EVENT TRACKING FUNCTION
    // ============================================
    const trackEvent = async (eventType, eventData = {}) => {
        try {
            const payload = {
                site_id: siteId,
                session_id: sessionId,
                event_type: eventType,
                url: window.location.href,
                referrer: document.referrer,
                user_agent: navigator.userAgent,
                timestamp: new Date().toISOString(),
                platform: platform,
                event_data: eventData
            };
            
            const response = await fetch(TRACK_EVENT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                console.log('ProofPop: Event tracked:', eventType, eventData);
            }
        } catch (error) {
            console.warn('ProofPop: Event tracking failed:', error);
        }
    };
    
    // ============================================
    // PAGE VIEW TRACKING
    // ============================================
    const trackPageView = () => {
        const pageData = {
            title: document.title,
            path: window.location.pathname,
            search: window.location.search,
            hash: window.location.hash,
            referrer: document.referrer,
            screen_width: window.screen.width,
            screen_height: window.screen.height,
            viewport_width: window.innerWidth,
            viewport_height: window.innerHeight,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
        
        trackEvent('page_view', pageData);
    };
    
    // ============================================
    // FORM TRACKING
    // ============================================
    const setupFormTracking = () => {
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (!form || form.tagName !== 'FORM') return;
            
            // Check if form has opt-out attribute
            if (form.hasAttribute('data-proofpop-ignore')) return;
            
            // Determine form type (use getAttribute to avoid DOM element returns)
            const formType = form.getAttribute('data-proofpop-type') || 
                            form.getAttribute('id') || 
                            form.getAttribute('name') || 
                            detectFormType(form);
            
            // Collect form field data (only safe, non-sensitive fields)
            const formElements = form.elements;
            const fieldNames = [];
            let customerName = '';
            let customerEmail = '';
            
            for (let i = 0; i < formElements.length; i++) {
                const element = formElements[i];
                const name = element.name || element.id || '';
                const type = element.type || '';
                const value = element.value || '';
                
                // Skip sensitive fields
                if (!name || 
                    type === 'password' || 
                    type === 'hidden' ||
                    name.toLowerCase().includes('password') ||
                    name.toLowerCase().includes('credit') ||
                    name.toLowerCase().includes('card')) {
                    continue;
                }
                
                // Collect field names
                if (type === 'email' || type === 'text' || type === 'tel') {
                    fieldNames.push(name);
                }
                
                // Capture customer name
                if ((name.toLowerCase().includes('name') || 
                     name.toLowerCase().includes('fname') ||
                     name.toLowerCase().includes('first')) && 
                    type === 'text' && value) {
                    customerName = String(value).substring(0, 50); // Limit length
                }
                
                // Capture customer email
                if (type === 'email' && value) {
                    customerEmail = String(value).substring(0, 100);
                }
            }
            
            // Create safe data object (no DOM references)
            const safeData = {
                form_type: String(formType),
                form_id: form.id ? String(form.id) : 'unknown',
                form_action: form.action ? String(form.action) : '',
                field_count: Number(formElements.length),
                fields: fieldNames.map(f => String(f))
            };
            
            // Add customer data if available
            if (customerName) {
                safeData.customer_name = customerName;
            }
            if (customerEmail) {
                safeData.customer_email = customerEmail;
            }
            
            trackEvent('form_submit', safeData);
        });
        
        console.log('ProofPop: Form tracking enabled');
    };
    
    const detectFormType = (form) => {
        const action = form.action.toLowerCase();
        const formText = form.innerHTML.toLowerCase();
        
        if (action.includes('signup') || action.includes('register') || 
            formText.includes('sign up') || formText.includes('register')) {
            return 'signup';
        }
        if (action.includes('login') || action.includes('signin') ||
            formText.includes('log in') || formText.includes('sign in')) {
            return 'login';
        }
        if (action.includes('contact') || formText.includes('contact')) {
            return 'contact';
        }
        if (action.includes('subscribe') || action.includes('newsletter') ||
            formText.includes('subscribe') || formText.includes('newsletter')) {
            return 'newsletter';
        }
        if (action.includes('checkout') || formText.includes('checkout')) {
            return 'checkout';
        }
        
        return 'unknown';
    };
    
    // ============================================
    // BUTTON CLICK TRACKING
    // ============================================
    const setupButtonTracking = () => {
        document.addEventListener('click', (e) => {
            const element = e.target.closest('[data-proofpop-event], [data-proofpop-track]');
            if (!element) return;
            
            const eventType = element.getAttribute('data-proofpop-event') || 'button_click';
            const eventData = {};
            
            // Collect all data-proofpop-* attributes
            for (let attr of element.attributes) {
                if (attr.name.startsWith('data-proofpop-')) {
                    const key = attr.name.replace('data-proofpop-', '').replace(/-/g, '_');
                    eventData[key] = attr.value;
                }
            }
            
            // Add element context
            eventData.element_text = element.textContent.trim().substring(0, 100);
            eventData.element_tag = element.tagName.toLowerCase();
            eventData.element_id = element.id;
            eventData.element_class = element.className;
            
            trackEvent(eventType, eventData);
        });
        
        console.log('ProofPop: Button tracking enabled');
    };
    
    // ============================================
    // PLATFORM-SPECIFIC TRACKING
    // ============================================
    const setupPlatformTracking = () => {
        // Shopify specific
        if (platform === 'shopify' && window.Shopify) {
            // Track add to cart
            document.addEventListener('click', (e) => {
                const btn = e.target.closest('[name="add"], [data-action="add-to-cart"]');
                if (btn) {
                    const productName = document.querySelector('.product-title, .product__title, h1')?.textContent?.trim();
                    trackEvent('add_to_cart', {
                        product_name: productName || 'Unknown',
                        platform: 'shopify'
                    });
                }
            });
        }
        
        // WooCommerce specific
        if (platform === 'woocommerce') {
            document.addEventListener('click', (e) => {
                const btn = e.target.closest('.add_to_cart_button, .single_add_to_cart_button');
                if (btn) {
                    const productName = document.querySelector('.product_title, .entry-title')?.textContent?.trim();
                    trackEvent('add_to_cart', {
                        product_name: productName || 'Unknown',
                        platform: 'woocommerce'
                    });
                }
            });
        }
        
        console.log('ProofPop: Platform-specific tracking enabled for:', platform);
    };
    
    // ============================================
    // VISITOR SESSION TRACKING
    // ============================================
    let visitorHeartbeat;
    const startVisitorTracking = () => {
        // Track initial visitor
        trackEvent('visitor_active', {
            session_id: sessionId,
            is_new_session: true
        });
        
        // Send heartbeat every 30 seconds to track active visitors
        visitorHeartbeat = setInterval(() => {
            trackEvent('visitor_active', {
                session_id: sessionId,
                is_new_session: false
            });
        }, 30000);
        
        // Track when user leaves
        window.addEventListener('beforeunload', () => {
            clearInterval(visitorHeartbeat);
            trackEvent('visitor_left', {
                session_id: sessionId,
                time_on_page: Date.now() - performance.timing.navigationStart
            });
        });
        
        console.log('ProofPop: Visitor tracking enabled');
    };
    
    // ============================================
    // PIXEL VERIFICATION
    // ============================================
    const verifyPixel = async () => {
        try {
            const response = await fetch('https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/verify-pixel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    site_id: siteId,
                    url: window.location.href,
                    referrer: document.referrer,
                    user_agent: navigator.userAgent,
                    platform: platform,
                    timestamp: new Date().toISOString()
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('ProofPop: Pixel verification successful');
                
                window.dispatchEvent(new CustomEvent('proofpop:pixel-verified', {
                    detail: {
                        success: true,
                        siteId: siteId,
                        platform: platform,
                        verificationToken: result.verification_token,
                        timestamp: result.timestamp
                    }
                }));
                
                loadEngine();
            } else {
                console.warn('ProofPop: Pixel verification failed');
                loadEngine();
            }
        } catch (error) {
            console.warn('ProofPop: Verification error:', error);
            loadEngine();
        }
    };
    
    // ============================================
    // LOAD ENGINE
    // ============================================
    const loadEngine = () => {
        const engineScript = document.createElement('script');
        engineScript.src = 'https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/engine';
        engineScript.setAttribute('data-site-id', siteId);
        engineScript.async = true;
        engineScript.defer = true;
        
        engineScript.onload = () => {
            console.log('ProofPop: Engine loaded successfully');
            window.dispatchEvent(new CustomEvent('proofpop:engine-loaded', {
                detail: { siteId: siteId, platform: platform }
            }));
        };
        
        engineScript.onerror = () => {
            console.error('ProofPop: Failed to load engine');
        };
        
        document.head.appendChild(engineScript);
    };
    
    // ============================================
    // INITIALIZATION
    // ============================================
    const init = () => {
        // Track page view immediately
        trackPageView();
        
        // Start visitor tracking
        startVisitorTracking();
        
        // Setup auto-tracking (wait for DOM to be ready)
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setupFormTracking();
                setupButtonTracking();
                setupPlatformTracking();
            });
        } else {
            setupFormTracking();
            setupButtonTracking();
            setupPlatformTracking();
        }
        
        // Verify pixel
        verifyPixel();
    };
    
    // ============================================
    // GLOBAL API
    // ============================================
    window.ProofPop = window.ProofPop || {};
    window.ProofPop.track = trackEvent;
    window.ProofPop.trackPurchase = (data) => trackEvent('purchase', data);
    window.ProofPop.trackSignup = (data) => trackEvent('signup', data);
    window.ProofPop.trackReview = (data) => trackEvent('review', data);
    window.ProofPop.verify = verifyPixel;
    window.ProofPop.getSiteId = () => siteId;
    window.ProofPop.getSessionId = () => sessionId;
    window.ProofPop.getPlatform = () => platform;
    window.ProofPop.getStatus = () => ({
        siteId: siteId,
        sessionId: sessionId,
        platform: platform,
        url: window.location.href,
        loaded: true,
        timestamp: new Date().toISOString()
    });
    
    // Start the pixel!
    init();
})();
`;

  return new Response(pixelCode, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=300' // 5 minutes for development
    }
  });
});
