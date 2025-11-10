-- Activate the cart activity widget if it exists
-- Site ID: 48bf66cb-8842-422f-a66f-a3a341a00ec1

-- Step 1: Check current status
SELECT 
  id,
  name,
  is_active,
  config->>'template_id' as template_id
FROM widgets
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND (
    config->>'template_id' = 'cart_activity'
    OR name ILIKE '%cart%'
  );

-- Step 2: Activate ALL widgets for this site (if they exist)
UPDATE widgets
SET is_active = true
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1';

-- Step 3: Verify activation
SELECT 
  id,
  name,
  is_active,
  config->>'template_id' as template_id
FROM widgets
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
ORDER BY created_at DESC;

-- Step 4: Check if we have matching events
SELECT 
  COUNT(*) as matching_events,
  MAX(timestamp) as latest_event
FROM events
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND event_type = 'add_to_cart'
  AND timestamp > NOW() - INTERVAL '2 hours';
