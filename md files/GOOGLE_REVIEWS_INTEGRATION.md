# Google Reviews Integration Guide

## Overview

PopProof can automatically fetch and display your Google Reviews as social proof notifications. This integration uses the Google Places API to retrieve reviews from your Google Business Profile.

## Prerequisites

1. **Google Business Profile** - Your business must be listed on Google Maps
2. **Google Cloud Account** - To get an API key
3. **Google Place ID** - Unique identifier for your business location

## Setup Steps

### Step 1: Get Your Google Place ID

1. Go to [Google Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id)
2. Search for your business name
3. Click on your business in the results
4. Copy the Place ID (it looks like `ChIJN1t_tDeuEmsRUsoyG83frY4`)

### Step 2: Create a Google Cloud API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Places API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Places API"
   - Click "Enable"
4. Create an API Key:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the API key

### Step 3: (Recommended) Restrict Your API Key

For security, restrict your API key:

1. Click on your API key in the Credentials page
2. Under "Application restrictions", select "HTTP referrers"
3. Add your website domains:
   - `https://yourdomain.com/*`
   - `https://*.supabase.co/*`
4. Under "API restrictions", select "Restrict key"
5. Select only "Places API"
6. Click "Save"

### Step 4: Connect in PopProof

1. Go to your site's **Pixel Integration** page
2. Select **Google Reviews** from the integrations
3. Enter your **Place ID**
4. Enter your **Google Places API Key**
5. Click **Connect & Fetch Reviews**
6. Verify the reviews appear in the preview

## How It Works

1. **Fetching Reviews**: When you connect, PopProof fetches your latest reviews from Google
2. **Storing Events**: Reviews are stored as events in your PopProof database
3. **Displaying Notifications**: Your widgets can display these reviews as social proof notifications
4. **Auto-Sync**: Reviews can be automatically synced on a schedule (coming soon)

## API Endpoint

The Google Reviews integration uses a Supabase Edge Function:

```
POST https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/fetch-google-reviews
```

### Request Body

```json
{
  "site_id": "your-site-id",
  "place_id": "ChIJ...",
  "api_key": "AIza..."
}
```

### Response

```json
{
  "success": true,
  "message": "Google Reviews fetched successfully",
  "data": {
    "place_name": "Your Business Name",
    "place_rating": 4.5,
    "total_ratings": 150,
    "reviews_count": 5,
    "reviews": [
      {
        "author_name": "John Doe",
        "rating": 5,
        "text": "Great service!",
        "relative_time": "2 weeks ago",
        "profile_photo": "https://..."
      }
    ]
  }
}
```

## Widget Configuration

To display Google Reviews in your notifications:

1. Go to **Widget Editor**
2. Set the **Event Type** to `review`
3. Configure the notification template to show:
   - `{{customer_name}}` - Reviewer's name
   - `{{rating}}` - Star rating (1-5)
   - `{{review_text}}` - Review content
   - `{{place_name}}` - Your business name

## Limitations

- **Google Places API Limits**: Free tier allows 5 reviews per request
- **Review Freshness**: Google only returns the 5 most recent reviews
- **API Costs**: Google Places API has usage costs after free tier
- **Rate Limits**: Respect Google's API rate limits

## Pricing

Google Places API pricing:
- **Free**: $200/month credit (covers ~10,000 requests)
- **After Free Tier**: $0.017 per request

For most small businesses, the free tier is sufficient.

## Troubleshooting

### "Invalid API Key"
- Verify the API key is correct
- Check that Places API is enabled
- Ensure API key restrictions allow your domain

### "Place Not Found"
- Verify the Place ID is correct
- Try searching for your business again on the Place ID Finder

### "No Reviews Found"
- Your business may not have any Google reviews yet
- Reviews must be public to be fetched

### "Request Denied"
- Check API key restrictions
- Verify billing is enabled on your Google Cloud project
- Ensure Places API is enabled

## Database Schema

Reviews are stored in the `events` table with:

```sql
{
  site_id: "uuid",
  type: "review",
  event_type: "review",
  metadata: {
    source: "google-reviews",
    customer_name: "John Doe",
    rating: 5,
    review_text: "Great service!",
    place_name: "Your Business",
    fetched_at: "2024-01-15T10:30:00Z"
  }
}
```

Integration settings are stored in `site_integrations`:

```sql
{
  site_id: "uuid",
  integration_type: "google-reviews",
  is_active: true,
  settings: {
    place_id: "ChIJ...",
    api_key: "AIza...",
    place_name: "Your Business"
  },
  last_sync: "2024-01-15T10:30:00Z",
  sync_status: "success"
}
```
