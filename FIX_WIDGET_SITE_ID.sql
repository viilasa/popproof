-- Fix: Update cart activity widget to correct site_id if it's wrong
-- Site ID: 48bf66cb-8842-422f-a66f-a3a341a00ec1

-- Step 1: Show current widget configuration
SELECT 
  id,
  name,
  site_id,
  is_active,
  config->>'template_id' as template_id
FROM widgets
WHERE config->>'template_id' = 'cart_activity'
   OR name ILIKE '%cart%'
ORDER BY created_at DESC
LIMIT 5;

-- Step 2: If widget has wrong site_id, update it
-- (Uncomment and run the UPDATE below if needed)

/*
UPDATE widgets
SET site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
WHERE config->>'template_id' = 'cart_activity'
  AND site_id != '48bf66cb-8842-422f-a66f-a3a341a00ec1';
*/

-- Step 3: Verify after update
SELECT 
  id,
  name,
  site_id,
  is_active,
  config->>'template_id' as template_id
FROM widgets
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND is_active = true;
