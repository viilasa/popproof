(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    FETCH_INTERVAL: 30000, // 30 seconds
    NOTIFICATION_DURATION: 5000, // 5 seconds
    MAX_NOTIFICATIONS: 3, // Maximum concurrent notifications
    API_TIMEOUT: 10000, // 10 seconds
    VERIFICATION_INTERVAL: 60000, // 1 minute - how often to verify the pixel is active
    SESSION_DURATION: 30 * 60 * 1000, // 30 minutes - how long a session lasts
    DEBUG: false, // Set to true to enable debug logging
  };

  class SocialProofWidget {
    constructor(clientId, apiBaseUrl) {
      this.clientId = clientId;
      this.apiBaseUrl = apiBaseUrl || 'https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1';
      this.lastEventId = null;
      this.activeNotifications = [];
      this.fetchInterval = null;
      this.verificationInterval = null;
      this.isInitialized = false;
      this.sessionId = this._generateSessionId();
      this.pageData = {
        url: window.location.href,
        title: document.title,
        referrer: document.referrer || null,
        path: window.location.pathname
      };
      this.visitorData = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
      
      // Create a custom event for when the widget is ready
      this.widgetReadyEvent = new CustomEvent('proofpop:ready', {
        detail: { clientId: this.clientId }
      });
      
      this.init();
      
      // Send pixel verification ping
      this.verifyPixel();
    }
    
    _generateSessionId() {
      return 'ss_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    init() {
      if (this.isInitialized) return;
      
      this.createStyles();
      this.createContainer();
      this.startFetching();
      this.setupEventListeners();
      this.startPeriodicVerification();
      this.trackPageView();
      this.isInitialized = true;
      
      // Dispatch the ready event
      window.dispatchEvent(this.widgetReadyEvent);
      
      if (CONFIG.DEBUG) {
        console.debug('ProofPop widget initialized with client ID:', this.clientId);
        console.debug('Session ID:', this.sessionId);
      }
    }
    
    setupEventListeners() {
      // Track form submissions
      document.addEventListener('submit', (event) => {
        const form = event.target;
        
        // Check if the form has a data-proof-track attribute
        const trackType = form.getAttribute('data-proof-track');
        if (trackType) {
          event.preventDefault();
          
          // Collect form data
          const formData = new FormData(form);
          const data = {};
          for (let [key, value] of formData.entries()) {
            data[key] = value;
          }
          
          // Track the event
          this.trackEvent(trackType, {
            form_id: form.id || null,
            form_name: form.getAttribute('name') || null,
            ...data
          });
          
          // Submit the form after a short delay
          setTimeout(() => {
            form.submit();
          }, 300);
        }
      });
      
      // Track clicks on elements with data-proof-event or data-proof-purchase attributes
      document.addEventListener('click', (event) => {
        let target = event.target;
        while (target && target !== document.body) {
          const trackType = target.getAttribute('data-proof-event');
          const isPurchase = target.hasAttribute('data-proof-purchase');
          
          if (trackType || isPurchase) {
            const eventType = isPurchase ? 'purchase' : trackType;
            const data = {};
            
            // Collect data attributes
            for (let attr of target.attributes) {
              if (attr.name.startsWith('data-') && 
                  attr.name !== 'data-proof-event' && 
                  attr.name !== 'data-proof-purchase') {
                const key = attr.name.replace('data-', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                data[key] = attr.value;
              }
            }
            
            this.trackEvent(eventType, data);
            break;
          }
          
          target = target.parentElement;
        }
      });
      
      // Track product views
      this.trackProductViews();
    }
    
    trackProductViews() {
      // Find product elements with data-product-id attributes
      const productElements = document.querySelectorAll('[data-product-id]');
      
      productElements.forEach(element => {
        // Check if we've already tracked this product view
        if (element.hasAttribute('data-proof-tracked')) {
          return;
        }
        
        // Mark as tracked
        element.setAttribute('data-proof-tracked', 'true');
        
        // Collect product data
        const data = {
          product_id: element.getAttribute('data-product-id'),
          product_name: element.getAttribute('data-product-name') || 
                        element.querySelector('.product-title')?.textContent || 
                        'Product',
          sku: element.getAttribute('data-sku') || null
        };
        
        // Track the product view event
        this.trackEvent('product_view', data);
      });
    }
    
    async verifyPixel() {
      if (!this.clientId) return;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);
        
        // Always use the Supabase URL for verification
        const apiUrl = 'https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1';
        
        // Hardcoded anon key for testing - in production, this would be handled more securely
        const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaW9idXVibW52bGF1a2V5dXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTM3NzA2MzcsImV4cCI6MjAwOTM0NjYzN30.Uh9KlRwxGgPRXBPSQTQXGdXEGUKYrWVXiQJrQBzHDQs';
        
        // Include more detailed information in the verification ping
        const verificationData = {
          client_id: this.clientId,
          session_id: this.sessionId,
          url: window.location.href,
          domain: window.location.hostname,
          path: window.location.pathname,
          referrer: document.referrer || null,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          screen_size: `${window.screen.width}x${window.screen.height}`,
          viewport_size: `${window.innerWidth}x${window.innerHeight}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
        
        const response = await fetch(
          `${apiUrl}/verify-pixel`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${anonKey}`
            },
            body: JSON.stringify(verificationData),
            signal: controller.signal,
          }
        );
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          if (CONFIG.DEBUG) {
            console.debug('Pixel verification successful:', data);
          }
          
          // Dispatch verification event
          window.dispatchEvent(new CustomEvent('proofpop:verified', {
            detail: { success: true, clientId: this.clientId }
          }));
        } else {
          if (CONFIG.DEBUG) {
            console.debug('Pixel verification failed with status:', response.status);
          }
          
          // Dispatch verification event
          window.dispatchEvent(new CustomEvent('proofpop:verified', {
            detail: { success: false, clientId: this.clientId, error: `HTTP ${response.status}` }
          }));
        }
      } catch (error) {
        if (CONFIG.DEBUG) {
          console.debug('Social proof widget verification ping failed:', error.message);
        }
        
        // Dispatch verification event
        window.dispatchEvent(new CustomEvent('proofpop:verified', {
          detail: { success: false, clientId: this.clientId, error: error.message }
        }));
      }
    }
    
    startPeriodicVerification() {
      // Set up interval for periodic verification
      this.verificationInterval = setInterval(() => {
        this.verifyPixel();
      }, CONFIG.VERIFICATION_INTERVAL);
    }
    
    trackPageView() {
      // Track page view event
      this.trackEvent('page_view', {
        url: window.location.href,
        title: document.title,
        referrer: document.referrer || null
      });
    }
    
    trackEvent(eventType, eventData = {}) {
      if (!this.clientId) return;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);
        
        const event = {
          client_id: this.clientId,
          session_id: this.sessionId,
          event_type: eventType,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          path: window.location.pathname,
          ...eventData
        };
        
        fetch(
          `${this.apiBaseUrl}/track-event`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(event),
            signal: controller.signal,
          }
        ).then(response => {
          clearTimeout(timeoutId);
          
          if (CONFIG.DEBUG) {
            if (response.ok) {
              console.debug(`Event '${eventType}' tracked successfully`);
            } else {
              console.debug(`Failed to track event '${eventType}':`, response.status);
            }
          }
          
          // Dispatch event tracking event
          window.dispatchEvent(new CustomEvent('proofpop:event-tracked', {
            detail: { success: response.ok, eventType, clientId: this.clientId }
          }));
        }).catch(error => {
          clearTimeout(timeoutId);
          if (CONFIG.DEBUG) {
            console.debug(`Error tracking event '${eventType}':`, error.message);
          }
        });
      } catch (error) {
        if (CONFIG.DEBUG) {
          console.debug(`Error tracking event '${eventType}':`, error.message);
        }
      }
    }

    createStyles() {
      const styleId = 'social-proof-widget-styles';
      if (document.getElementById(styleId)) return;

      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .sp-widget-container {
          position: fixed;
          bottom: 20px;
          left: 20px;
          z-index: 10000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          pointer-events: none;
        }

        .sp-notification {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-left: 4px solid #3B82F6;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          padding: 16px 20px;
          margin-bottom: 12px;
          max-width: 320px;
          min-width: 280px;
          opacity: 0;
          transform: translateX(-100%);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: auto;
          position: relative;
          overflow: hidden;
        }

        .sp-notification.show {
          opacity: 1;
          transform: translateX(0);
        }

        .sp-notification.hide {
          opacity: 0;
          transform: translateX(-100%);
        }

        .sp-notification::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #3B82F6, #10B981);
          animation: sp-progress 5s linear;
        }

        @keyframes sp-progress {
          from { width: 100%; }
          to { width: 0%; }
        }

        .sp-notification-header {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }

        .sp-notification-icon {
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #3B82F6, #10B981);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .sp-notification-icon::after {
          content: '✓';
          color: white;
          font-size: 12px;
          font-weight: bold;
        }

        .sp-notification-title {
          font-weight: 600;
          font-size: 14px;
          color: #1F2937;
          line-height: 1.4;
        }

        .sp-notification-content {
          font-size: 13px;
          color: #6B7280;
          line-height: 1.4;
          margin-left: 36px;
        }

        .sp-notification-meta {
          font-size: 11px;
          color: #9CA3AF;
          margin-left: 36px;
          margin-top: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sp-notification-time::before {
          content: '•';
          margin-right: 4px;
        }

        @media (max-width: 480px) {
          .sp-widget-container {
            left: 10px;
            right: 10px;
            bottom: 10px;
          }
          
          .sp-notification {
            max-width: none;
            min-width: auto;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .sp-notification {
            transition: opacity 0.2s ease;
          }
          
          .sp-notification::before {
            animation: none;
          }
        }
      `;
      
      document.head.appendChild(style);
    }

    createContainer() {
      this.container = document.createElement('div');
      this.container.className = 'sp-widget-container';
      this.container.setAttribute('aria-live', 'polite');
      this.container.setAttribute('aria-label', 'Social proof notifications');
      document.body.appendChild(this.container);
    }

    async fetchEvents() {
      if (!this.clientId) return;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);

        const response = await fetch(
          `${this.apiBaseUrl}/get-events?client_id=${encodeURIComponent(this.clientId)}&limit=5`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.events && Array.isArray(data.events)) {
          this.processEvents(data.events);
        }
      } catch (error) {
        // Fail silently as requested
        console.debug('Social proof widget fetch failed:', error.message);
      }
    }

    processEvents(events) {
      // Get new events (ones we haven't shown yet)
      const newEvents = events.filter(event => {
        return !this.lastEventId || new Date(event.timestamp) > new Date(this.lastEventId);
      });

      if (newEvents.length === 0) return;

      // Update last event timestamp
      if (newEvents.length > 0) {
        this.lastEventId = newEvents[0].timestamp;
      }

      // Show new events (limit concurrent notifications)
      newEvents.slice(0, CONFIG.MAX_NOTIFICATIONS).forEach((event, index) => {
        setTimeout(() => this.showNotification(event), index * 1000);
      });
    }

    showNotification(event) {
      if (this.activeNotifications.length >= CONFIG.MAX_NOTIFICATIONS) {
        // Remove oldest notification if we're at the limit
        const oldest = this.activeNotifications.shift();
        if (oldest) {
          this.hideNotification(oldest, 0);
        }
      }

      const notification = this.createNotificationElement(event);
      this.container.appendChild(notification);
      this.activeNotifications.push(notification);

      // Trigger show animation
      requestAnimationFrame(() => {
        notification.classList.add('show');
      });

      // Auto-hide after duration
      setTimeout(() => {
        this.hideNotification(notification);
      }, CONFIG.NOTIFICATION_DURATION);
    }

    createNotificationElement(event) {
      const notification = document.createElement('div');
      notification.className = 'sp-notification';
      
      const title = this.formatEventTitle(event);
      const content = this.formatEventContent(event);
      const meta = this.formatEventMeta(event);

      notification.innerHTML = `
        <div class="sp-notification-header">
          <div class="sp-notification-icon"></div>
          <div class="sp-notification-title">${this.escapeHtml(title)}</div>
        </div>
        ${content ? `<div class="sp-notification-content">${this.escapeHtml(content)}</div>` : ''}
        ${meta ? `<div class="sp-notification-meta">${meta}</div>` : ''}
      `;

      return notification;
    }

    formatEventTitle(event) {
      const name = event.user_name || 'Someone';
      const eventType = event.event_type || 'action';
      
      switch (eventType.toLowerCase()) {
        case 'purchase':
        case 'bought':
          return `${name} just made a purchase`;
        case 'signup':
        case 'registered':
          return `${name} just signed up`;
        case 'download':
          return `${name} just downloaded`;
        case 'view':
        case 'viewed':
          return `${name} is viewing`;
        default:
          return `${name} just performed an ${eventType}`;
      }
    }

    formatEventContent(event) {
      const parts = [];
      
      if (event.product_name) {
        parts.push(event.product_name);
      }
      
      if (event.value && typeof event.value === 'number') {
        const formatter = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        });
        parts.push(formatter.format(event.value));
      }

      return parts.join(' • ');
    }

    formatEventMeta(event) {
      const parts = [];
      
      if (event.location) {
        parts.push(`<span class="sp-notification-location">📍 ${this.escapeHtml(event.location)}</span>`);
      }
      
      if (event.timestamp) {
        const timeAgo = this.getTimeAgo(new Date(event.timestamp));
        parts.push(`<span class="sp-notification-time">${timeAgo}</span>`);
      }

      return parts.join('');
    }

    getTimeAgo(date) {
      const now = new Date();
      const diffMs = now - date;
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);

      if (diffSecs < 60) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString();
    }

    hideNotification(notification, delay = 300) {
      notification.classList.add('hide');
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
        
        const index = this.activeNotifications.indexOf(notification);
        if (index > -1) {
          this.activeNotifications.splice(index, 1);
        }
      }, delay);
    }

    startFetching() {
      // Initial fetch
      this.fetchEvents();
      
      // Set up interval
      this.fetchInterval = setInterval(() => {
        this.fetchEvents();
      }, CONFIG.FETCH_INTERVAL);
    }
    
    // Public API methods
    getSiteKey() {
      return this.clientId;
    }
    
    getSessionId() {
      return this.sessionId;
    }
    
    getWidgetId() {
      return 'proofpop-' + this.clientId.substring(0, 8);
    }
    
    getConfig() {
      return { ...CONFIG };
    }
    
    getNotifications() {
      return this.activeNotifications.length;
    }
    
    refresh() {
      this.fetchEvents();
    }
    
    track(eventType, data = {}) {
      this.trackEvent(eventType, data);
    }
    
    trackSignup(data = {}) {
      this.trackEvent('signup', data);
    }
    
    trackPurchase(data = {}) {
      this.trackEvent('purchase', data);
    }
    
    trackReview(data = {}) {
      this.trackEvent('review', data);
    }

    destroy() {
      if (this.fetchInterval) {
        clearInterval(this.fetchInterval);
      }
      
      if (this.verificationInterval) {
        clearInterval(this.verificationInterval);
      }
      
      if (this.container && this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }
      
      const styles = document.getElementById('social-proof-widget-styles');
      if (styles && styles.parentNode) {
        styles.parentNode.removeChild(styles);
      }
      
      this.isInitialized = false;
      
      // Dispatch destroyed event
      window.dispatchEvent(new CustomEvent('proofpop:destroyed', {
        detail: { clientId: this.clientId }
      }));
    }
    
    // Debug methods
    debug = {
      getTrackedForms: () => {
        return Array.from(document.querySelectorAll('[data-proof-track]'));
      },
      
      getCustomerData: () => {
        return {
          sessionId: this.sessionId,
          pageData: this.pageData,
          visitorData: this.visitorData
        };
      },
      
      testNotification: (title, message) => {
        const testEvent = {
          user_name: 'Test User',
          event_type: 'test',
          product_name: message || 'Test Notification',
          location: 'Test Location',
          timestamp: new Date().toISOString()
        };
        
        this.showNotification(testEvent);
      },
      
      clearQueue: () => {
        this.activeNotifications.forEach(notification => {
          this.hideNotification(notification, 0);
        });
        this.activeNotifications = [];
      }
    }

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  }

  // Auto-initialize from script tag
  function initializeWidget() {
    const script = document.currentScript || 
      Array.from(document.querySelectorAll('script')).find(s => 
        s.src && s.src.includes('widget.js')
      );
    
    if (!script) {
      console.warn('Social Proof Widget: Could not find script tag');
      return;
    }

    const clientId = script.getAttribute('data-client-id');
    const apiBaseUrl = script.getAttribute('data-api-url');
    
    if (!clientId) {
      console.warn('Social Proof Widget: data-client-id attribute is required');
      return;
    }

    // Initialize widget
    window.socialProofWidget = new SocialProofWidget(clientId, apiBaseUrl);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWidget);
  } else {
    initializeWidget();
  }

  // Export class for manual initialization
  window.SocialProofWidget = SocialProofWidget;
})();