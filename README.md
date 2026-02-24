# medusa-plugin-proofedge

Official [ProofEdge](https://proofedge.com) social proof widget plugin for [Medusa.js](https://medusajs.com).

Automatically captures **real order data** from your Medusa store and powers your ProofEdge widget — no manual data entry, no fake notifications.

---

## How It Works

```
Customer places order
       ↓
Medusa fires "order.placed" event
       ↓
ProofEdge subscriber picks it up
       ↓
ProofEdgeService sends purchase data to ProofEdge API
       ↓
Widget shows "Sarah from London just bought this" 🎉
```

---

## Installation

### Step 1 — Install the backend plugin

```bash
# In your Medusa backend directory
npm install medusa-plugin-proofedge
```

### Step 2 — Add to medusa-config.js

```js
// medusa-config.js
const plugins = [
  // ... your other plugins
  {
    resolve: `medusa-plugin-proofedge`,
    options: {
      site_id: process.env.PROOFEDGE_SITE_ID,
      api_key: process.env.PROOFEDGE_API_KEY,
      // Optional: specify which events to track
      // Defaults to ["order.placed"]
      events: ["order.placed", "product.viewed"],
      // Optional: enable detailed logs during development
      debug: process.env.NODE_ENV === "development",
    },
  },
]
```

### Step 3 — Add environment variables

```bash
# .env (Medusa backend)
PROOFEDGE_SITE_ID=your_site_id_here
PROOFEDGE_API_KEY=your_api_key_here
```

Find these in your [ProofEdge dashboard](https://app.proofedge.com/settings).

### Step 4 — Install the storefront component

```bash
# In your Medusa Next.js storefront directory
npm install @proofedge/medusa-storefront
```

---

## Storefront Setup

### Option A — Site-wide widget (shows all recent purchases)

Add to your `app/layout.tsx` or `pages/_app.tsx`:

```tsx
import { ProofEdgeWidget } from "@proofedge/medusa-storefront"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <ProofEdgeWidget
          siteId={process.env.NEXT_PUBLIC_PROOFEDGE_SITE_ID!}
          position="bottom-left"
        />
      </body>
    </html>
  )
}
```

### Option B — Product-specific widget (recommended)

On your product detail page, pass the `productId` to show proof specific to that product:

```tsx
import { ProofEdgeWidget, useProofEdgeTracking } from "@proofedge/medusa-storefront"

export default function ProductPage({ product }) {
  // Tracks product views → sends to Medusa → forwarded to ProofEdge
  useProofEdgeTracking(product.id, product.title)

  return (
    <div>
      <h1>{product.title}</h1>
      {/* ...product details... */}

      <ProofEdgeWidget
        siteId={process.env.NEXT_PUBLIC_PROOFEDGE_SITE_ID!}
        productId={product.id}
        position="bottom-left"
        theme="light"
      />
    </div>
  )
}
```

### Add the public env variable

```bash
# .env.local (Next.js storefront)
NEXT_PUBLIC_PROOFEDGE_SITE_ID=your_site_id_here
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
```

---

## ProofEdgeWidget Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `siteId` | `string` | **required** | Your ProofEdge Site ID |
| `productId` | `string` | `undefined` | Medusa product ID for product-specific proof |
| `position` | `string` | `"bottom-left"` | Widget position: `bottom-left`, `bottom-right`, `top-left`, `top-right` |
| `theme` | `string` | `"light"` | Widget theme: `light`, `dark`, `auto` |
| `onLoad` | `function` | `undefined` | Callback when widget script is loaded |

---

## Plugin Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `site_id` | `string` | **required** | Your ProofEdge Site ID |
| `api_key` | `string` | **required** | Your ProofEdge API Key |
| `events` | `string[]` | `["order.placed"]` | Medusa events to track |
| `api_url` | `string` | `https://api.proofedge.com` | Custom API endpoint |
| `debug` | `boolean` | `false` | Enable verbose logging |

---

## Data Sent to ProofEdge

For each order, the plugin sends:

- **Product ID** and **Product Name** — to match the right widget
- **Customer first name only** — for privacy (e.g. "Sarah")
- **City and Country** — for location display (e.g. "London, UK")
- **Timestamp** — for recency display (e.g. "2 hours ago")

No email addresses, full names, or payment data are ever sent.

---

## Troubleshooting

**Widget not showing?**
- Check that `NEXT_PUBLIC_PROOFEDGE_SITE_ID` is set in your storefront `.env.local`
- Verify the site ID matches your ProofEdge dashboard

**Events not being tracked?**
- Set `debug: true` in plugin options and watch your Medusa server logs
- Confirm `PROOFEDGE_API_KEY` is set in your backend `.env`
- Ensure `medusa-plugin-proofedge` is in your `medusa-config.js` plugins array

**Product view tracking not working?**
- Make sure `NEXT_PUBLIC_MEDUSA_BACKEND_URL` points to your running Medusa server
- Add `product.viewed` to the `events` array in your plugin options

---

## License

MIT © ProofEdge
