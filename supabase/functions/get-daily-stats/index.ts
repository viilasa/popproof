import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Edge function to get daily aggregated stats for Pill Badge widgets
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const siteId = url.searchParams.get('site_id');
    const statType = url.searchParams.get('stat_type') || 'all'; // visitors, purchases, reviews, add_to_cart, all

    if (!siteId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'site_id is required'
      }), {
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get start of today (UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    console.log('Fetching daily stats for site:', siteId, 'stat_type:', statType, 'since:', todayISO);

    const stats: Record<string, number> = {};

    // Fetch visitor count (page_view events today)
    if (statType === 'all' || statType === 'visitors') {
      const { count: visitorCount, error: visitorError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .eq('event_type', 'page_view')
        .gte('timestamp', todayISO);

      if (visitorError) {
        console.error('Error fetching visitor count:', visitorError);
      }
      stats.visitors = visitorCount || 0;
    }

    // Fetch purchase count today
    if (statType === 'all' || statType === 'purchases') {
      const { count: purchaseCount, error: purchaseError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .eq('event_type', 'purchase')
        .gte('timestamp', todayISO);

      if (purchaseError) {
        console.error('Error fetching purchase count:', purchaseError);
      }
      stats.purchases = purchaseCount || 0;
    }

    // Fetch add_to_cart count today
    if (statType === 'all' || statType === 'add_to_cart') {
      const { count: cartCount, error: cartError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .eq('event_type', 'add_to_cart')
        .gte('timestamp', todayISO);

      if (cartError) {
        console.error('Error fetching cart count:', cartError);
      }
      stats.add_to_cart = cartCount || 0;
    }

    // Fetch review count today
    if (statType === 'all' || statType === 'reviews') {
      const { count: reviewCount, error: reviewError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .eq('event_type', 'review')
        .gte('timestamp', todayISO);

      if (reviewError) {
        console.error('Error fetching review count:', reviewError);
      }
      stats.reviews = reviewCount || 0;
    }

    // Fetch signup count today
    if (statType === 'all' || statType === 'signups') {
      const { count: signupCount, error: signupError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .eq('event_type', 'signup')
        .gte('timestamp', todayISO);

      if (signupError) {
        console.error('Error fetching signup count:', signupError);
      }
      stats.signups = signupCount || 0;
    }

    console.log('Daily stats:', stats);

    return new Response(JSON.stringify({
      success: true,
      stats,
      date: todayISO,
      site_id: siteId
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60' // Cache for 1 minute
      }
    });

  } catch (error) {
    console.error('Error in get-daily-stats:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});
