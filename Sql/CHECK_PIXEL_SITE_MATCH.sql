-- Check if the pixel is using the correct site
-- Site ID: 48bf66cb-8842-422f-a66f-a3a341a00ec1

-- Step 1: Show your site and its public key
SELECT 
  '🔑 YOUR SITE INFO:' as info,
  id as site_id,
  name,
  domain,
  public_key,
  '👆 This public_key should match your pixel code!' as note
FROM sites
WHERE id = '48bf66cb-8842-422f-a66f-a3a341a00ec1';

-- Step 2: Show ALL sites and their widget counts
SELECT 
  '📊 ALL SITES & WIDGET COUNTS:' as info,
  s.id,
  s.name as site_name,
  s.public_key,
  COUNT(w.id) as total_widgets,
  COUNT(w.id) FILTER (WHERE w.is_active = true) as active_widgets
FROM sites s
LEFT JOIN widgets w ON s.id = w.site_id
GROUP BY s.id, s.name, s.public_key
ORDER BY active_widgets DESC;

-- Step 3: Show which site has multiple active widgets
SELECT 
  '🎯 SITES WITH 2+ ACTIVE WIDGETS:' as info,
  s.id,
  s.name,
  s.public_key,
  array_agg(w.name) as widget_names,
  array_agg(w.config->>'template_id') as widget_types
FROM sites s
JOIN widgets w ON s.id = w.site_id
WHERE w.is_active = true
GROUP BY s.id, s.name, s.public_key
HAVING COUNT(w.id) >= 2;

-- Step 4: Check if your 2 widgets are on the SAME site or DIFFERENT sites
SELECT 
  '⚠️ CHECKING WIDGET DISTRIBUTION:' as info,
  w.id,
  w.name as widget_name,
  w.site_id,
  s.name as site_name,
  s.public_key,
  w.is_active,
  w.config->>'template_id' as template
FROM widgets w
JOIN sites s ON w.site_id = s.id
WHERE w.is_active = true
ORDER BY w.site_id, w.created_at;

-- If you see widgets with DIFFERENT site_ids, that's the problem!
-- The pixel uses ONE public_key which maps to ONE site_id
-- So all widgets need to be on the SAME site
