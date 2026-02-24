# @proofedge/medusa-storefront

React components for adding [ProofEdge](https://proofedge.io) social proof widgets to your Medusa.js storefront.

Works with Next.js, Gatsby, or any React-based Medusa storefront.

---

## What Is This?

This package gives you two things:

1. **`ProofEdgeWidget`** — A React component that shows social proof popups like "Sarah from London just bought this" on your storefront.
2. **`useProofEdgeTracking`** — A React hook that tracks product page views and sends them to your Medusa backend.

Together with the [medusa-plugin-proofedge](https://www.npmjs.com/package/medusa-plugin-proofedge) backend plugin, this creates a complete social proof system for your Medusa store.

---

## Quick Start

### 1. Install

```bash
npm install @proofedge/medusa-storefront
```

### 2. Add your environment variable

In your storefront `.env.local` (Next.js) or `.env`:

```bash
NEXT_PUBLIC_PROOFEDGE_SITE_ID=your_site_id_here
```

Get your Site ID from the [ProofEdge dashboard](https://app.proofedge.io/settings).

### 3. Add the widget to your layout

This shows purchase notifications across your entire store:

```tsx
import { ProofEdgeWidget } from "@proofedge/medusa-storefront"

export default function RootLayout({ children }) {
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

That's it! You should see social proof popups on your storefront.

---

## Product-Specific Notifications

Want to show "Someone just bought THIS product" on a product page? Pass the `productId` and use the tracking hook:

```tsx
import { ProofEdgeWidget, useProofEdgeTracking } from "@proofedge/medusa-storefront"

export default function ProductPage({ product }) {
  // Tracks when someone views this product page
  useProofEdgeTracking(product.id, product.title)

  return (
    <div>
      <h1>{product.title}</h1>
      {/* ... your product details ... */}

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

For product view tracking, also add this to your `.env.local`:

```bash
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
```

---

## ProofEdgeWidget Props

| Prop | Type | Required | Default | What It Does |
|------|------|----------|---------|--------------|
| `siteId` | string | Yes | — | Your ProofEdge Site ID |
| `productId` | string | No | — | Filter notifications to a specific product |
| `position` | string | No | `"bottom-left"` | Where the popup appears on screen |
| `theme` | string | No | `"light"` | Color theme of the popup |
| `onLoad` | function | No | — | Callback when the widget script loads |

### Position Options

- `"bottom-left"` — Bottom left corner (default, recommended)
- `"bottom-right"` — Bottom right corner
- `"top-left"` — Top left corner
- `"top-right"` — Top right corner

### Theme Options

- `"light"` — White background, dark text (default)
- `"dark"` — Dark background, light text
- `"auto"` — Matches the user's system preference

---

## useProofEdgeTracking Hook

Tracks product page views. Call it on your product detail page:

```tsx
useProofEdgeTracking(productId, productTitle, siteId?, options?)
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `productId` | string | Yes | The Medusa product ID |
| `productTitle` | string | Yes | The product name |
| `siteId` | string | No | Your Site ID (reads from `NEXT_PUBLIC_PROOFEDGE_SITE_ID` if not passed) |
| `options` | object | No | `{ medusaBackendUrl?: string }` to override the backend URL |

The hook automatically:
- Fires once per product page mount (no duplicate tracking)
- Sends the event to your Medusa backend's `/proofedge/track` endpoint
- Fails silently — never blocks or breaks your page

---

## How It Works

```
1. ProofEdgeWidget loads the ProofEdge script on your page
2. The script connects to ProofEdge and fetches recent purchase events
3. It shows popups like "Sarah from London just bought Premium Widget"
4. useProofEdgeTracking sends product view events through your Medusa backend
5. Your Medusa backend (with medusa-plugin-proofedge) forwards them to ProofEdge
```

### Requirements

- The **backend plugin** ([medusa-plugin-proofedge](https://www.npmjs.com/package/medusa-plugin-proofedge)) must be installed on your Medusa server for purchase data to flow into ProofEdge.
- This **storefront package** handles the display side — showing popups and tracking views.

---

## Full Setup Guide

For a complete setup guide (backend + storefront), see the [medusa-plugin-proofedge README](https://www.npmjs.com/package/medusa-plugin-proofedge).

---

## Troubleshooting

### Widget not showing?

- Check that `NEXT_PUBLIC_PROOFEDGE_SITE_ID` is set in `.env.local`
- Make sure the Site ID matches your [ProofEdge dashboard](https://app.proofedge.io)
- Open browser console and look for `[ProofEdge]` messages

### Product view tracking not working?

- Add `NEXT_PUBLIC_MEDUSA_BACKEND_URL` to your `.env.local`
- Make sure your Medusa backend is running
- Make sure `"product.viewed"` is in your plugin's `events` config

### Need help?

- Visit [proofedge.io/help](https://proofedge.io/help)
- Email support@proofedge.io

---

## Compatibility

| Requirement | Version |
|-------------|---------|
| React | 17 or higher |
| Next.js | 13 or higher (App Router or Pages Router) |
| Node.js | 16 or higher |

---

## License

MIT © [ProofEdge](https://proofedge.io)
