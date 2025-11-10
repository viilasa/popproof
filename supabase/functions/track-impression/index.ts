import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      event_id, 
      site_id, 
      widget_id,
      notification_type,
      title,
      message,
      customer_name,
      location,
      product_name,
      amount,
      currency,
      icon,
      display_timestamp,
      notification_config
    } = await req.json();

    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Insert impression
    const { error } = await supabase
      .from('event_notifications')
      .insert({
        event_id,
        site_id,
        widget_id,
        notification_type,
        title,
        message,
        customer_name,
        location,
        product_name,
        amount,
        currency: currency || 'USD',
        icon,
        display_timestamp,
        notification_config: notification_config || {},
        displayed_count: 1
      });

    if (error) {
      console.error('Error inserting impression:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
