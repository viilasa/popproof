# Webhook & Zapier Integration Guide

## Overview

PopProof supports webhook integrations that allow you to send events from any external system. This includes direct webhook calls and Zapier integration for connecting with 5000+ apps.

## Webhook Endpoint

**URL:** `https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/track-event`

**Method:** `POST`

**Content-Type:** `application/json`

## Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `site_id` | string | Your site's unique ID (found in the dashboard) |
| `event_type` | string | Type of event (e.g., `purchase`, `signup`, `review`, `test`) |

## Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `url` | string | The URL where the event occurred |
| `event_data` | object | Additional event data (see below) |
| `session_id` | string | User session identifier |
| `timestamp` | string | ISO 8601 timestamp |

## Event Data Object

The `event_data` object can contain any custom fields. Common fields include:

```json
{
  "customer_name": "John Doe",
  "product_name": "Premium Plan",
  "value": 99.99,
  "currency": "USD",
  "email": "john@example.com",
  "location": "New York, USA"
}
```

## Example Payloads

### Purchase Event
```json
{
  "site_id": "your-site-id",
  "event_type": "purchase",
  "url": "https://yoursite.com/thank-you",
  "event_data": {
    "customer_name": "Jane Smith",
    "product_name": "Pro Subscription",
    "value": 49.99,
    "currency": "USD"
  }
}
```

### Signup Event
```json
{
  "site_id": "your-site-id",
  "event_type": "signup",
  "url": "https://yoursite.com/welcome",
  "event_data": {
    "customer_name": "Mike Johnson",
    "plan": "Free Trial"
  }
}
```

### Review Event
```json
{
  "site_id": "your-site-id",
  "event_type": "review",
  "url": "https://yoursite.com/product/123",
  "event_data": {
    "customer_name": "Sarah Wilson",
    "rating": 5,
    "product_name": "Awesome Product"
  }
}
```

## Zapier Integration

### Step-by-Step Setup

1. **Create a new Zap** in your Zapier account

2. **Choose your trigger app** - This is the app that will trigger the event:
   - Stripe (for payments)
   - Shopify (for orders)
   - Typeform (for form submissions)
   - Google Sheets (for new rows)
   - Any of 5000+ supported apps

3. **Set up your trigger** - Configure when the Zap should fire

4. **Add an Action** - Choose "Webhooks by Zapier"

5. **Select "POST" as the action event**

6. **Configure the webhook:**
   - **URL:** `https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/track-event`
   - **Payload Type:** JSON
   - **Data:** Map your trigger data to the required fields

### Example Zapier Configuration

For a Stripe payment trigger:

| Zapier Field | Value |
|--------------|-------|
| URL | `https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/track-event` |
| Payload Type | JSON |
| Data: site_id | `your-site-id` |
| Data: event_type | `purchase` |
| Data: event_data.customer_name | `{{Customer Name}}` |
| Data: event_data.product_name | `{{Product Description}}` |
| Data: event_data.value | `{{Amount}}` |
| Data: event_data.currency | `{{Currency}}` |

## Testing Your Webhook

### Using the Dashboard

1. Go to your site's **Pixel Integration** page
2. Select **Webhook** or **Zapier** integration
3. Click the **"Send Test Event"** button
4. Check if the test was successful

### Using cURL

```bash
curl -X POST https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/track-event \
  -H "Content-Type: application/json" \
  -d '{
    "site_id": "your-site-id",
    "event_type": "test",
    "event_data": {
      "customer_name": "Test User",
      "product_name": "Test Product"
    }
  }'
```

### Expected Response

**Success (200):**
```json
{
  "success": true,
  "message": "Event tracked successfully",
  "event": {
    "event_type": "test",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error (400):**
```json
{
  "success": false,
  "error": "Missing required parameters",
  "message": "site_id and event_type are required"
}
```

## Troubleshooting

### Event not appearing in notifications

1. **Check site_id** - Ensure you're using the correct site ID from your dashboard
2. **Check event_type** - Make sure your widget is configured to listen for this event type
3. **Check widget settings** - Verify the widget is enabled and configured correctly

### Webhook returning errors

1. **400 Bad Request** - Missing required fields (site_id or event_type)
2. **405 Method Not Allowed** - Use POST method only
3. **500 Internal Server Error** - Contact support if this persists

### Zapier not sending events

1. Verify the Zap is turned ON
2. Check the Zap history for errors
3. Test the Zap manually using Zapier's test feature
4. Ensure the webhook URL is correct

## Rate Limits

- No strict rate limits for normal usage
- For high-volume integrations, contact support for dedicated endpoints

## Security

- All webhook requests are logged
- Events are associated with your site_id
- No authentication required for basic webhook calls
- For enhanced security, consider using API keys (available in dashboard)
