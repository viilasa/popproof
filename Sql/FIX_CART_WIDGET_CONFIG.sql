-- Fix cart activity widget configuration
-- Site ID: 48bf66cb-8842-422f-a66f-a3a341a00ec1

-- Step 1: Check current cart widget configuration
SELECT 
  id,
  name,
  is_active,
  site_id,
  config->>'template_id' as template_id,
  config->'triggers'->'events'->>'eventTypes' as event_types_in_config,
  config->'rules'->>'eventTypes' as event_types_in_rules,
  notification_time_range,
  created_at
FROM widgets
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND (config->>'template_id' = 'cart_activity' OR name ILIKE '%cart%')
ORDER BY created_at DESC;

-- Step 2: Check if there's a notification_rules entry blocking it
SELECT 
  nr.id,
  nr.widget_id,
  nr.event_types,
  nr.is_active,
  nr.time_window_hours,
  w.name as widget_name
FROM notification_rules nr
JOIN widgets w ON nr.widget_id = w.id
WHERE w.site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND w.config->>'template_id' = 'cart_activity';

-- Step 3: Verify events exist with correct event_type
SELECT 
  COUNT(*) as total_cart_events,
  MAX(timestamp) as latest_event,
  MIN(timestamp) as oldest_event
FROM events
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND event_type = 'add_to_cart';

-- Step 4: FIX - Update the widget config to ensure eventTypes is set correctly
UPDATE widgets
SET config = jsonb_set(
  jsonb_set(
    config,
    '{triggers,events,eventTypes}',
    '["add_to_cart"]'::jsonb
  ),
  '{rules,eventTypes}',
  '["add_to_cart"]'::jsonb
)
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND (config->>'template_id' = 'cart_activity' OR name ILIKE '%cart%');

-- Step 5: Also ensure notification_time_range is reasonable (2 hours = 120 minutes but stored as hours)
UPDATE widgets
SET notification_time_range = 168  -- 7 days in hours
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND (config->>'template_id' = 'cart_activity' OR name ILIKE '%cart%')
  AND (notification_time_range IS NULL OR notification_time_range < 24);

-- Step 6: If notification_rules exists, update it too
UPDATE notification_rules
SET 
  event_types = ARRAY['add_to_cart'],
  is_active = true,
  time_window_hours = 168
WHERE widget_id IN (
  SELECT id FROM widgets 
  WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
    AND config->>'template_id' = 'cart_activity'
);

-- Step 7: Verify the fix
SELECT 
  id,
  name,
  is_active,
  config->'triggers'->'events'->>'eventTypes' as event_types_triggers,
  config->'rules'->>'eventTypes' as event_types_rules,
  notification_time_range
FROM widgets
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND config->>'template_id' = 'cart_activity';

-- Step 8: Test query - This is what the Edge Function runs
SELECT 
  e.id,
  e.event_type,
  e.timestamp,
  e.metadata->>'customer_name' as customer,
  e.metadata->>'product_name' as product,
  AGE(NOW(), e.timestamp) as age
FROM events e
WHERE e.site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND e.event_type = 'add_to_cart'
  AND e.timestamp > NOW() - INTERVAL '168 hours'
ORDER BY e.timestamp DESC
LIMIT 10;
