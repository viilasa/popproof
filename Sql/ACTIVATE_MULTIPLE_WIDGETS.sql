-- Activate all your existing widgets
-- Site ID: 48bf66cb-8842-422f-a66f-a3a341a00ec1

-- Step 1: Check what widgets you have
SELECT 
  id,
  name,
  is_active,
  config->>'template_id' as template_id,
  created_at
FROM widgets
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
ORDER BY created_at DESC;

-- Step 2: Activate ALL widgets for your site
UPDATE widgets
SET is_active = true
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND is_active = false;

-- Step 3: Verify multiple widgets are now active
SELECT 
  id,
  name,
  is_active,
  config->>'template_id' as template_id
FROM widgets
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND is_active = true;
