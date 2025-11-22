# How to Track Review Events with Rating and Content

## Using the ProofPop Pixel

When a customer submits a review on your website, track it with this code:

```javascript
// Track a review event with full details
window.ProofPop.track('review', {
  customer_name: 'Amelia Taylor',
  rating: 5,  // Required: 1-5 star rating
  review_content: 'Amazing product! Exceeded my expectations. Highly recommend to anyone looking for quality and great service.',
  product_name: 'Premium Package',  // Optional
  value: 99.99,  // Optional: purchase value
  location: 'New York, USA'  // Optional
});
```

## Required Fields for Reviews

To display name, rating, and review content, include these in metadata:

1. **`customer_name`** - The reviewer's name (shows in title)
2. **`rating`** - Number from 1-5 (shows as stars ⭐⭐⭐⭐⭐)
3. **`review_content`** or **`reviewContent`** - The review text

## Example: After Form Submission

```javascript
// Example: After customer submits review form
document.getElementById('review-form').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  
  // Track the review in ProofPop
  window.ProofPop.track('review', {
    customer_name: formData.get('name'),
    rating: parseInt(formData.get('rating')),
    review_content: formData.get('review_text'),
    product_name: formData.get('product'),
    location: formData.get('city')
  });
  
  // Submit to your backend...
});
```

## Using the API Directly

```javascript
fetch('https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/track-event', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    site_id: 'YOUR_SITE_ID',
    event_type: 'review',
    metadata: {
      customer_name: 'Sarah Johnson',
      rating: 5,
      review_content: 'Absolutely love this product! Best purchase ever.',
      product_name: 'Deluxe Plan',
      value: 149.99,
      location: 'Los Angeles'
    }
  })
})
```

## Field Names (Both Work)

The engine supports both naming conventions:
- `review_content` (snake_case)
- `reviewContent` (camelCase)

## Display Settings

Control what shows in your widget editor:
- **Display → Content → Show Customer Name**
- **Display → Content → Show Rating**
- **Display → Content → Show Review Content**

## Result

When properly tracked, your review notifications will show:

```
👤 Amelia Taylor
   left a 5-star review
   ⭐⭐⭐⭐⭐
   "Amazing product! Exceeded my expectations..."
   🟢 10 mins ago • New York
```
