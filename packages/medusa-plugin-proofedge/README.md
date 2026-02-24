# medusa-plugin-proofedge

The official [ProofEdge](https://proofedge.io) social proof plugin for [Medusa.js](https://medusajs.com) stores.

Show real purchase notifications like **"Sarah from London just bought this"** on your storefront — powered by real order data, not fake popups.

---

## What Does This Plugin Do?

When a customer places an order on your Medusa store, this plugin automatically sends that purchase info to ProofEdge. ProofEdge then displays a small notification popup on your storefront showing recent purchases to other visitors.

**This builds trust and increases conversions** — when shoppers see that real people are buying from your store, they feel more confident buying too.

### How It Works (Step by Step)

```
1. A customer places an order on your Medusa store
2. Medusa fires an "order.placed" event
3. This plugin catches that event
4. It sends the purchase details to ProofEdge
5. ProofEdge shows a popup on your storefront:
   "Sarah from London just bought Premium Widget — 2 hours ago"
```

### What Data Gets Sent?

Only the minimum needed to show the notification:

| Data | Example | Why |
|------|---------|-----|
| Product name | "Premium Widget" | To show what was bought |
| Customer first name | "Sarah" | To make it feel real and personal |
| City | "London" | To show location |
| Country | "UK" | To show location |
| Timestamp | "2 hours ago" | To show recency |

**What is NOT sent:**
- No email addresses
- No full names
- No phone numbers
- No payment or card details
- No order totals or prices

Your customer data stays private and safe.

---

## Why Use ProofEdge on Your Medusa Store?

- **Real data, not fake** — Every notification comes from an actual order. No fake popups.
- **Zero manual work** — Once installed, it runs automatically. No data entry needed.
- **Privacy first** — Only first names and cities are shared. No sensitive data leaves your store.
- **Builds trust** — New visitors see that real people are buying, which increases their confidence.
- **Increases conversions** — Social proof is proven to boost sales by 10-15% on average.
- **Works with any Medusa storefront** — Next.js, Gatsby, or any custom frontend.
- **Lightweight** — The plugin adds no overhead to your checkout flow. It runs in the background.

---

## Installation

### Step 1 — Install the plugin

Run this in your **Medusa backend** directory:

```bash
npm install medusa-plugin-proofedge
```

### Step 2 — Get your ProofEdge credentials

1. Sign up at [proofedge.io](https://proofedge.io)
2. Create a new site in your [ProofEdge dashboard](https://app.proofedge.io)
3. Go to **Settings** and copy your **Site ID** and **API Key**

### Step 3 — Add environment variables

Add these to your Medusa backend `.env` file:

```bash
PROOFEDGE_SITE_ID=your_site_id_here
PROOFEDGE_API_KEY=your_api_key_here
```

### Step 4 — Add the plugin to your Medusa config

Open `medusa-config.js` in your Medusa backend and add the plugin:

```js
// medusa-config.js
const plugins = [
  // ... your other plugins (e.g., file storage, payment, etc.)
  {
    resolve: `medusa-plugin-proofedge`,
    options: {
      site_id: process.env.PROOFEDGE_SITE_ID,
      api_key: process.env.PROOFEDGE_API_KEY,
    },
  },
]
```

That's it! Restart your Medusa server and the plugin will start tracking orders automatically.

### Step 5 — Add the widget to your storefront

Install the storefront component in your **Next.js storefront** directory:

```bash
npm install @proofedge/medusa-storefront
```

Add the widget to your layout or product page:

```tsx
import { ProofEdgeWidget } from "@proofedge/medusa-storefront"

export default function Layout({ children }) {
  return (
    <html>
      <body>
        {children}
        <ProofEdgeWidget
          siteId={process.env.NEXT_PUBLIC_PROOFEDGE_SITE_ID}
          position="bottom-left"
        />
      </body>
    </html>
  )
}
```

Add this to your storefront `.env.local`:

```bash
NEXT_PUBLIC_PROOFEDGE_SITE_ID=your_site_id_here
```

---

## Configuration Options

### Basic setup (most users)

```js
{
  resolve: `medusa-plugin-proofedge`,
  options: {
    site_id: process.env.PROOFEDGE_SITE_ID,
    api_key: process.env.PROOFEDGE_API_KEY,
  },
}
```

### Advanced setup (more control)

```js
{
  resolve: `medusa-plugin-proofedge`,
  options: {
    site_id: process.env.PROOFEDGE_SITE_ID,
    api_key: process.env.PROOFEDGE_API_KEY,

    // Track both orders and product views (default: only orders)
    events: ["order.placed", "product.viewed"],

    // Use a custom API endpoint (default: https://api.proofedge.io)
    api_url: "https://api.proofedge.io",

    // Show detailed logs in your terminal (default: false)
    debug: true,
  },
}
```

### All Options

| Option | Type | Required | Default | What It Does |
|--------|------|----------|---------|--------------|
| `site_id` | string | Yes | — | Your ProofEdge Site ID. Found in your dashboard. |
| `api_key` | string | Yes | — | Your ProofEdge API Key. Found in your dashboard. |
| `events` | string[] | No | `["order.placed"]` | Which Medusa events to track. |
| `api_url` | string | No | `https://api.proofedge.io` | Custom API endpoint (rarely needed). |
| `debug` | boolean | No | `false` | Set to `true` to see logs in your terminal. |

### Available Events

| Event | What It Tracks | When to Use |
|-------|---------------|-------------|
| `order.placed` | Purchase notifications | Always (this is the main feature) |
| `product.viewed` | Product view tracking | When you want "X people viewed this" popups |

---

## Storefront Widget

### Widget Props

| Prop | Type | Required | Default | What It Does |
|------|------|----------|---------|--------------|
| `siteId` | string | Yes | — | Your ProofEdge Site ID |
| `productId` | string | No | — | Show notifications for a specific product only |
| `position` | string | No | `"bottom-left"` | Where the popup appears on screen |
| `theme` | string | No | `"light"` | Color theme of the popup |
| `onLoad` | function | No | — | Runs when the widget finishes loading |

### Position Options

| Value | Where It Shows |
|-------|---------------|
| `"bottom-left"` | Bottom left corner (default, recommended) |
| `"bottom-right"` | Bottom right corner |
| `"top-left"` | Top left corner |
| `"top-right"` | Top right corner |

### Theme Options

| Value | Look |
|-------|------|
| `"light"` | White background, dark text (default) |
| `"dark"` | Dark background, light text |
| `"auto"` | Matches the user's system preference |

---

## Product-Specific Notifications

Want to show "Someone just bought THIS product" on a product page? Pass the `productId`:

```tsx
import { ProofEdgeWidget, useProofEdgeTracking } from "@proofedge/medusa-storefront"

export default function ProductPage({ product }) {
  // This tracks when someone views the product
  useProofEdgeTracking(product.id, product.title)

  return (
    <div>
      <h1>{product.title}</h1>

      {/* This shows purchase notifications for this specific product */}
      <ProofEdgeWidget
        siteId={process.env.NEXT_PUBLIC_PROOFEDGE_SITE_ID}
        productId={product.id}
        position="bottom-left"
        theme="light"
      />
    </div>
  )
}
```

Make sure to add `"product.viewed"` to your events config in `medusa-config.js` for view tracking to work.

---

## Troubleshooting

### Widget not showing on my storefront?

1. Check that `NEXT_PUBLIC_PROOFEDGE_SITE_ID` is set in your storefront `.env.local`
2. Make sure the Site ID matches what's in your [ProofEdge dashboard](https://app.proofedge.io)
3. Open your browser console — look for any `[ProofEdge]` error messages

### Orders not appearing as notifications?

1. Set `debug: true` in your plugin options in `medusa-config.js`
2. Restart your Medusa server
3. Place a test order
4. Check your Medusa terminal for `[ProofEdge] Sending purchase event:` logs
5. If you don't see any logs:
   - Make sure `PROOFEDGE_API_KEY` is set in your backend `.env`
   - Make sure the plugin is listed in your `medusa-config.js` plugins array

### Product view tracking not working?

1. Make sure `"product.viewed"` is in your `events` array:
   ```js
   events: ["order.placed", "product.viewed"]
   ```
2. Make sure `NEXT_PUBLIC_MEDUSA_BACKEND_URL` is set in your storefront `.env.local`
3. Check that your Medusa backend is running and accessible from the storefront

### Still stuck?

- Visit [proofedge.io/help](https://proofedge.io/help) for more guides
- Email support@proofedge.io

---

## How It Works Under the Hood

For developers who want to understand the internals:

1. **ProofEdgeService** — The core service that handles all communication with the ProofEdge API. It sends HTTP POST requests with purchase data and handles errors silently (your checkout flow is never affected).

2. **Order Subscriber** — Listens for the `order.placed` event from Medusa's event bus. When triggered, it fetches the full order details (items, shipping address) and sends one event per line item to ProofEdge.

3. **Product View Subscriber** — Optionally listens for `product.viewed` events and forwards them to ProofEdge for view-count notifications.

4. **API Route** — Exposes `POST /proofedge/track` on your Medusa backend so the storefront widget can send product view events through your server.

### Error Handling

The plugin is designed to **never break your store**:

- All API calls are wrapped in try/catch blocks
- If ProofEdge is down or unreachable, the error is logged and your store continues working normally
- No customer-facing errors will ever be caused by this plugin
- Debug logs only appear when `debug: true` is set

---

## Compatibility

| Requirement | Version |
|-------------|---------|
| Medusa.js | v1.x or v2.x |
| Node.js | 16 or higher |
| React (storefront) | 17 or higher |

---

## License

MIT © [ProofEdge](https://proofedge.io)
