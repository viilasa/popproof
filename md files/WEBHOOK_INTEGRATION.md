# Webhook Integration for ProofPop Widgets

This document explains **how to use webhooks to send data into ProofPop** so it can be turned into widget notifications (purchases, sign‑ups, form submissions, etc.).

The key idea:

> A webhook is just **an HTTP POST to the `track-event` endpoint**, with `site_id`, `event_type`, and your event data. ProofPop stores it in Supabase and the widget engine later turns it into notifications.

---

## 1. Inbound Webhook Endpoint

All external systems (your backend, Shopify app, Zapier, etc.) should send events to this endpoint:

```text
POST https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/track-event
Content-Type: application/json
```

This is the same endpoint shown in the **Webhook Trigger** section of the Widget Editor.

### 1.1. Required fields

The JSON body **must** include:

- `site_id` – the UUID of the site in ProofPop (visible in your dashboard / pixel settings).
- `event_type` – a short string that describes the event, e.g.:
  - `purchase`
  - `add_to_cart`
  - `signup`
  - `form_submit`
  - `review`
  - `visitor_active`
  - any custom value you decide (as long as your widgets are configured to use it).

If either `site_id` or `event_type` is missing, the function returns **400**.

### 1.2. Optional but recommended fields

You can send any additional fields; they will be merged into a `metadata` JSON column in the `events` table. Common fields:

- `session_id` – ID of the browser session (if you have one).
- `url` – page URL where the event happened.
- `referrer` – referrer URL.
- `timestamp` – ISO string; if omitted, backend will use `now()`.
- `event_data` – an object with your business-specific fields:
  - `customer_name`
  - `customer_email`
  - `product_name`
  - `value` / `amount` / `currency`
  - `location`
  - `rating`, `review_text`
  - etc.

The `track-event` function merges:

- top-level fields, and
- all keys inside `event_data`

into a single `metadata` JSON object for that event.

---

## 2. Example Payloads

### 2.1. Recent Purchase (e‑commerce)

```json
POST /functions/v1/track-event
Content-Type: application/json

{
  "site_id": "YOUR_SITE_ID", 
  "event_type": "purchase",
  "url": "https://yourstore.com/thank-you",
  "session_id": "sess_123",
  "event_data": {
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "product_name": "Premium Plan",
    "value": 99,
    "currency": "USD",
    "location": "New York, USA",
    "order_id": "ORDER-12345"
  }
}
```

Widgets configured for `eventTypes: ['purchase']` will pick up this event and display notifications like:

> John Doe purchased Premium Plan for $99

### 2.2. Add to Cart

```json
{
  "site_id": "YOUR_SITE_ID",
  "event_type": "add_to_cart",
  "url": "https://yourstore.com/products/shoe-123",
  "event_data": {
    "customer_name": "Someone",
    "product_name": "Nike Air Max",
    "value": 120,
    "currency": "USD"
  }
}
```

Widgets that track `eventTypes: ['add_to_cart']` (e.g. *Cart Activity* templates) will use this.

### 2.3. Signup / Registration

```json
{
  "site_id": "YOUR_SITE_ID",
  "event_type": "signup",
  "url": "https://yourapp.com/signup",
  "event_data": {
    "customer_name": "Sarah M.",
    "location": "London, UK",
    "plan": "Pro"
  }
}
```

Widgets configured for `eventTypes: ['signup']` (*New Signup* template) will display something like:

> Sarah M. signed up from London

### 2.4. Form Submission (contact / lead form)

```json
{
  "site_id": "YOUR_SITE_ID",
  "event_type": "form_submit",
  "url": "https://yourapp.com/contact",
  "event_data": {
    "form_type": "contact",
    "customer_name": "Emma W.",
    "customer_email": "emma@example.com",
    "message": "I would like to know more about your product"
  }
}
```

Used by widgets that track `eventTypes: ['form_submit']` (*Form Submission* template).

### 2.5. Review / Rating

```json
{
  "site_id": "YOUR_SITE_ID",
  "event_type": "review",
  "event_data": {
    "customer_name": "David L.",
    "rating": 5,
    "review_text": "Amazing product!", 
    "product_name": "Growth Plan"
  }
}
```

Used by review widgets (`eventTypes: ['review']`).

---

## 3. How Webhook Events Become Widget Notifications

1. **You send a webhook** to `/track-event` with `site_id` + `event_type` + `event_data`.
2. The **`track-event` Edge Function**:
   - Validates `site_id` and `event_type`.
   - Builds a metadata JSON with:
     - basic info (url, referrer, user_agent, session_id, timestamp, etc.)
     - all fields from `event_data`.
   - Inserts a row into the `events` table:

     ```ts
     {
       site_id: eventData.site_id,
       type: eventData.event_type,
       event_type: eventData.event_type,
       metadata: { ... }
     }
     ```

   - Updates `sites.last_ping` / `last_used` for verification.

3. When the **widget engine** runs on that site, it calls

   ```text
   GET get-widget-notifications?site_id=YOUR_SITE_ID
   ```

   The backend selects **recent events** from `events` that match each widget’s rule:

   - `event_type` is in widget’s `rules.eventTypes` (e.g. `['purchase']`).
   - event happened within configured `timeWindowHours`.
   - optional filters (min value, exclude test events, location, etc.).

4. Those events are transformed into **notification objects** with fields like:

   - `title`
   - `message`
   - `timeAgo`
   - `metadata` (raw fields)

5. The engine then **renders them as popups** using the widget’s design settings (position, animation, privacy, etc.).

Result: events from your webhook calls appear as live ProofPop notifications on the site.

---

## 4. Using Webhooks From Your Backend

### 4.1. Generic cURL example

```bash
curl -X POST \
  https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/track-event \
  -H "Content-Type: application/json" \
  -d '{
    "site_id": "YOUR_SITE_ID",
    "event_type": "purchase",
    "event_data": {
      "customer_name": "John Doe",
      "product_name": "Premium Plan",
      "value": 99,
      "currency": "USD"
    }
  }'
```

### 4.2. Node/TypeScript example (server-side)

```ts
import fetch from 'node-fetch';

async function sendPurchaseToProofPop() {
  await fetch('https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/track-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      site_id: process.env.PROOFPOP_SITE_ID,
      event_type: 'purchase',
      url: 'https://yourstore.com/thank-you',
      event_data: {
        customer_name: 'John Doe',
        product_name: 'Premium Plan',
        value: 99,
        currency: 'USD',
      },
    }),
  });
}
```

You would call this after your own system successfully records an order, subscription, signup, etc.

---

## 5. Relationship to Pixel & Auto Capture

You have **two ways** to send data into ProofPop:

1. **Pixel (front-end)** – automatically tracks:
   - page views
   - form submissions
   - button clicks
   - some platform-specific events (Shopify add-to-cart, etc.)

2. **Webhooks (back-end)** – you explicitly send events from your own servers or external tools when important actions happen.

Both methods end up at the **same `track-event` endpoint** and into the **same `events` table**. Widgets don’t care how the event arrived; they just filter by `site_id`, `event_type` and rules.

The **Webhook & Auto Capture** section in the widget editor is just a UI helper:

- Shows you the `track-event` URL to call.
- Lets you configure auto capture (form tracking) on the front-end via pixel.

---

## 6. Error Handling & Responses

`track-event` returns JSON like:

### 6.1. Success

```json
{
  "success": true,
  "message": "Event tracked successfully",
  "event": {
    "client_id": null,
    "event_type": "purchase",
    "timestamp": "2025-01-01T10:00:00.000Z"
  }
}
```

### 6.2. Common Error Cases

- **405 Method not allowed** – you used GET instead of POST.
- **400 Missing required parameters** – `site_id` or `event_type` missing.
- **400 Invalid JSON** – body is not valid JSON.
- **500 Database error** – Supabase insert failed (check logs).

You can log/monitor these responses from your backend or tools like Zapier / Make.

---

## 7. Outbound Webhooks (Future Use)

The schema includes a `webhook_logs` table and `WebhookSettings` in widget config, which are designed for **sending webhooks out** from ProofPop to your own endpoints.

Currently, the **main implemented flow** is **inbound webhooks → `track-event` → events → widgets**. Outbound webhooks can be added later by:

- Reading `config.webhooks` for a widget.
- Posting event/notification data to each configured `webhook_url`.
- Writing results into `webhook_logs`.

This lets you mirror notification activity into other systems (CRMs, analytics, etc.).

---

## 8. Quick Checklist to Use Webhooks for Widget Notifications

1. **Get your `site_id`** from the ProofPop dashboard (same ID used in the pixel snippet).
2. **Decide event types** you want to send (e.g. `purchase`, `signup`, `form_submit`).
3. **Configure widgets** to listen for those event types in the dashboard.
4. **From your backend**, send POST requests to:

   ```
   https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/track-event
   ```

   with `site_id`, `event_type`, and `event_data`.

5. Visit your site with the ProofPop pixel & engine installed.
6. Trigger the event (order, signup, etc.) and you should see
   live notifications appear according to widget rules.

That’s how you use the webhook method to integrate and feed all relevant data into ProofPop for widget notifications.
