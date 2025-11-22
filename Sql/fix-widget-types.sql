-- Fix Widget Types to 'notification'
-- Run this in Supabase SQL Editor

-- Update all widgets for your site to use 'notification' type
UPDATE widgets
SET type = 'notification'::widget_type
WHERE site_id = '1808e26c-e195-4fcf-8eb1-95a4be718b39';

-- Verify the update
SELECT 
  id,
  name,
  type,
  is_active,
  site_id
FROM widgets
WHERE site_id = '1808e26c-e195-4fcf-8eb1-95a4be718b39';

-- Expected: All widgets should now have type = 'notification'
