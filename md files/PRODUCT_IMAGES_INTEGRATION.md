# Product Images Integration Guide

This guide explains how to send purchase events with product images so they display in notification widgets like Puzzle, Ripple, and StoryPop.

## How It Works

1. **E-commerce platform sends event** → `track-event` function receives data with product image URL
2. **Data stored in `events` table** → metadata contains `product_image`, `customer_name`, `product_name`, etc.
3. **Widget requests notifications** → `get-widget-notifications` extracts image URLs
4. **Engine displays notifications** → Shows product images in supported layouts

## Supported Layouts with Product Images

| Layout | Product Image | User Avatar | Description |
|--------|--------------|-------------|-------------|
| **Puzzle** | ✅ Right piece | ✅ Left piece | Three-piece animated reveal |
| **Ripple** | ✅ Back circle | ✅ Front circle | Overlapping circles with heart badge |
| **StoryPop** | ✅ Main image | ❌ | Vertical story-like card |
| **Peekaboo** | ❌ | ✅ Slides out | Playful peek animation |
| **Card/Toast** | ❌ | ✅ Avatar circle | Standard notification layouts |

## API Event Format

### Basic Purchase Event with Product Image

```javascript
POST https://your-project.supabase.co/functions/v1/track-event

{
  "site_id": "your-site-uuid",
  "event_type": "purchase",
  "customer_name": "John Smith",
  "product_name": "Premium Headphones",
  "value": 149.99,
  "product_image": "https://example.com/images/headphones.jpg",
  "location": "New York, USA"
}
```

### Full Event with All Fields

```javascript
{
  "site_id": "your-site-uuid",
  "event_type": "purchase",
  
  // Customer Info
  "customer_name": "John Smith",
  "avatar": "https://example.com/avatars/john.jpg",  // User avatar
  
  // Product Info
  "product_name": "Premium Headphones",
  "product_image": "https://example.com/images/headphones.jpg",
  "value": 149.99,
  
  // Location (optional)
  "location": "New York, USA",
  
  // Additional metadata
  "order_id": "ORD-12345",
  "currency": "USD"
}
```

## WooCommerce Integration

### Option 1: Webhook (Recommended)

Configure WooCommerce to send order webhooks to PopProof:

1. Go to **WooCommerce → Settings → Advanced → Webhooks**
2. Add new webhook:
   - **Name**: PopProof Purchase Notification
   - **Status**: Active
   - **Topic**: Order created
   - **Delivery URL**: `https://your-project.supabase.co/functions/v1/woocommerce-webhook`
   - **Secret**: Your API key from PopProof dashboard

### WooCommerce Webhook Payload Processing

The webhook receives WooCommerce order data. Here's how to extract product images:

```javascript
// WooCommerce order webhook payload structure
{
  "id": 12345,
  "billing": {
    "first_name": "John",
    "last_name": "Smith",
    "city": "New York",
    "country": "US"
  },
  "line_items": [
    {
      "name": "Premium Headphones",
      "price": 149.99,
      "image": {
        "src": "https://yourstore.com/wp-content/uploads/headphones.jpg"
      }
    }
  ],
  "total": "149.99"
}
```

### Option 2: JavaScript Tracking (Manual)

Add this to your WooCommerce thank-you page:

```javascript
// On order confirmation page
<script>
  // Get order data from WooCommerce
  const orderData = {
    site_id: 'YOUR_SITE_ID',
    event_type: 'purchase',
    customer_name: '<?php echo $order->get_billing_first_name(); ?>',
    product_name: '<?php echo $order->get_items()[0]->get_name(); ?>',
    product_image: '<?php echo wp_get_attachment_url($product->get_image_id()); ?>',
    value: <?php echo $order->get_total(); ?>,
    location: '<?php echo $order->get_billing_city() . ", " . $order->get_billing_country(); ?>'
  };
  
  // Send to PopProof
  if (window.ProofPop) {
    window.ProofPop.trackPurchase(orderData);
  }
</script>
```

## Shopify Integration

### Shopify Webhook Setup

1. Go to **Settings → Notifications → Webhooks**
2. Create webhook for **Order creation**
3. URL: `https://your-project.supabase.co/functions/v1/shopify-webhook`

### Shopify Webhook Payload

```javascript
{
  "id": 820982911946154508,
  "customer": {
    "first_name": "John",
    "last_name": "Smith"
  },
  "line_items": [
    {
      "title": "Premium Headphones",
      "price": "149.99",
      "product_id": 632910392
    }
  ],
  "billing_address": {
    "city": "New York",
    "country": "United States"
  }
}
```

### Getting Product Images from Shopify

Shopify webhooks don't include product images directly. You need to:

1. **Use Shopify Admin API** to fetch product images:
```javascript
GET /admin/api/2024-01/products/{product_id}/images.json
```

2. **Or store images in metafields** and include in webhook

## Google Reviews Integration

For customer reviews with profile images:

```javascript
{
  "site_id": "your-site-uuid",
  "event_type": "review",
  "customer_name": "Jane Doe",
  "avatar": "https://lh3.googleusercontent.com/a/user-profile-image",
  "rating": 5,
  "review_content": "Amazing product! Highly recommend.",
  "location": "Los Angeles, CA"
}
```

## Image Requirements

### Recommended Specifications

| Property | Recommendation |
|----------|---------------|
| **Format** | JPEG, PNG, WebP |
| **Size** | 200x200px minimum |
| **Aspect Ratio** | 1:1 (square) for avatars, any for products |
| **File Size** | Under 500KB for fast loading |
| **HTTPS** | Required (no HTTP images) |

### Image URL Sources

The system looks for images in these fields (in order):

**Product Images:**
1. `product_image`
2. `image`
3. `image_url`
4. `product_images[0]`
5. `line_items[0].image`
6. `line_items[0].product_image`

**User Avatars:**
1. `avatar`
2. `user_avatar`
3. `customer_avatar`
4. `profile_image`

## Testing Your Integration

### 1. Send Test Event via cURL

```bash
curl -X POST https://your-project.supabase.co/functions/v1/track-event \
  -H "Content-Type: application/json" \
  -d '{
    "site_id": "your-site-uuid",
    "event_type": "purchase",
    "customer_name": "Test User",
    "product_name": "Test Product",
    "product_image": "https://picsum.photos/200",
    "avatar": "https://i.pravatar.cc/150",
    "value": 99.99,
    "location": "Test City, USA"
  }'
```

### 2. Check Events in Dashboard

Go to **Analytics** to see if your event was recorded.

### 3. View Notification Preview

Create a widget with Puzzle, Ripple, or StoryPop layout to see the images.

## Troubleshooting

### Images Not Showing

1. **Check HTTPS**: Images must be served over HTTPS
2. **Check CORS**: Image server must allow cross-origin requests
3. **Check URL**: Ensure the image URL is publicly accessible
4. **Check Size**: Very large images may fail to load

### Fallback Behavior

If no image is provided:
- **Product Image**: Shows a gradient placeholder with a package icon
- **User Avatar**: Shows initials in a gradient circle

## Example: Complete WooCommerce Plugin

```php
<?php
/**
 * Send purchase event to PopProof on order completion
 */
add_action('woocommerce_thankyou', 'popproof_track_purchase', 10, 1);

function popproof_track_purchase($order_id) {
    $order = wc_get_order($order_id);
    if (!$order) return;
    
    $items = $order->get_items();
    $first_item = reset($items);
    $product = $first_item->get_product();
    
    // Get product image
    $image_id = $product->get_image_id();
    $image_url = wp_get_attachment_image_url($image_id, 'medium');
    
    $event_data = array(
        'site_id' => get_option('popproof_site_id'),
        'event_type' => 'purchase',
        'customer_name' => $order->get_billing_first_name() . ' ' . substr($order->get_billing_last_name(), 0, 1) . '.',
        'product_name' => $first_item->get_name(),
        'product_image' => $image_url,
        'value' => $order->get_total(),
        'location' => $order->get_billing_city() . ', ' . $order->get_billing_country(),
        'order_id' => $order_id
    );
    
    wp_remote_post('https://your-project.supabase.co/functions/v1/track-event', array(
        'body' => json_encode($event_data),
        'headers' => array('Content-Type' => 'application/json'),
        'timeout' => 10
    ));
}
```

## Summary

To display product images in notifications:

1. **Send events with `product_image` field** containing a valid HTTPS image URL
2. **Use supported layouts**: Puzzle, Ripple, or StoryPop
3. **Optionally include `avatar`** for user profile pictures
4. **Test with sample images** before going live

The system automatically extracts images from various field names for compatibility with different e-commerce platforms.
