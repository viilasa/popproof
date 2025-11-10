-- This version automatically uses your first site
-- No need to replace anything - just run it!

WITH target_site AS (
  SELECT id FROM sites ORDER BY created_at DESC LIMIT 1
)
INSERT INTO events (
  site_id,
  session_id,
  event_type,
  type,
  url,
  timestamp,
  metadata
)
SELECT
  target_site.id,
  'test-session-' || gen_random_uuid()::text,
  'add_to_cart',
  'add_to_cart',
  'https://example.com/product/premium-plan',
  NOW() - INTERVAL '5 minutes',
  jsonb_build_object(
    'customer_name', 'John Doe',
    'product_name', 'Premium Plan',
    'product_id', 'premium-123',
    'quantity', 1,
    'price', 99.00,
    'currency', 'USD',
    'location', 'New York, US'
  )
FROM target_site
RETURNING id, site_id, event_type, metadata->>'customer_name' as customer, metadata->>'product_name' as product;

-- Create another one from 10 minutes ago
WITH target_site AS (
  SELECT id FROM sites ORDER BY created_at DESC LIMIT 1
)
INSERT INTO events (
  site_id,
  session_id,
  event_type,
  type,
  url,
  timestamp,
  metadata
)
SELECT
  target_site.id,
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
FROM target_site
RETURNING id, site_id, event_type, metadata->>'customer_name' as customer, metadata->>'product_name' as product;

-- Create one from 1 hour ago
WITH target_site AS (
  SELECT id FROM sites ORDER BY created_at DESC LIMIT 1
)
INSERT INTO events (
  site_id,
  session_id,
  event_type,
  type,
  url,
  timestamp,
  metadata
)
SELECT
  target_site.id,
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
FROM target_site
RETURNING id, site_id, event_type, metadata->>'customer_name' as customer, metadata->>'product_name' as product;

-- Verify the events were created
SELECT 
  e.id,
  e.site_id,
  s.name as site_name,
  e.event_type,
  e.timestamp,
  metadata->>'customer_name' as customer,
  metadata->>'product_name' as product,
  metadata->>'location' as location
FROM events e
JOIN sites s ON e.site_id = s.id
WHERE e.event_type = 'add_to_cart'
  AND e.timestamp > NOW() - INTERVAL '2 hours'
ORDER BY e.timestamp DESC;
