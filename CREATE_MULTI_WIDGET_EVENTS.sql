-- Create test events for MULTIPLE widget types to see randomization
-- Site ID: 48bf66cb-8842-422f-a66f-a3a341a00ec1

-- Create 3 PURCHASE events
INSERT INTO events (site_id, session_id, event_type, type, url, timestamp, metadata)
VALUES 
  ('48bf66cb-8842-422f-a66f-a3a341a00ec1', 'test-' || gen_random_uuid()::text, 'purchase', 'purchase',
   'https://example.com/checkout', NOW() - INTERVAL '3 minutes',
   jsonb_build_object('customer_name', 'Alice Smith', 'product_name', 'Pro Subscription', 'value', 299, 'currency', 'USD', 'location', 'San Francisco, US')),
   
  ('48bf66cb-8842-422f-a66f-a3a341a00ec1', 'test-' || gen_random_uuid()::text, 'purchase', 'purchase',
   'https://example.com/checkout', NOW() - INTERVAL '7 minutes',
   jsonb_build_object('customer_name', 'Bob Williams', 'product_name', 'Premium Plan', 'value', 99, 'currency', 'USD', 'location', 'Austin, US')),
   
  ('48bf66cb-8842-422f-a66f-a3a341a00ec1', 'test-' || gen_random_uuid()::text, 'purchase', 'purchase',
   'https://example.com/checkout', NOW() - INTERVAL '25 minutes',
   jsonb_build_object('customer_name', 'Carol Davis', 'product_name', 'Starter Pack', 'value', 49, 'currency', 'USD', 'location', 'Seattle, US'));

-- Create 3 SIGNUP events
INSERT INTO events (site_id, session_id, event_type, type, url, timestamp, metadata)
VALUES 
  ('48bf66cb-8842-422f-a66f-a3a341a00ec1', 'test-' || gen_random_uuid()::text, 'signup', 'signup',
   'https://example.com/register', NOW() - INTERVAL '2 minutes',
   jsonb_build_object('customer_name', 'David Lee', 'location', 'Boston, US')),
   
  ('48bf66cb-8842-422f-a66f-a3a341a00ec1', 'test-' || gen_random_uuid()::text, 'signup', 'signup',
   'https://example.com/register', NOW() - INTERVAL '12 minutes',
   jsonb_build_object('customer_name', 'Emma Wilson', 'location', 'Miami, US')),
   
  ('48bf66cb-8842-422f-a66f-a3a341a00ec1', 'test-' || gen_random_uuid()::text, 'signup', 'signup',
   'https://example.com/register', NOW() - INTERVAL '35 minutes',
   jsonb_build_object('customer_name', 'Frank Miller', 'location', 'Denver, US'));

-- Create 2 REVIEW events
INSERT INTO events (site_id, session_id, event_type, type, url, timestamp, metadata)
VALUES 
  ('48bf66cb-8842-422f-a66f-a3a341a00ec1', 'test-' || gen_random_uuid()::text, 'review', 'review',
   'https://example.com/reviews', NOW() - INTERVAL '15 minutes',
   jsonb_build_object('customer_name', 'Grace Taylor', 'rating', 5, 'review_text', 'Excellent service!', 'location', 'Portland, US')),
   
  ('48bf66cb-8842-422f-a66f-a3a341a00ec1', 'test-' || gen_random_uuid()::text, 'review', 'review',
   'https://example.com/reviews', NOW() - INTERVAL '40 minutes',
   jsonb_build_object('customer_name', 'Henry Brown', 'rating', 5, 'review_text', 'Amazing product!', 'location', 'Phoenix, US'));

-- Verify all event types were created
SELECT 
  event_type,
  COUNT(*) as count,
  MAX(timestamp) as latest,
  MIN(timestamp) as oldest
FROM events
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY event_type
ORDER BY latest DESC;

-- Show sample of each type
SELECT 
  event_type,
  metadata->>'customer_name' as customer,
  metadata->>'product_name' as product,
  CASE 
    WHEN event_type = 'purchase' THEN metadata->>'value'
    WHEN event_type = 'review' THEN metadata->>'rating'
    ELSE NULL
  END as value_or_rating,
  AGE(NOW(), timestamp) as time_ago
FROM events
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;
