-- COMPLETE FIX: Enable randomization for your 2 widgets
-- Site ID: 48bf66cb-8842-422f-a66f-a3a341a00ec1
-- Run this entire file!

-- ===== STEP 1: Fix Cart Activity widget config =====
UPDATE widgets
SET config = jsonb_set(
  jsonb_set(
    jsonb_set(
      COALESCE(config, '{}'::jsonb),
      '{template_id}',
      '"cart_activity"'
    ),
    '{triggers,events,eventTypes}',
    '["add_to_cart"]'::jsonb
  ),
  '{rules,eventTypes}',
  '["add_to_cart"]'::jsonb
)
WHERE id = '432a9a16-3b5c-4278-8349-ff0dd5011327';

-- ===== STEP 2: Fix Customer Reviews widget config =====
UPDATE widgets
SET config = jsonb_set(
  jsonb_set(
    jsonb_set(
      COALESCE(config, '{}'::jsonb),
      '{template_id}',
      '"customer_reviews"'
    ),
    '{triggers,events,eventTypes}',
    '["review"]'::jsonb
  ),
  '{rules,eventTypes}',
  '["review"]'::jsonb
)
WHERE id = '9438f690-ec10-4095-8bbf-2abb7174b766';

-- ===== STEP 3: Create review events =====
INSERT INTO events (site_id, session_id, event_type, type, url, timestamp, metadata)
VALUES 
  ('48bf66cb-8842-422f-a66f-a3a341a00ec1', 'review-' || gen_random_uuid()::text, 'review', 'review', 'https://example.com/reviews', NOW() - INTERVAL '4 minutes',
   jsonb_build_object('customer_name', 'Sarah Thompson', 'rating', 5, 'review_text', 'Absolutely amazing!', 'product_name', 'Premium Plan', 'location', 'New York, US')),
   
  ('48bf66cb-8842-422f-a66f-a3a341a00ec1', 'review-' || gen_random_uuid()::text, 'review', 'review', 'https://example.com/reviews', NOW() - INTERVAL '9 minutes',
   jsonb_build_object('customer_name', 'Michael Chen', 'rating', 5, 'review_text', 'Best purchase ever!', 'product_name', 'Pro Subscription', 'location', 'San Francisco, US')),
   
  ('48bf66cb-8842-422f-a66f-a3a341a00ec1', 'review-' || gen_random_uuid()::text, 'review', 'review', 'https://example.com/reviews', NOW() - INTERVAL '17 minutes',
   jsonb_build_object('customer_name', 'Jessica Martinez', 'rating', 5, 'review_text', 'Excellent service!', 'product_name', 'Starter Pack', 'location', 'Los Angeles, US')),
   
  ('48bf66cb-8842-422f-a66f-a3a341a00ec1', 'review-' || gen_random_uuid()::text, 'review', 'review', 'https://example.com/reviews', NOW() - INTERVAL '28 minutes',
   jsonb_build_object('customer_name', 'David Park', 'rating', 5, 'review_text', 'Worth every penny!', 'product_name', 'Enterprise', 'location', 'Chicago, US')),
   
  ('48bf66cb-8842-422f-a66f-a3a341a00ec1', 'review-' || gen_random_uuid()::text, 'review', 'review', 'https://example.com/reviews', NOW() - INTERVAL '45 minutes',
   jsonb_build_object('customer_name', 'Emma Wilson', 'rating', 5, 'review_text', 'Game changer!', 'product_name', 'Premium Plan', 'location', 'Seattle, US'));

-- ===== VERIFICATION =====

-- 1. Check widget configs are fixed
SELECT 
  '✅ WIDGET CONFIGS:' as section,
  name,
  config->>'template_id' as template_id,
  config->'triggers'->'events'->>'eventTypes' as event_types,
  is_active
FROM widgets
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND is_active = true;

-- 2. Check events exist for both types
SELECT 
  '✅ EVENTS BY TYPE:' as section,
  event_type,
  COUNT(*) as count,
  MAX(timestamp) as latest
FROM events
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY event_type;

-- 3. Show expected randomization mix
SELECT 
  '🎲 EXPECTED MIX:' as section,
  event_type,
  metadata->>'customer_name' as customer,
  CASE 
    WHEN event_type = 'add_to_cart' THEN metadata->>'product_name'
    WHEN event_type = 'review' THEN metadata->>'product_name'
  END as product,
  AGE(NOW(), timestamp) as time_ago
FROM events
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND timestamp > NOW() - INTERVAL '1 hour'
  AND event_type IN ('add_to_cart', 'review')
ORDER BY timestamp DESC
LIMIT 20;

-- Expected result:
-- ✅ 2 active widgets with proper template_ids
-- ✅ Cart events (add_to_cart)
-- ✅ Review events (review)
-- ✅ Hard refresh website to see randomization!
-- You should now see: Cart → Review → Cart → Review → Cart... (mixed!)
