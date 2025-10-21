import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  console.log('verify-pixel function called');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight');
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      console.log('Method not allowed:', req.method);
      return new Response(JSON.stringify({
        success: false,
        error: 'Method not allowed',
        message: 'Only POST requests are allowed'
      }), {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
      console.log('Request data:', requestData);
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid request body',
        message: 'Failed to parse JSON body'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Validate required parameters - Updated for new schema
    if (!requestData.site_id) {
      console.log('Missing required parameter: site_id');
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameter',
        message: 'site_id is required'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate the site exists and get its info
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('*')
      .eq('id', requestData.site_id)
      .single();

    if (siteError || !site) {
      console.error('Site not found:', requestData.site_id);
      return new Response(JSON.stringify({
        success: false,
        error: 'Site not found',
        message: 'The specified site does not exist'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // If there's a URL in the request, validate it
    if (requestData.url) {
      try {
        new URL(requestData.url); // This will throw if the URL is invalid
      } catch (e) {
        console.warn('Invalid URL in request:', requestData.url);
        // Optionally, you can continue even if the URL is invalid
        // or return an error if the URL is required
      }
    }

    // Get client IP
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';

    // Create verification token
    const verificationToken = 'verify_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // Log the verification attempt
    await supabase.from('pixel_verifications').insert([
      {
        site_id: requestData.site_id,
        verification_token: verificationToken,
        status: 'success',
        verified_at: new Date().toISOString(),
        user_agent: req.headers.get('user-agent') || null,
        ip_address: clientIP,
        referrer: requestData.referrer || null
      }
    ]);

    // Update site verification status
    await supabase.rpc('update_site_verification_status', {
      p_site_id: requestData.site_id,
      p_status: 'verified'
    });

    console.log('Site verification successful:', requestData.site_id);

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      message: 'Pixel verified successfully',
      site_id: requestData.site_id,
      verification_token: verificationToken,
      verified: true,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error in verify-pixel function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred',
      details: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});