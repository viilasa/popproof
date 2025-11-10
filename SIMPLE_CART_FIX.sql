-- Simple fix for cart activity widget
-- Site ID: 48bf66cb-8842-422f-a66f-a3a341a00ec1

-- This will fix the eventTypes configuration in the cart widget

UPDATE widgets
SET 
  config = jsonb_set(
    jsonb_set(
      COALESCE(config, '{}'::jsonb),
      '{triggers,events,eventTypes}',
      '["add_to_cart"]'::jsonb
    ),
    '{rules,eventTypes}',
    '["add_to_cart"]'::jsonb
  ),
  notification_time_range = 168  -- 7 days
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND (
    config->>'template_id' = 'cart_activity' 
    OR name ILIKE '%cart%'
  );

-- Verify the fix worked
SELECT 
  id,
  name,
  is_active,
  config->'triggers'->'events'->>'eventTypes' as event_types,
  notification_time_range,
  '✅ Should see: ["add_to_cart"]' as expected
FROM widgets
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND config->>'template_id' = 'cart_activity';

-- Check your 11 events are queryable
SELECT 
  COUNT(*) as cart_events_last_7_days
FROM events
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND event_type = 'add_to_cart'
  AND timestamp > NOW() - INTERVAL '7 days';
