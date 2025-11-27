# Medusa.js Integration Guide

## Overview

Medusa.js is a headless e-commerce platform built with Node.js. PopProof integrates with Medusa by using **Subscribers** to listen for order events and send them to the PopProof webhook.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Medusa Backend │────▶│ PopProof Webhook│────▶│  Events Table   │
│  (Subscriber)   │     │  (track-event)  │     │  (Supabase)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
┌─────────────────┐     ┌─────────────────┐            │
│   Storefront    │────▶│  PopProof Pixel │◀───────────┘
│ (Next.js/Gatsby)│     │  (Displays)     │
└─────────────────┘     └─────────────────┘
```

## Setup Steps

### Step 1: Create the Subscriber (Backend)

Create a new file in your Medusa backend:

**File:** `src/subscribers/popproof-notification.ts`

```typescript
import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";

export default async function popproofHandler({
  data,
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderService = container.resolve("orderService");
  const order = await orderService.retrieve(data.id, {
    relations: ["items", "customer", "shipping_address"],
  });

  // Send to PopProof webhook
  await fetch("https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/track-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      site_id: "YOUR_SITE_ID", // Replace with your PopProof site ID
      event_type: "purchase",
      url: "https://your-store.com/order-confirmed",
      event_data: {
        customer_name: order.shipping_address?.first_name || "Someone",
        product_name: order.items[0]?.title || "Product",
        value: order.total / 100, // Medusa stores amounts in cents
        currency: order.currency_code?.toUpperCase(),
        location: order.shipping_address?.city + ", " + order.shipping_address?.country_code,
        order_id: order.id,
      },
    }),
  });
}

export const config: SubscriberConfig = {
  event: "order.placed",
  context: { subscriberId: "popproof-notification" },
};
```

### Step 2: Add Pixel to Storefront

Add the PopProof pixel to your storefront (Next.js, Gatsby, or custom):

**For Next.js (`pages/_app.tsx` or `app/layout.tsx`):**

```tsx
import Script from 'next/script';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Script 
        src="https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/pixel-loader"
        data-site-id="YOUR_SITE_ID"
        strategy="afterInteractive"
      />
      <Component {...pageProps} />
    </>
  );
}
```

**For Gatsby (`gatsby-browser.js`):**

```javascript
export const onClientEntry = () => {
  const script = document.createElement('script');
  script.src = 'https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/pixel-loader';
  script.setAttribute('data-site-id', 'YOUR_SITE_ID');
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
};
```

### Step 3: Restart Medusa Backend

After adding the subscriber, restart your Medusa backend:

```bash
npm run dev
# or
medusa develop
```

## Supported Events

You can create subscribers for different Medusa events:

| Medusa Event | PopProof Event Type | Description |
|--------------|---------------------|-------------|
| `order.placed` | `purchase` | New order created |
| `order.completed` | `purchase` | Order fulfilled |
| `order.canceled` | `refund` | Order canceled |
| `customer.created` | `signup` | New customer registered |
| `cart.updated` | `add_to_cart` | Item added to cart |

### Example: Customer Signup Subscriber

```typescript
// src/subscribers/popproof-signup.ts
import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";

export default async function popproofSignupHandler({
  data,
  container,
}: SubscriberArgs<{ id: string }>) {
  const customerService = container.resolve("customerService");
  const customer = await customerService.retrieve(data.id);

  await fetch("https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/track-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      site_id: "YOUR_SITE_ID",
      event_type: "signup",
      event_data: {
        customer_name: customer.first_name || "Someone",
        email: customer.email,
      },
    }),
  });
}

export const config: SubscriberConfig = {
  event: "customer.created",
  context: { subscriberId: "popproof-signup" },
};
```

## Environment Variables (Recommended)

Store your PopProof site ID in environment variables:

**`.env`:**
```
POPPROOF_SITE_ID=your-site-id-here
POPPROOF_WEBHOOK_URL=https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/track-event
```

**Updated Subscriber:**
```typescript
await fetch(process.env.POPPROOF_WEBHOOK_URL!, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    site_id: process.env.POPPROOF_SITE_ID,
    // ... rest of payload
  }),
});
```

## Testing

### 1. Test the Webhook Directly

```bash
curl -X POST https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/track-event \
  -H "Content-Type: application/json" \
  -d '{
    "site_id": "YOUR_SITE_ID",
    "event_type": "purchase",
    "event_data": {
      "customer_name": "Test User",
      "product_name": "Test Product",
      "value": 99.99,
      "currency": "USD"
    }
  }'
```

### 2. Place a Test Order

1. Go to your Medusa storefront
2. Add a product to cart
3. Complete checkout
4. Check PopProof dashboard for the new event

## Troubleshooting

### Events not appearing

1. **Check subscriber is loaded**: Look for "popproof-notification" in Medusa startup logs
2. **Check webhook response**: Add logging to your subscriber
3. **Verify site_id**: Ensure you're using the correct PopProof site ID

### Subscriber not triggering

1. Ensure the file is in `src/subscribers/`
2. Check the event name matches exactly (e.g., `order.placed`)
3. Restart Medusa after adding the subscriber

### CORS errors

The PopProof webhook allows all origins, so CORS shouldn't be an issue. If you see CORS errors, check your network/firewall settings.

## Advanced: Multiple Products

To show all products in an order:

```typescript
const productNames = order.items.map(item => item.title).join(", ");
const totalValue = order.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0) / 100;

body: JSON.stringify({
  site_id: "YOUR_SITE_ID",
  event_type: "purchase",
  event_data: {
    customer_name: order.shipping_address?.first_name,
    product_name: productNames,
    value: totalValue,
    currency: order.currency_code?.toUpperCase(),
    items_count: order.items.length,
  },
}),
```

## Medusa v2 (Coming Soon)

Medusa v2 uses a different event system. Support for Medusa v2 is coming soon. The webhook approach will remain the same, only the subscriber syntax will change.
