import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface GoogleReview {
  author_name: string;
  author_url?: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

interface PlaceDetailsResponse {
  result?: {
    name: string;
    rating?: number;
    user_ratings_total?: number;
    reviews?: GoogleReview[];
    formatted_address?: string;
    url?: string;
  };
  status: string;
  error_message?: string;
}

Deno.serve(async (req) => {
  console.log('fetch-google-reviews function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    // Get request body
    const { site_id, place_id, api_key } = await req.json();

    // Validate required parameters
    if (!site_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing site_id parameter'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // If place_id is provided, use it directly. Otherwise, fetch from database
    let googlePlaceId = place_id;
    let googleApiKey = api_key;

    if (!googlePlaceId || !googleApiKey) {
      // Fetch the Google integration settings from the database
      const { data: integration, error: integrationError } = await supabase
        .from('site_integrations')
        .select('settings')
        .eq('site_id', site_id)
        .eq('integration_type', 'google-reviews')
        .eq('is_active', true)
        .single();

      if (integrationError || !integration) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Google Reviews integration not configured for this site',
          details: 'Please connect Google Reviews in the integrations settings'
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      googlePlaceId = integration.settings?.place_id;
      googleApiKey = integration.settings?.api_key || Deno.env.get('GOOGLE_PLACES_API_KEY');
    }

    if (!googlePlaceId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Google Place ID not configured'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!googleApiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Google API Key not configured',
        details: 'Please add your Google Places API key in the integration settings'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch reviews from Google Places API
    const placesUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${googlePlaceId}&fields=name,rating,user_ratings_total,reviews,formatted_address,url&key=${googleApiKey}`;
    
    console.log('Fetching from Google Places API...');
    const placesResponse = await fetch(placesUrl);
    const placesData: PlaceDetailsResponse = await placesResponse.json();

    if (placesData.status !== 'OK') {
      console.error('Google Places API error:', placesData.status, placesData.error_message);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch reviews from Google',
        details: placesData.error_message || placesData.status
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const placeDetails = placesData.result;
    const reviews = placeDetails?.reviews || [];

    // Transform reviews into events and store them
    const timestamp = new Date().toISOString();
    const eventsToInsert = reviews.map((review: GoogleReview) => ({
      site_id: site_id,
      type: 'review',
      event_type: 'review',
      metadata: {
        source: 'google-reviews',
        customer_name: review.author_name,
        rating: review.rating,
        review_text: review.text,
        review_time: review.time,
        relative_time: review.relative_time_description,
        profile_photo: review.profile_photo_url,
        author_url: review.author_url,
        place_name: placeDetails?.name,
        place_rating: placeDetails?.rating,
        total_ratings: placeDetails?.user_ratings_total,
        fetched_at: timestamp
      }
    }));

    // Insert reviews as events (upsert to avoid duplicates)
    if (eventsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('events')
        .insert(eventsToInsert);

      if (insertError) {
        console.error('Error inserting review events:', insertError);
        // Don't fail the request, just log the error
      }
    }

    // Update the last sync time for the integration
    await supabase
      .from('site_integrations')
      .update({
        last_sync: timestamp,
        sync_status: 'success'
      })
      .eq('site_id', site_id)
      .eq('integration_type', 'google-reviews');

    return new Response(JSON.stringify({
      success: true,
      message: 'Google Reviews fetched successfully',
      data: {
        place_name: placeDetails?.name,
        place_rating: placeDetails?.rating,
        total_ratings: placeDetails?.user_ratings_total,
        reviews_count: reviews.length,
        reviews: reviews.map((r: GoogleReview) => ({
          author_name: r.author_name,
          rating: r.rating,
          text: r.text,
          relative_time: r.relative_time_description,
          profile_photo: r.profile_photo_url
        }))
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
