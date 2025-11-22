-- Run this first to get your site ID
SELECT 
  id as site_id,
  name as site_name,
  domain,
  created_at
FROM sites
ORDER BY created_at DESC;
