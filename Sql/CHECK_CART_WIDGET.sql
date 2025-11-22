-- Check if cart activity widget exists and is properly configured
-- Site ID: 48bf66cb-8842-422f-a66f-a3a341a00ec1

-- 1. Check all widgets for this site
SELECT 
  id,
  name,
  is_active,
  site_id,
  config->>'template_id' as template_id,
  created_at
FROM widgets
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
ORDER BY created_at DESC;

-- 2. Check specifically for cart activity widget
SELECT 
  id,
  name,
  is_active,
  site_id,
  config->>'template_id' as template_id,
  config->'triggers'->'events'->>'eventTypes' as event_types,
  created_at
FROM widgets
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND (
    config->>'template_id' = 'cart_activity'
    OR name ILIKE '%cart%'
  );

-- 3. Check if ANY active widgets exist
SELECT 
  COUNT(*) as active_widget_count
FROM widgets
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND is_active = true;

-- 4. Check cart events exist
SELECT 
  COUNT(*) as cart_event_count
FROM events
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND event_type = 'add_to_cart'
  AND timestamp > NOW() - INTERVAL '2 hours';
