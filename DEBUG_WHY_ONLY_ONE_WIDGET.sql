-- Debug: Why is the Edge Function only returning 1 widget?
-- Site ID: 48bf66cb-8842-422f-a66f-a3a341a00ec1

-- Step 1: Show ALL widgets for your site (active or not)
SELECT 
  '📋 ALL WIDGETS FOR YOUR SITE:' as info,
  id,
  name,
  is_active,
  site_id,
  config->>'template_id' as template_id,
  config->'triggers'->'events'->>'eventTypes' as event_types,
  created_at
FROM widgets
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
ORDER BY created_at DESC;

-- Step 2: Show ONLY active widgets (what the Edge Function queries)
SELECT 
  '✅ ACTIVE WIDGETS (what Edge Function sees):' as info,
  COUNT(*) as count
FROM widgets
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND is_active = true;

SELECT 
  id,
  name,
  is_active,
  config->>'template_id' as template_id,
  config->'triggers'->'events'->>'eventTypes' as event_types
FROM widgets
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND is_active = true;

-- Step 3: Check if widgets have DIFFERENT site_ids
SELECT 
  '🔍 CHECKING FOR SITE_ID MISMATCHES:' as info,
  id,
  name,
  site_id,
  is_active,
  CASE 
    WHEN site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1' THEN '✅ CORRECT'
    ELSE '❌ WRONG SITE! This is the problem!'
  END as site_check
FROM widgets
WHERE is_active = true
ORDER BY created_at DESC;

-- Step 4: Check if both widgets have proper event type configuration
SELECT 
  '⚙️ WIDGET CONFIGURATIONS:' as info,
  name,
  config->>'template_id' as template,
  config->'triggers'->'events'->>'eventTypes' as event_types_triggers,
  config->'rules'->>'eventTypes' as event_types_rules,
  CASE 
    WHEN config->'triggers'->'events'->>'eventTypes' IS NULL 
     AND config->'rules'->>'eventTypes' IS NULL 
    THEN '❌ NO EVENT TYPES - This widget won''t work!'
    ELSE '✅ Has event types'
  END as event_check
FROM widgets
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND is_active = true;

-- Step 5: Show what the Edge Function URL would query
-- (This simulates what happens when the pixel calls the API)
SELECT 
  '🌐 EDGE FUNCTION QUERY SIMULATION:' as info;
  
SELECT 
  w.id,
  w.name,
  w.is_active,
  w.site_id,
  w.config->>'template_id' as template_id
FROM widgets w
WHERE w.site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND w.is_active = true;
