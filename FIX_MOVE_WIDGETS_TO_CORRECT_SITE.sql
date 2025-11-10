-- Fix: Move all active widgets to the correct site
-- This is the most common issue when widgets don't show up together!

-- Step 1: Find out which site your pixel is using
-- (This shows which site the Edge Function queries)
SELECT 
  '🎯 CURRENT SITUATION:' as info,
  s.id as site_id,
  s.name as site_name,
  s.public_key,
  COUNT(w.id) as active_widgets_on_this_site
FROM sites s
LEFT JOIN widgets w ON s.id = w.site_id AND w.is_active = true
GROUP BY s.id, s.name, s.public_key
ORDER BY active_widgets_on_this_site DESC;

-- Step 2: Show all active widgets and their current sites
SELECT 
  '📋 ALL ACTIVE WIDGETS:' as info,
  w.id,
  w.name,
  w.site_id,
  s.name as site_name,
  w.config->>'template_id' as type
FROM widgets w
JOIN sites s ON w.site_id = s.id
WHERE w.is_active = true;

-- Step 3: MOVE all active widgets to site: 48bf66cb-8842-422f-a66f-a3a341a00ec1
-- (Uncomment to run)

/*
UPDATE widgets
SET site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
WHERE is_active = true
  AND site_id != '48bf66cb-8842-422f-a66f-a3a341a00ec1';
*/

-- Step 4: Verify all widgets are now on the same site
SELECT 
  '✅ AFTER FIX - All widgets on correct site:' as info,
  id,
  name,
  site_id,
  is_active,
  config->>'template_id' as type
FROM widgets
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND is_active = true;

-- Final count
SELECT 
  '📊 FINAL COUNT:' as info,
  COUNT(*) as active_widgets_on_correct_site
FROM widgets
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND is_active = true;

-- Expected result: Should show 2+ widgets all on the same site!
