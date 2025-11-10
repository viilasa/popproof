-- Create review events for Customer Reviews widget
-- Site ID: 48bf66cb-8842-422f-a66f-a3a341a00ec1

-- Create 5 review events with different timestamps
INSERT INTO events (site_id, session_id, event_type, type, url, timestamp, metadata)
VALUES 
  -- Review 1: 4 minutes ago
  ('48bf66cb-8842-422f-a66f-a3a341a00ec1', 
   'review-' || gen_random_uuid()::text,
   'review',
   'review',
   'https://example.com/reviews',
   NOW() - INTERVAL '4 minutes',
   jsonb_build_object(
     'customer_name', 'Sarah Thompson',
     'rating', 5,
     'review_text', 'Absolutely amazing product! Highly recommend!',
     'product_name', 'Premium Plan',
     'location', 'New York, US'
   )),

  -- Review 2: 9 minutes ago
  ('48bf66cb-8842-422f-a66f-a3a341a00ec1',
   'review-' || gen_random_uuid()::text,
   'review',
   'review',
   'https://example.com/reviews',
   NOW() - INTERVAL '9 minutes',
   jsonb_build_object(
     'customer_name', 'Michael Chen',
     'rating', 5,
     'review_text', 'Best purchase I made this year!',
     'product_name', 'Pro Subscription',
     'location', 'San Francisco, US'
   )),

  -- Review 3: 17 minutes ago
  ('48bf66cb-8842-422f-a66f-a3a341a00ec1',
   'review-' || gen_random_uuid()::text,
   'review',
   'review',
   'https://example.com/reviews',
   NOW() - INTERVAL '17 minutes',
   jsonb_build_object(
     'customer_name', 'Jessica Martinez',
     'rating', 5,
     'review_text', 'Excellent service and quality!',
     'product_name', 'Starter Pack',
     'location', 'Los Angeles, US'
   )),

  -- Review 4: 28 minutes ago
  ('48bf66cb-8842-422f-a66f-a3a341a00ec1',
   'review-' || gen_random_uuid()::text,
   'review',
   'review',
   'https://example.com/reviews',
   NOW() - INTERVAL '28 minutes',
   jsonb_build_object(
     'customer_name', 'David Park',
     'rating', 5,
     'review_text', 'Worth every penny!',
     'product_name', 'Enterprise Plan',
     'location', 'Chicago, US'
   )),

  -- Review 5: 45 minutes ago
  ('48bf66cb-8842-422f-a66f-a3a341a00ec1',
   'review-' || gen_random_uuid()::text,
   'review',
   'review',
   'https://example.com/reviews',
   NOW() - INTERVAL '45 minutes',
   jsonb_build_object(
     'customer_name', 'Emma Wilson',
     'rating', 5,
     'review_text', 'Game changer for my business!',
     'product_name', 'Premium Plan',
     'location', 'Seattle, US'
   ));

-- Verify events were created
SELECT 
  '✅ REVIEW EVENTS CREATED:' as status,
  COUNT(*) as total_reviews
FROM events
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND event_type = 'review'
  AND timestamp > NOW() - INTERVAL '1 hour';

-- Show the events
SELECT 
  id,
  event_type,
  metadata->>'customer_name' as customer,
  metadata->>'rating' as rating,
  metadata->>'product_name' as product,
  AGE(NOW(), timestamp) as time_ago
FROM events
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND event_type = 'review'
  AND timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;

-- Check both event types now exist
SELECT 
  '📊 EVENT TYPE SUMMARY:' as info,
  event_type,
  COUNT(*) as count,
  MAX(timestamp) as latest_event
FROM events
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY event_type;
