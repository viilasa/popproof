-- QUICK FIX: New widget not fetching existing events
-- Site ID: 48bf66cb-8842-422f-a66f-a3a341a00ec1

-- THE PROBLEM:
-- When you create a new widget through the UI, sometimes the config
-- doesn't get set properly (template_id and eventTypes are NULL).
-- Without these, the Edge Function doesn't know what events to fetch!

-- THE SOLUTION:
-- Set the proper template_id and eventTypes for each widget type

-- ===== FIX CUSTOMER REVIEWS WIDGET =====
UPDATE widgets
SET 
  config = jsonb_build_object(
    'template_id', 'customer_reviews',
    'name', 'Customer Reviews',
    'triggers', jsonb_build_object(
      'events', jsonb_build_object(
        'eventTypes', jsonb_build_array('review')
      )
    ),
    'rules', jsonb_build_object(
      'eventTypes', jsonb_build_array('review'),
      'timeWindowHours', 168,
      'excludeTestEvents', false
    )
  ),
  notification_time_range = 168
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND name ILIKE '%review%'
  AND is_active = true;

-- ===== FIX CART ACTIVITY WIDGET =====
UPDATE widgets
SET 
  config = jsonb_build_object(
    'template_id', 'cart_activity',
    'name', 'Cart Activity',
    'triggers', jsonb_build_object(
      'events', jsonb_build_object(
        'eventTypes', jsonb_build_array('add_to_cart')
      )
    ),
    'rules', jsonb_build_object(
      'eventTypes', jsonb_build_array('add_to_cart'),
      'timeWindowHours', 168,
      'excludeTestEvents', false
    )
  ),
  notification_time_range = 168
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND name ILIKE '%cart%'
  AND is_active = true;

-- ===== VERIFY IT WORKED =====
SELECT 
  name,
  config->>'template_id' as template,
  config->'triggers'->'events'->>'eventTypes' as event_types,
  '✅ Should see event types above!' as note
FROM widgets
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND is_active = true;

-- Count events that match
SELECT 
  w.name as widget,
  COUNT(e.id) as matching_events
FROM widgets w
LEFT JOIN events e ON 
  e.site_id = w.site_id 
  AND (
    (w.name ILIKE '%review%' AND e.event_type = 'review')
    OR (w.name ILIKE '%cart%' AND e.event_type = 'add_to_cart')
  )
  AND e.timestamp > NOW() - INTERVAL '7 days'
WHERE w.site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND w.is_active = true
GROUP BY w.name;

-- If you see matching_events > 0, you're good!
-- If 0, check that events exist with the correct event_type
