-- Create multiple widget types to see randomization in action
-- Site ID: 48bf66cb-8842-422f-a66f-a3a341a00ec1

-- First check what widgets already exist
SELECT 
  id,
  name,
  is_active,
  config->>'template_id' as template_id
FROM widgets
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1';

-- Create Recent Purchases widget
INSERT INTO widgets (
  site_id, name, type, is_active, config,
  position, offset_x, offset_y, display_duration, notification_time_range
)
SELECT 
  '48bf66cb-8842-422f-a66f-a3a341a00ec1',
  'Recent Purchases',
  'notification',
  true,
  jsonb_build_object(
    'template_id', 'recent_purchases',
    'name', 'Recent Purchases',
    'triggers', jsonb_build_object(
      'events', jsonb_build_object('eventTypes', jsonb_build_array('purchase'))
    ),
    'rules', jsonb_build_object(
      'eventTypes', jsonb_build_array('purchase'),
      'timeWindowHours', 168,
      'excludeTestEvents', false
    )
  ),
  'bottom-left', 20, 20, 8, 168
WHERE NOT EXISTS (
  SELECT 1 FROM widgets 
  WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1' 
    AND config->>'template_id' = 'recent_purchases'
);

-- Create Recent Signups widget
INSERT INTO widgets (
  site_id, name, type, is_active, config,
  position, offset_x, offset_y, display_duration, notification_time_range
)
SELECT 
  '48bf66cb-8842-422f-a66f-a3a341a00ec1',
  'Recent Signups',
  'notification',
  true,
  jsonb_build_object(
    'template_id', 'recent_signups',
    'name', 'Recent Signups',
    'triggers', jsonb_build_object(
      'events', jsonb_build_object('eventTypes', jsonb_build_array('signup'))
    ),
    'rules', jsonb_build_object(
      'eventTypes', jsonb_build_array('signup'),
      'timeWindowHours', 168,
      'excludeTestEvents', false
    )
  ),
  'bottom-left', 20, 20, 8, 168
WHERE NOT EXISTS (
  SELECT 1 FROM widgets 
  WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1' 
    AND config->>'template_id' = 'recent_signups'
);

-- Create Customer Reviews widget
INSERT INTO widgets (
  site_id, name, type, is_active, config,
  position, offset_x, offset_y, display_duration, notification_time_range
)
SELECT 
  '48bf66cb-8842-422f-a66f-a3a341a00ec1',
  'Customer Reviews',
  'notification',
  true,
  jsonb_build_object(
    'template_id', 'customer_reviews',
    'name', 'Customer Reviews',
    'triggers', jsonb_build_object(
      'events', jsonb_build_object('eventTypes', jsonb_build_array('review'))
    ),
    'rules', jsonb_build_object(
      'eventTypes', jsonb_build_array('review'),
      'timeWindowHours', 168,
      'excludeTestEvents', false
    )
  ),
  'bottom-left', 20, 20, 8, 168
WHERE NOT EXISTS (
  SELECT 1 FROM widgets 
  WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1' 
    AND config->>'template_id' = 'customer_reviews'
);

-- Verify all widgets are created and active
SELECT 
  id,
  name,
  is_active,
  config->>'template_id' as template_id,
  config->'triggers'->'events'->>'eventTypes' as event_types,
  notification_time_range
FROM widgets
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND is_active = true
ORDER BY created_at DESC;

-- Count active widgets
SELECT COUNT(*) as active_widget_count
FROM widgets
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND is_active = true;
