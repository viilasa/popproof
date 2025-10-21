import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Get-widgets function booting up');

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const siteId = url.searchParams.get('site_id');

    if (!siteId) {
      throw new Error('Site ID is required');
    }

    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // First, verify the site is active and verified
    const { data: siteData, error: siteError } = await supabaseAdmin
      .from('sites')
      .select('verified')
      .eq('id', siteId)
      .single();

    if (siteError) throw siteError;

    if (!siteData || !siteData.verified) {
      throw new Error('Site is not verified.');
    }

    // Fetch active widgets for the given site ID
    const { data, error } = await supabaseAdmin
      .from('widgets')
      .select('config, type, name')
      .eq('is_active', true)
      .eq('site_id', siteId);

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('Error in get-widgets function:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
