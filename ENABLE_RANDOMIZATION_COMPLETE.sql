-- COMPLETE SETUP: Enable multi-widget randomization
-- Site ID: 48bf66cb-8842-422f-a66f-a3a341a00ec1
-- Run this entire file to set up randomization!

-- ===== STEP 1: Create multiple widget types =====

-- Cart Activity (if not exists)
INSERT INTO widgets (site_id, name, type, is_active, config, position, offset_x, offset_y, display_duration, notification_time_range)
SELECT '48bf66cb-8842-422f-a66f-a3a341a00ec1', 'Cart Activity', 'notification', true,
  jsonb_build_object('template_id', 'cart_activity', 'name', 'Cart Activity',
    'triggers', jsonb_build_object('events', jsonb_build_object('eventTypes', jsonb_build_array('add_to_cart'))),
    'rules', jsonb_build_object('eventTypes', jsonb_build_array('add_to_cart'), 'timeWindowHours', 168, 'excludeTestEvents', false)),
  'bottom-left', 20, 20, 8, 168
WHERE NOT EXISTS (SELECT 1 FROM widgets WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1' AND config->>'template_id' = 'cart_activity');

-- Recent Purchases
INSERT INTO widgets (site_id, name, type, is_active, config, position, offset_x, offset_y, display_duration, notification_time_range)
SELECT '48bf66cb-8842-422f-a66f-a3a341a00ec1', 'Recent Purchases', 'notification', true,
  jsonb_build_object('template_id', 'recent_purchases', 'name', 'Recent Purchases',
    'triggers', jsonb_build_object('events', jsonb_build_object('eventTypes', jsonb_build_array('purchase'))),
    'rules', jsonb_build_object('eventTypes', jsonb_build_array('purchase'), 'timeWindowHours', 168, 'excludeTestEvents', false)),
  'bottom-left', 20, 20, 8, 168
WHERE NOT EXISTS (SELECT 1 FROM widgets WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1' AND config->>'template_id' = 'recent_purchases');

-- Recent Signups
INSERT INTO widgets (site_id, name, type, is_active, config, position, offset_x, offset_y, display_duration, notification_time_range)
SELECT '48bf66cb-8842-422f-a66f-a3a341a00ec1', 'Recent Signups', 'notification', true,
  jsonb_build_object('template_id', 'recent_signups', 'name', 'Recent Signups',
    'triggers', jsonb_build_object('events', jsonb_build_object('eventTypes', jsonb_build_array('signup'))),
    'rules', jsonb_build_object('eventTypes', jsonb_build_array('signup'), 'timeWindowHours', 168, 'excludeTestEvents', false)),
  'bottom-left', 20, 20, 8, 168
WHERE NOT EXISTS (SELECT 1 FROM widgets WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1' AND config->>'template_id' = 'recent_signups');

-- Customer Reviews
INSERT INTO widgets (site_id, name, type, is_active, config, position, offset_x, offset_y, display_duration, notification_time_range)
SELECT '48bf66cb-8842-422f-a66f-a3a341a00ec1', 'Customer Reviews', 'notification', true,
  jsonb_build_object('template_id', 'customer_reviews', 'name', 'Customer Reviews',
    'triggers', jsonb_build_object('events', jsonb_build_object('eventTypes', jsonb_build_array('review'))),
    'rules', jsonb_build_object('eventTypes', jsonb_build_array('review'), 'timeWindowHours', 168, 'excludeTestEvents', false)),
  'bottom-left', 20, 20, 8, 168
WHERE NOT EXISTS (SELECT 1 FROM widgets WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1' AND config->>'template_id' = 'customer_reviews');

-- ===== STEP 2: Create test events for each widget type =====

-- Purchases
INSERT INTO events (site_id, session_id, event_type, type, url, timestamp, metadata) VALUES
  ('48bf66cb-8842-422f-a66f-a3a341a00ec1', 'test-' || gen_random_uuid()::text, 'purchase', 'purchase', 'https://example.com/checkout', NOW() - INTERVAL '3 minutes',
   jsonb_build_object('customer_name', 'Alice Smith', 'product_name', 'Pro Subscription', 'value', 299, 'currency', 'USD', 'location', 'San Francisco, US')),
  ('48bf66cb-8842-422f-a66f-a3a341a00ec1', 'test-' || gen_random_uuid()::text, 'purchase', 'purchase', 'https://example.com/checkout', NOW() - INTERVAL '11 minutes',
   jsonb_build_object('customer_name', 'Bob Williams', 'product_name', 'Premium Plan', 'value', 99, 'currency', 'USD', 'location', 'Austin, US'));

-- Signups
INSERT INTO events (site_id, session_id, event_type, type, url, timestamp, metadata) VALUES
  ('48bf66cb-8842-422f-a66f-a3a341a00ec1', 'test-' || gen_random_uuid()::text, 'signup', 'signup', 'https://example.com/register', NOW() - INTERVAL '2 minutes',
   jsonb_build_object('customer_name', 'David Lee', 'location', 'Boston, US')),
  ('48bf66cb-8842-422f-a66f-a3a341a00ec1', 'test-' || gen_random_uuid()::text, 'signup', 'signup', 'https://example.com/register', NOW() - INTERVAL '8 minutes',
   jsonb_build_object('customer_name', 'Emma Wilson', 'location', 'Miami, US'));

-- Reviews
INSERT INTO events (site_id, session_id, event_type, type, url, timestamp, metadata) VALUES
  ('48bf66cb-8842-422f-a66f-a3a341a00ec1', 'test-' || gen_random_uuid()::text, 'review', 'review', 'https://example.com/reviews', NOW() - INTERVAL '6 minutes',
   jsonb_build_object('customer_name', 'Grace Taylor', 'rating', 5, 'review_text', 'Excellent!', 'location', 'Portland, US')),
  ('48bf66cb-8842-422f-a66f-a3a341a00ec1', 'test-' || gen_random_uuid()::text, 'review', 'review', 'https://example.com/reviews', NOW() - INTERVAL '15 minutes',
   jsonb_build_object('customer_name', 'Henry Brown', 'rating', 5, 'review_text', 'Amazing!', 'location', 'Phoenix, US'));

-- ===== VERIFICATION =====

-- Show active widgets
SELECT 
  '✅ WIDGETS:' as section,
  COUNT(*) as active_count
FROM widgets
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1' AND is_active = true;

SELECT 
  name,
  config->>'template_id' as type,
  config->'triggers'->'events'->>'eventTypes' as event_types,
  is_active
FROM widgets
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1' AND is_active = true;

-- Show events by type
SELECT 
  '✅ EVENTS:' as section,
  event_type,
  COUNT(*) as count,
  MAX(timestamp) as latest
FROM events
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY event_type;

-- Expected result:
-- You should see:
-- - 4 active widgets (Cart, Purchase, Signup, Review)
-- - Events for each type created
-- - Hard refresh website to see randomization!
