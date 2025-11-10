-- Run this in Supabase SQL Editor to create a test cart activity event
-- Replace 'YOUR_SITE_ID' with your actual site ID

INSERT INTO events (
  site_id,
  session_id,
  event_type,
  type,
  url,
  timestamp,
  metadata
) VALUES (
  'YOUR_SITE_ID', -- Replace with your site ID
  'test-session-' || gen_random_uuid()::text,
  'add_to_cart',
  'add_to_cart',
  'https://example.com/product/premium-plan',
  NOW() - INTERVAL '5 minutes', -- Event from 5 minutes ago
  jsonb_build_object(
    'customer_name', 'John Doe',
    'product_name', 'Premium Plan',
    'product_id', 'premium-123',
    'quantity', 1,
    'price', 99.00,
    'currency', 'USD',
    'location', 'New York, US'
  )
);

-- Create another one from 10 minutes ago
INSERT INTO events (
  site_id,
  session_id,
  event_type,
  type,
  url,
  timestamp,
  metadata
) VALUES (
  'YOUR_SITE_ID', -- Replace with your site ID
  'test-session-' || gen_random_uuid()::text,
  'add_to_cart',
  'add_to_cart',
  'https://example.com/product/starter-plan',
  NOW() - INTERVAL '10 minutes',
  jsonb_build_object(
    'customer_name', 'Sarah Smith',
    'product_name', 'Starter Plan',
    'product_id', 'starter-456',
    'quantity', 1,
    'price', 49.00,
    'currency', 'USD',
    'location', 'Los Angeles, US'
  )
);

-- Create one from 1 hour ago
INSERT INTO events (
  site_id,
  session_id,
  event_type,
  type,
  url,
  timestamp,
  metadata
) VALUES (
  'YOUR_SITE_ID', -- Replace with your site ID
  'test-session-' || gen_random_uuid()::text,
  'add_to_cart',
  'add_to_cart',
  'https://example.com/product/enterprise-plan',
  NOW() - INTERVAL '1 hour',
  jsonb_build_object(
    'customer_name', 'Mike Johnson',
    'product_name', 'Enterprise Plan',
    'product_id', 'enterprise-789',
    'quantity', 1,
    'price', 299.00,
    'currency', 'USD',
    'location', 'Chicago, US'
  )
);

-- Verify the events were created
SELECT 
  id,
  event_type,
  timestamp,
  metadata->>'customer_name' as customer,
  metadata->>'product_name' as product,
  metadata->>'location' as location
FROM events
WHERE event_type = 'add_to_cart'
  AND site_id = 'YOUR_SITE_ID'
ORDER BY timestamp DESC;
