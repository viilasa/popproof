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
    // Deduplication: Track recent events to prevent duplicates
    const recentEvents = [];
    const MAX_RECENT_EVENTS = 50;
    const DUPLICATE_WINDOW_MS = 3000; // 3 seconds
    
    const trackEvent = async (eventType, eventData = {}) => {
        try {
            // Create event signature for deduplication
            const eventSignature = JSON.stringify({
                type: eventType,
                name: eventData.customer_name || eventData.user_name,
                rating: eventData.rating,
                text: (eventData.review_text || eventData.review_content || '').substring(0, 50)
            });
            
            // Check for recent duplicates
            const now = Date.now();
            const isDuplicate = recentEvents.some(function(recent) {
                return recent.signature === eventSignature && 
                       (now - recent.timestamp) < DUPLICATE_WINDOW_MS;
            });
            
            if (isDuplicate) {
                console.log('ProofPop: Duplicate event detected, skipping:', eventType);
                return;
            }
            
            // Add to recent events (keep list size manageable)
            recentEvents.push({ signature: eventSignature, timestamp: now });
            if (recentEvents.length > MAX_RECENT_EVENTS) {
                recentEvents.shift();
            }
            
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
    // Track recently submitted forms to prevent duplicates
    const recentFormSubmissions = new Map();
    
    const setupFormTracking = () => {
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (!form || form.tagName !== 'FORM') return;
            
            // Skip forms that are manually tracked
            if (form.getAttribute('data-proofpop-manual') === 'true') {
                console.log('ProofPop: Form marked as manual tracking, skipping auto-track');
                return;
            }
            
            // Check if form has opt-out attribute
            if (form.hasAttribute('data-proofpop-ignore')) return;
            
            // Prevent duplicate submissions (within 2 seconds)
            const formId = form.id || form.name || 'form-' + Math.random();
            const now = Date.now();
            const lastSubmit = recentFormSubmissions.get(formId);
            
            if (lastSubmit && (now - lastSubmit) < 2000) {
                console.log('ProofPop: Duplicate form submission detected, skipping');
                return;
            }
            
            recentFormSubmissions.set(formId, now);
            
            // Determine form type (use getAttribute to avoid DOM element returns)
            const formType = form.getAttribute('data-proofpop-type') || 
                            form.getAttribute('id') || 
                            form.getAttribute('name') || 
                            detectFormType(form);
            
            // Collect form field data (only safe, non-sensitive fields)
            const formElements = form.elements;
            const fieldNames = [];
            const allFieldData = {}; // Capture ALL field values for debugging
            let customerName = '';
            let customerEmail = '';
            let rating = null;
            let reviewContent = '';
            
            for (let i = 0; i < formElements.length; i++) {
                const element = formElements[i];
                const name = element.name || element.id || '';
                const type = element.type || '';
                const tagName = element.tagName.toLowerCase();
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
                if (type === 'email' || type === 'text' || type === 'tel' || type === 'number' || tagName === 'textarea' || tagName === 'select') {
                    fieldNames.push(name);
                    // Store all field values (for review forms, we want everything)
                    if (value) {
                        allFieldData[name] = String(value).substring(0, 500);
                    }
                }
                
                // Capture customer name (more flexible matching)
                if ((name.toLowerCase().includes('name') || 
                     name.toLowerCase().includes('fname') ||
                     name.toLowerCase().includes('first') ||
                     name === 'review-name') && 
                    value && !customerName) {
                    customerName = String(value).substring(0, 50); // Limit length
                }
                
                // Capture customer email
                if (type === 'email' && value) {
                    customerEmail = String(value).substring(0, 100);
                }
                
                // Capture rating (more flexible - any numeric field with rating-like name OR any select/number 1-5)
                if (value && !rating) {
                    const nameLower = name.toLowerCase();
                    const ratingValue = parseInt(value);
                    
                    if ((nameLower.includes('rating') || 
                         nameLower.includes('stars') ||
                         nameLower.includes('star') ||
                         nameLower.includes('score') ||
                         (type === 'number' && !isNaN(ratingValue) && ratingValue >= 1 && ratingValue <= 5)) &&
                        !isNaN(ratingValue) && ratingValue >= 1 && ratingValue <= 5) {
                        rating = ratingValue;
                    }
                }
                
                // Capture review content (textarea OR any large text field with review-like name)
                if (value && !reviewContent) {
                    const nameLower = name.toLowerCase();
                    if ((tagName === 'textarea') ||
                        (nameLower.includes('review') && tagName === 'textarea') ||
                        nameLower.includes('comment') ||
                        nameLower.includes('feedback') ||
                        nameLower.includes('message') ||
                        nameLower.includes('content') ||
                        nameLower.includes('text') ||
                        nameLower.includes('description')) {
                        reviewContent = String(value).substring(0, 500); // Limit to 500 chars
                    }
                }
            }
            
            // If we didn't find rating/review through matching, try to infer from field values
            if (!rating || !reviewContent) {
                for (const [fieldName, fieldValue] of Object.entries(allFieldData)) {
                    // Try to find rating in any numeric field
                    if (!rating) {
                        const numValue = parseInt(fieldValue);
                        if (!isNaN(numValue) && numValue >= 1 && numValue <= 5) {
                            rating = numValue;
                        }
                    }
                    // Try to find review content in any long text (>20 chars)
                    if (!reviewContent && String(fieldValue).length > 20) {
                        reviewContent = String(fieldValue);
                    }
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
            
            // Add review-specific data if available
            if (rating !== null) {
                safeData.rating = rating;
            }
            if (reviewContent) {
                safeData.review_content = reviewContent;
            }
            
            // Detect review forms - NEVER auto-track these (require manual tracking for quality)
            const hasRatingField = rating !== null;
            const hasReviewField = reviewContent && reviewContent.length > 0;
            const formTypeIsReview = formType.toLowerCase().includes('review');
            const hasReviewInFields = fieldNames.some(function(name) {
                return name.toLowerCase().includes('review') || 
                       name.toLowerCase().includes('rating') ||
                       name.toLowerCase().includes('star');
            });
            
            const isReviewForm = formTypeIsReview || 
                                (hasRatingField && hasReviewField) ||
                                hasReviewInFields;
            
            // Skip auto-tracking for review forms - they should be manually tracked for better data quality
            if (isReviewForm) {
                console.log('ProofPop: Review form detected - skipping auto-track (detected by:', {
                    formType: formTypeIsReview,
                    hasRating: hasRatingField,
                    hasReview: hasReviewField,
                    hasReviewFields: hasReviewInFields
                });
                return;
            }
            
            // Debug logging
            console.log('ProofPop: Form submitted', {
                formType: formType,
                customerName: customerName,
                allFields: Object.keys(allFieldData)
            });
            
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
        if (platform === 'shopify') {
            // Helper function to find product image with multiple fallbacks
            const findShopifyProductImage = () => {
                console.log('ProofPop: Searching for Shopify product image...');
                
                // First try: og:image meta tag (most reliable)
                const ogImage = document.querySelector('meta[property="og:image"]');
                if (ogImage && ogImage.content && ogImage.content.includes('cdn.shopify')) {
                    console.log('ProofPop: Found image via og:image');
                    return ogImage.content;
                }
                
                // Second try: product JSON data (Shopify stores this)
                try {
                    // Look for product JSON in script tags
                    const scripts = document.querySelectorAll('script[type="application/json"]');
                    for (const script of scripts) {
                        try {
                            const data = JSON.parse(script.textContent);
                            // Check various JSON structures
                            const img = data?.product?.featured_image ||
                                       data?.product?.images?.[0]?.src ||
                                       data?.product?.image?.src ||
                                       data?.featured_image ||
                                       data?.images?.[0]?.src ||
                                       data?.image?.src;
                            if (img && img.includes('cdn.shopify')) {
                                console.log('ProofPop: Found image via product JSON');
                                return img.startsWith('//') ? 'https:' + img : img;
                            }
                        } catch (e) {}
                    }
                } catch (e) {}
                
                // Third try: CSS selectors for common themes
                const imageSelectors = [
                    // Main product images
                    '.product__media img',
                    '.product-single__photo img',
                    '.product-featured-media img',
                    '.product-featured-image img',
                    '.product__main-photos img',
                    '.product-gallery img',
                    '.product-image-main img',
                    '[data-product-image]',
                    '[data-product-featured-image]',
                    '.product-image img',
                    '.product__image img',
                    '.featured-image img',
                    '.product__thumbnail img',
                    '.product-single__thumbnail img',
                    '.product-gallery__image img',
                    '.product img[src*="cdn.shopify"]',
                    'img[src*="cdn.shopify.com/s/files"]',
                    '.product__media-item img',
                    '.media-gallery img',
                    '.product-single__media img',
                    '.product-single__photos img',
                    '.product-photo-container img',
                    '[class*="product"] img[src*="cdn.shopify"]',
                    // More generic
                    'main img[src*="cdn.shopify"]',
                    '#product img',
                    '.product-page img',
                    '[data-section-type="product"] img'
                ];
                
                for (const selector of imageSelectors) {
                    try {
                        const img = document.querySelector(selector);
                        if (img && img.src && img.src.includes('cdn.shopify')) {
                            console.log('ProofPop: Found image via selector:', selector);
                            // Get high-res version by removing size parameters
                            let imgSrc = img.src;
                            imgSrc = imgSrc.replace(/_\\d+x\\d*\\./, '.');
                            imgSrc = imgSrc.replace(/_\\d+x\\d*_crop_center\\./, '.');
                            return imgSrc;
                        }
                    } catch (e) {}
                }
                
                // Fourth try: Find the largest Shopify CDN image on the page (likely the product)
                const allShopifyImgs = document.querySelectorAll('img[src*="cdn.shopify.com"]');
                let largestImg = null;
                let largestSize = 0;
                
                for (const img of allShopifyImgs) {
                    // Skip tiny images (icons, logos)
                    const width = img.naturalWidth || img.width || 0;
                    const height = img.naturalHeight || img.height || 0;
                    const size = width * height;
                    
                    if (size > largestSize && size > 10000) { // At least 100x100
                        largestSize = size;
                        largestImg = img;
                    }
                }
                
                if (largestImg && largestImg.src) {
                    console.log('ProofPop: Found largest Shopify image');
                    return largestImg.src;
                }
                
                // Last resort: any Shopify CDN image
                const anyShopifyImg = document.querySelector('img[src*="cdn.shopify.com"]');
                if (anyShopifyImg && anyShopifyImg.src) {
                    console.log('ProofPop: Found any Shopify CDN image');
                    return anyShopifyImg.src;
                }
                
                console.log('ProofPop: No product image found');
                return '';
            };
            
            // Helper function to find product name
            const findShopifyProductName = () => {
                const nameSelectors = [
                    '.product-title',
                    '.product__title',
                    '.product-single__title',
                    'h1.title',
                    '[data-product-title]',
                    '.product-info__title',
                    '.product__info h1',
                    'h1[itemprop="name"]',
                    '.product-name h1',
                    '.product h1',
                    // More theme-specific selectors
                    '.product-meta__title',
                    '.ProductMeta__Title',
                    '.product-details__title',
                    '.product-form__title',
                    '[data-product-info] h1',
                    '.product-block h1',
                    'main h1'
                ];
                
                for (const selector of nameSelectors) {
                    const el = document.querySelector(selector);
                    if (el && el.textContent) {
                        // Clean up the text - remove extra whitespace and newlines
                        const cleanText = el.textContent.replace(/\\s+/g, ' ').trim();
                        // Make sure it's not a button or action text
                        if (cleanText && cleanText.length > 2 && 
                            !cleanText.toLowerCase().includes('add to cart') &&
                            !cleanText.toLowerCase().includes('buy now') &&
                            !cleanText.toLowerCase().includes('added')) {
                            return cleanText;
                        }
                    }
                }
                
                // Fallback to og:title
                const ogTitle = document.querySelector('meta[property="og:title"]');
                if (ogTitle && ogTitle.content) {
                    // Clean og:title - often has store name appended
                    let title = ogTitle.content;
                    // Remove common suffixes like " - Store Name" or " | Store Name"
                    title = title.split(' - ')[0].split(' | ')[0].trim();
                    return title;
                }
                
                // Try product JSON if available
                try {
                    const productJson = document.querySelector('[data-product-json], script[type="application/json"][data-product-json]');
                    if (productJson) {
                        const data = JSON.parse(productJson.textContent);
                        if (data.title) return data.title;
                    }
                } catch (e) {}
                
                return 'Product';
            };
            
            // Track add to cart
            document.addEventListener('click', (e) => {
                const btn = e.target.closest('[name="add"], [data-action="add-to-cart"], .product-form__submit, .add-to-cart, [type="submit"][name="add"], .btn-addtocart, .add-to-cart-btn, [data-add-to-cart], .quick-add-btn, .add-to-cart-button');
                if (btn) {
                    // Check if we're on a product page or collection/homepage
                    const isProductPage = window.location.pathname.includes('/products/');
                    
                    let productName, productImage, productPrice;
                    
                    if (isProductPage) {
                        // On product page - use page-level detection
                        productName = findShopifyProductName();
                        productImage = findShopifyProductImage();
                        productPrice = document.querySelector('.product__price, .price, [data-product-price], .product-single__price, .money, [data-price]')?.textContent?.trim();
                    } else {
                        // On collection/homepage - find the product card containing the button
                        const productCard = btn.closest('.product-card, .product-item, .grid-product, .product, .card, [data-product-card], .product-grid-item, .collection-product, article');
                        
                        if (productCard) {
                            // Get image from the product card
                            const cardImg = productCard.querySelector('img[src*="cdn.shopify"], img');
                            productImage = cardImg?.src || '';
                            
                            // Get name from the product card
                            const cardTitle = productCard.querySelector('.product-card__title, .product-item__title, .product-title, .card__heading, h3, h2, [data-product-title], a[href*="/products/"]');
                            productName = cardTitle?.textContent?.replace(/\\s+/g, ' ').trim() || '';
                            
                            // Get price from the product card
                            const cardPrice = productCard.querySelector('.price, .money, .product-price, [data-price]');
                            productPrice = cardPrice?.textContent?.trim() || '';
                            
                            console.log('ProofPop: Found product from card', { productName, productImage, productPrice });
                        } else {
                            // Fallback to page-level detection
                            productName = findShopifyProductName();
                            productImage = findShopifyProductImage();
                            productPrice = document.querySelector('.product__price, .price, [data-product-price], .product-single__price, .money, [data-price]')?.textContent?.trim();
                        }
                    }
                    
                    // Clean up product name
                    if (productName) {
                        productName = productName.replace(/\\s+/g, ' ').trim();
                        // Filter out button text
                        if (productName.toLowerCase().includes('add') || 
                            productName.toLowerCase().includes('cart') ||
                            productName.length < 3) {
                            productName = 'Product';
                        }
                    }
                    
                    console.log('ProofPop: Shopify add to cart detected', { productName, productImage, productPrice, isProductPage });
                    
                    trackEvent('add_to_cart', {
                        product_name: productName || 'Product',
                        product_image: productImage || '',
                        price: productPrice || '',
                        platform: 'shopify'
                    });
                }
            });
            
            // Track Shopify purchases on thank you / order confirmation page
            const isOrderConfirmation = window.location.pathname.includes('/thank_you') || 
                                       window.location.pathname.includes('/orders/') ||
                                       window.location.pathname.includes('order-confirmed') ||
                                       document.querySelector('.os-order-number, [data-order-id], .thank-you');
            
            if (isOrderConfirmation) {
                console.log('ProofPop: Shopify order confirmation page detected');
                
                // Try to get order data from Shopify's checkout object
                if (window.Shopify && window.Shopify.checkout) {
                    const checkout = window.Shopify.checkout;
                    const lineItems = checkout.line_items || [];
                    
                    lineItems.forEach((item, index) => {
                        // Delay each to avoid rate limiting
                        setTimeout(() => {
                            trackEvent('purchase', {
                                customer_name: checkout.billing_address?.first_name || checkout.shipping_address?.first_name || 'Someone',
                                product_name: item.title || item.name || 'Product',
                                product_image: item.image_url || item.featured_image?.url || item.image || '',
                                value: item.price || item.final_price || 0,
                                quantity: item.quantity || 1,
                                order_id: checkout.order_id || checkout.token,
                                location: checkout.billing_address?.city || checkout.shipping_address?.city || '',
                                currency: checkout.currency || 'USD',
                                platform: 'shopify'
                            });
                        }, index * 500);
                    });
                } else {
                    // Fallback: scrape from page
                    const orderItems = document.querySelectorAll('.product, .order-summary__section__content .product, [data-order-summary-section] .product, .product-thumbnail');
                    
                    orderItems.forEach((item, index) => {
                        setTimeout(() => {
                            const name = item.querySelector('.product__description__name, .product-thumbnail__title, .product-name, [data-product-name]')?.textContent?.trim() || 'Product';
                            const image = item.querySelector('img')?.src || '';
                            const price = item.querySelector('.product__price, .order-summary__emphasis, [data-product-price]')?.textContent?.trim() || '';
                            const customerName = document.querySelector('[data-customer-name], .customer-name, .os-header__title')?.textContent?.trim() || 'Someone';
                            const location = document.querySelector('[data-shipping-city], .address--tight')?.textContent?.trim() || '';
                            
                            trackEvent('purchase', {
                                customer_name: customerName,
                                product_name: name,
                                product_image: image,
                                value: parseFloat(price.replace(/[^0-9.]/g, '')) || 0,
                                location: location,
                                platform: 'shopify'
                            });
                        }, index * 500);
                    });
                }
            }
            
            // Also listen for Shopify's analytics events if available
            if (window.ShopifyAnalytics && window.ShopifyAnalytics.lib) {
                const originalTrack = window.ShopifyAnalytics.lib.track;
                window.ShopifyAnalytics.lib.track = function(eventName, data) {
                    if (eventName === 'Added Product' || eventName === 'Viewed Product') {
                        trackEvent(eventName === 'Added Product' ? 'add_to_cart' : 'page_view', {
                            product_name: data?.name || data?.productName,
                            product_image: data?.imageUrl || data?.image,
                            value: data?.price,
                            platform: 'shopify'
                        });
                    }
                    return originalTrack.apply(this, arguments);
                };
            }
        }
        
        // WooCommerce specific
        if (platform === 'woocommerce') {
            document.addEventListener('click', (e) => {
                const btn = e.target.closest('.add_to_cart_button, .single_add_to_cart_button');
                if (btn) {
                    const productName = document.querySelector('.product_title, .entry-title')?.textContent?.trim();
                    const productImage = document.querySelector('.woocommerce-product-gallery__image img, .wp-post-image')?.src || '';
                    trackEvent('add_to_cart', {
                        product_name: productName || 'Unknown',
                        product_image: productImage,
                        platform: 'woocommerce'
                    });
                }
            });
            
            // Track WooCommerce order confirmation
            const isWooOrderConfirmation = document.querySelector('.woocommerce-order-received, .woocommerce-thankyou');
            if (isWooOrderConfirmation) {
                const orderItems = document.querySelectorAll('.woocommerce-table--order-details .order_item, .order_details .order_item');
                orderItems.forEach((item, index) => {
                    setTimeout(() => {
                        const name = item.querySelector('.product-name a, .wc-item-meta')?.textContent?.trim() || 'Product';
                        const image = item.querySelector('img')?.src || '';
                        const customerName = document.querySelector('.woocommerce-customer-details address')?.textContent?.split('\\n')[0]?.trim() || 'Someone';
                        
                        trackEvent('purchase', {
                            customer_name: customerName,
                            product_name: name,
                            product_image: image,
                            platform: 'woocommerce'
                        });
                    }, index * 500);
                });
            }
        }
        
        console.log('ProofPop: Platform-specific tracking enabled for:', platform);
    };
    
    // ============================================
    // VISITOR SESSION TRACKING
    // ============================================
    let visitorHeartbeat;
    const startVisitorTracking = () => {
        // Prevent multiple tracking instances
        if (window.ProofPop && window.ProofPop._visitorTrackingActive) {
            console.log('ProofPop: Visitor tracking already active, skipping');
            return;
        }
        
        // Track initial visitor only once
        trackEvent('visitor_active', {
            session_id: sessionId,
            is_new_session: true
        });
        
        // Mark tracking as active
        window.ProofPop = window.ProofPop || {};
        window.ProofPop._visitorTrackingActive = true;
        
        // Send heartbeat every 3 minutes to track active visitors without spamming
        visitorHeartbeat = setInterval(() => {
            trackEvent('visitor_active', {
                session_id: sessionId,
                is_new_session: false
            });
        }, 180000);
        
        // Track when user leaves
        window.addEventListener('beforeunload', () => {
            clearInterval(visitorHeartbeat);
            window.ProofPop._visitorTrackingActive = false;
            trackEvent('visitor_left', {
                session_id: sessionId,
                time_on_page: Date.now() - performance.timing.navigationStart
            });
        });
        
        console.log('ProofPop: Visitor tracking enabled');
    };
    
    // Check if visitor tracking is needed (only if there are widgets that need it)
    const checkAndStartVisitorTracking = async () => {
        try {
            const response = await fetch('https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/get-widget-notifications?site_id=' + siteId + '&limit=1');
            if (response.ok) {
                const data = await response.json();
                // Check if any widget needs visitor_active events
                const needsVisitorTracking = data.widgets && data.widgets.some(function(widget) {
                    const config = widget.config || {};
                    const triggers = config.triggers || {};
                    const events = triggers.events || {};
                    const eventTypes = events.eventTypes || (config.rules && config.rules.eventTypes) || [];
                    return eventTypes.includes('visitor_active');
                });
                
                if (needsVisitorTracking) {
                    console.log('ProofPop: Visitor tracking needed for active widgets');
                    startVisitorTracking();
                } else {
                    console.log('ProofPop: No active widgets need visitor tracking - skipping');
                }
            } else {
                // If check fails, don't start tracking to be safe
                console.log('ProofPop: Could not verify widget requirements - skipping visitor tracking');
            }
        } catch (error) {
            console.log('ProofPop: Error checking widget requirements:', error);
        }
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
        // Prevent multiple initializations
        if (window.ProofPop && window.ProofPop._initialized) {
            console.log('ProofPop: Already initialized, skipping');
            return;
        }
        
        // Track page view immediately
        trackPageView();
        
        // Check if visitor tracking is needed before starting
        checkAndStartVisitorTracking();
        
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
        
        // Mark as initialized
        window.ProofPop._initialized = true;
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
