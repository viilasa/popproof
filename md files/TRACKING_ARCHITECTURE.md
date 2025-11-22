# ProofPop Tracking Architecture

This document explains **how the ProofPop pixel and engine scripts collect data from client websites** (live visitors, recent purchases, add to cart, form submissions, etc.) and **how that data ends up in the database** for widgets to display.

---

## 1. Overview: Two Main Scripts

ProofPop uses **two client-side scripts**, both served from Supabase Edge Functions:

1. **Pixel Loader**  
   URL: `https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/pixel-loader`  
   Purpose: Installed on the client website. Responsible for **tracking events** and verifying the pixel.

2. **Widget Engine**  
   URL: `https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/engine`  
   Purpose: Loaded by the pixel. Responsible for **fetching notifications and rendering the popup widget** on the page.

High-level flow:

- The website includes the **pixel script** with a `data-site-id`.
- The pixel:
  - Detects the platform (Shopify, WooCommerce, Custom, etc.)
  - Tracks events (page_view, add_to_cart, purchase, form_submit, visitor_active, etc.)
  - Sends events to a **`track-event` Edge Function** in Supabase
  - Verifies the pixel using `verify-pixel`
  - Loads the **widget engine** script
- The engine:
  - Calls `get-widget-notifications` to fetch notifications for that `site_id`
  - Builds a queue of notifications
  - Renders them as floating widgets on the site
  - Tracks impressions via `track-impression`

---

## 2. Pixel Loader: How Events Are Captured

File: `supabase/functions/pixel-loader/index.ts`

The pixel code is served as a JS string from the Edge Function. On the client site, it runs inside an IIFE `(function(){ ... })()`.

### 2.1. Site ID and Initialization

```js
const scriptTag = document.currentScript || document.querySelector('script[data-site-id]');
const siteId = scriptTag.getAttribute('data-site-id');
const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
```

- Every page load is associated with a **site** (`site_id`) and a **session** (`session_id`).
- These identifiers are included in every event sent to the backend.

### 2.2. Platform Detection (Shopify, WooCommerce, etc.)

```js
const detectPlatform = () => {
  if (window.Shopify || document.querySelector('[data-shopify]') || 
      window.ShopifyAnalytics || document.querySelector('meta[content*="Shopify"]')) {
    return 'shopify';
  }
  // ...woocommerce, wordpress, medusa, etc.
  return 'custom';
};

const platform = detectPlatform();
```

This allows the pixel to enable **platform-specific tracking** (e.g. Shopify add-to-cart detection).

### 2.3. Core `trackEvent` Function

```js
const TRACK_EVENT_URL = 'https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/track-event';

const trackEvent = async (eventType, eventData = {}) => {
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

  await fetch(TRACK_EVENT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
};
```

This is the **main pipe into Supabase** for events.

**Deduplication**: the pixel keeps a small in-memory list of recent events and skips duplicates within a short time window to avoid spamming the backend.

### 2.4. Page View Tracking

```js
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

// Called during init()
trackPageView();
```

This creates a `page_view` event for every page load.

### 2.5. Form Tracking → `form_submit` Events

The pixel listens on **all form submissions**:

```js
document.addEventListener('submit', (e) => {
  const form = e.target;
  // Skip if marked manual or ignored
  // Collect safe fields (no passwords / credit cards)
  // Detect customer name, email, rating, review content

  trackEvent('form_submit', safeData);
});
```

Special logic:

- Skips forms marked `data-proofpop-manual="true"` or `data-proofpop-ignore`.
- Tries to detect **review forms** (rating + review text) and *does not auto-track* them – those should be tracked manually for quality.

### 2.6. Button Click Tracking → Custom Events

```js
document.addEventListener('click', (e) => {
  const element = e.target.closest('[data-proofpop-event], [data-proofpop-track]');
  if (!element) return;

  const eventType = element.getAttribute('data-proofpop-event') || 'button_click';
  const eventData = {};

  for (let attr of element.attributes) {
    if (attr.name.startsWith('data-proofpop-')) {
      const key = attr.name.replace('data-proofpop-', '').replace(/-/g, '_');
      eventData[key] = attr.value;
    }
  }

  eventData.element_text = element.textContent.trim().substring(0, 100);
  eventData.element_tag = element.tagName.toLowerCase();

  trackEvent(eventType, eventData);
});
```

This allows **manual tracking** by adding `data-proofpop-event="purchase"` or similar attributes in HTML.

### 2.7. Platform-Specific Tracking (Shopify Example)

For Shopify, the pixel hooks into add-to-cart buttons:

```js
if (platform === 'shopify' && window.Shopify) {
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
```

You can extend this pattern to track purchases by using `window.ProofPop.trackPurchase(...)` on Shopify's Thank You page.

### 2.8. Live Visitors → `visitor_active` Events

The pixel can also track active visitors via heartbeat:

```js
const startVisitorTracking = () => {
  // Initial event
  trackEvent('visitor_active', {
    session_id: sessionId,
    is_new_session: true
  });

  // Heartbeat every 3 minutes
  visitorHeartbeat = setInterval(() => {
    trackEvent('visitor_active', {
      session_id: sessionId,
      is_new_session: false
    });
  }, 180000);
};
```

Before starting this, `checkAndStartVisitorTracking()` calls
`get-widget-notifications` to see if any widgets actually need `visitor_active` events.

---

## 3. Backend: Where Do Events Go in the Database?

On the backend, the events from `track-event` are typically stored in tables such as:

- `events` / `widget_events` (raw events)
- Derived tables or views that aggregate events into **notifications**

Exact schema depends on your migrations, but conceptually:

1. `track-event` Edge Function receives the JSON payload.
2. It inserts a row containing:
   - `site_id`, `session_id`, `event_type`
   - `url`, `referrer`, `user_agent`
   - `event_data` (JSON with `product_name`, `customer_name`, etc.)
3. A separate process / SQL function / view converts recent events into **notification-ready rows** that `get-widget-notifications` returns.

Example event types:

- `page_view` – used by widgets like *Page Views Counter* or *Active Sessions*.
- `visitor_active` – used by *Live Visitors* widgets.
- `add_to_cart` – used by *Cart Activity* widgets.
- `purchase` – used by *Recent Purchase* widgets.
- `form_submit` – used by *Form Submission* widgets.

---

## 4. Widget Engine: How Notifications Are Shown

File: `supabase/functions/engine/index.ts`

The engine script is injected by the pixel and runs in the browser.

### 4.1. Fetching Notifications

```js
const WIDGET_NOTIFICATIONS_URL = 'https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/get-widget-notifications';

const response = await fetch(`${WIDGET_NOTIFICATIONS_URL}?site_id=${siteId}&limit=20`);
const data = await response.json();

// data.widgets[] contains widgets + notifications for each widget
```

Each `widgetData` includes:

- Widget design & display settings (position, layout, animation, etc.)
- Trigger settings (event types, delays)
- `notifications`: pre-built notifications derived from raw events.

### 4.2. Building the Notification Queue

```js
// Flatten notifications across widgets
const allNotifications = [];

data.widgets.forEach(widgetData => {
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

// Sort by timestamp and interleave across widgets
notificationQueue = [...];
```

### 4.3. Displaying Notifications

The engine manages:

- A `notificationQueue`
- An `isDisplaying` flag to avoid overlaps
- A `showNotificationWidget(notification, displaySettings)` function that:
  - Creates a floating DOM element
  - Applies design (position, colors, animations)
  - Animates in/out
  - Automatically hides after a configured duration

It also calls `trackNotificationImpression(notification)` to log that the notification was actually shown.

---

## 5. Summary: How Data Flows End-to-End

1. **Pixel on Client Site**
   - Loaded via `<script src=".../pixel-loader" data-site-id="...">`.
   - Detects platform and sets up:
     - `page_view` tracking
     - `form_submit` tracking
     - Button click tracking (`data-proofpop-*` attributes)
     - Shopify/WooCommerce add-to-cart tracking
     - Optional visitor tracking (`visitor_active`)
   - Sends events to `track-event` Edge Function.

2. **Backend / Supabase**
   - `track-event` writes raw events into tables.
   - SQL / functions aggregate recent events into notification payloads.

3. **Widget Engine Script**
   - Loaded by the pixel after verification.
   - Calls `get-widget-notifications` for the `site_id`.
   - Builds a queue of notifications and shows them as widgets with animations and design settings.
   - Tracks impressions via `track-impression`.

4. **ProofPop Dashboard**
   - You configure widgets (rules, design, triggers) in the UI.
   - Widgets reference event types (`purchase`, `add_to_cart`, `visitor_active`, etc.).
   - The engine uses these to decide which events to turn into visible notifications.

---

## 6. Shopify-Specific Recap

On a Shopify store:

1. You paste the pixel snippet into `theme.liquid` before `</head>`.
2. Pixel detects `platform = 'shopify'` and:
   - Tracks `page_view` on every page.
   - Tracks `add_to_cart` when customers click Shopify add-to-cart buttons.
3. Optionally, on the order status page, you can call `window.ProofPop.trackPurchase({...})` to track `purchase` events.
4. These events are stored in Supabase and used by widgets like **Live Visitors**, **Recent Purchase**, and **Cart Activity**.

---

This is how ProofPop is able to **capture real user actions from client websites**, send them to your backend, and then **display them as live social proof notifications** through the widget engine.
