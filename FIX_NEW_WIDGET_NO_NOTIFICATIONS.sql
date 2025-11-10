-- Diagnose and fix: New widget not fetching existing events from DB
-- Site ID: 48bf66cb-8842-422f-a66f-a3a341a00ec1

-- ===== STEP 1: DIAGNOSE THE PROBLEM =====

-- Check your current widgets and their event type configurations
SELECT 
  '🔍 CURRENT WIDGETS:' as section,
  id,
  name,
  is_active,
  config->>'template_id' as template_id,
  config->'triggers'->'events'->>'eventTypes' as trigger_event_types,
  config->'rules'->>'eventTypes' as rule_event_types,
  created_at
FROM widgets
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
ORDER BY created_at DESC;

-- Check if there are events in the database
SELECT 
  '📊 EVENTS IN DATABASE:' as section,
  event_type,
  COUNT(*) as count,
  MAX(timestamp) as latest_event,
  MIN(timestamp) as oldest_event
FROM events
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND timestamp > NOW() - INTERVAL '7 days'
GROUP BY event_type
ORDER BY count DESC;

-- Check which widget configs are MISSING event types
SELECT 
  '❌ BROKEN WIDGETS (missing event types):' as section,
  id,
  name,
  config->>'template_id' as template_id,
  CASE 
    WHEN config->'triggers'->'events'->>'eventTypes' IS NULL 
     AND config->'rules'->>'eventTypes' IS NULL 
    THEN '❌ NO EVENT TYPES CONFIGURED!'
    ELSE '✅ Has event types'
  END as status
FROM widgets
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND is_active = true
  AND (
    config->'triggers'->'events'->>'eventTypes' IS NULL 
    OR config->'rules'->>'eventTypes' IS NULL
  );

-- ===== STEP 2: FIX ALL WIDGETS =====

-- Fix Customer Reviews widget (template_id might be NULL or wrong)
UPDATE widgets
SET config = jsonb_set(
  jsonb_set(
    jsonb_set(
      COALESCE(config, '{}'::jsonb),
      '{template_id}',
      '"customer_reviews"'
    ),
    '{triggers,events,eventTypes}',
    '["review"]'::jsonb
  ),
  '{rules,eventTypes}',
  '["review"]'::jsonb
),
notification_time_range = 168  -- 7 days
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND (name ILIKE '%review%' OR config->>'template_id' = 'customer_reviews')
  AND is_active = true;

-- Fix Cart Activity widget
UPDATE widgets
SET config = jsonb_set(
  jsonb_set(
    jsonb_set(
      COALESCE(config, '{}'::jsonb),
      '{template_id}',
      '"cart_activity"'
    ),
    '{triggers,events,eventTypes}',
    '["add_to_cart"]'::jsonb
  ),
  '{rules,eventTypes}',
  '["add_to_cart"]'::jsonb
),
notification_time_range = 168  -- 7 days
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND (name ILIKE '%cart%' OR config->>'template_id' = 'cart_activity')
  AND is_active = true;

-- Fix Recent Purchases widget (if you have one)
UPDATE widgets
SET config = jsonb_set(
  jsonb_set(
    jsonb_set(
      COALESCE(config, '{}'::jsonb),
      '{template_id}',
      '"recent_purchases"'
    ),
    '{triggers,events,eventTypes}',
    '["purchase"]'::jsonb
  ),
  '{rules,eventTypes}',
  '["purchase"]'::jsonb
),
notification_time_range = 168  -- 7 days
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND (name ILIKE '%purchase%' OR config->>'template_id' = 'recent_purchases')
  AND is_active = true;

-- Fix Recent Signups widget (if you have one)
UPDATE widgets
SET config = jsonb_set(
  jsonb_set(
    jsonb_set(
      COALESCE(config, '{}'::jsonb),
      '{template_id}',
      '"recent_signups"'
    ),
    '{triggers,events,eventTypes}',
    '["signup"]'::jsonb
  ),
  '{rules,eventTypes}',
  '["signup"]'::jsonb
),
notification_time_range = 168  -- 7 days
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND (name ILIKE '%signup%' OR config->>'template_id' = 'recent_signups')
  AND is_active = true;

-- ===== STEP 3: VERIFY THE FIX =====

-- Check all widgets now have proper event types
SELECT 
  '✅ AFTER FIX:' as section,
  name,
  config->>'template_id' as template_id,
  config->'triggers'->'events'->>'eventTypes' as trigger_event_types,
  config->'rules'->>'eventTypes' as rule_event_types,
  notification_time_range as time_range_hours,
  is_active
FROM widgets
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND is_active = true
ORDER BY created_at DESC;

-- Test query: Simulate what the Edge Function will do
-- This shows you exactly what events each widget will fetch
DO $$
DECLARE
  widget_record RECORD;
  event_types TEXT[];
  event_count INTEGER;
BEGIN
  FOR widget_record IN 
    SELECT 
      id,
      name,
      config->'triggers'->'events'->>'eventTypes' as event_types_json
    FROM widgets
    WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
      AND is_active = true
  LOOP
    -- Parse event types
    SELECT ARRAY(
      SELECT jsonb_array_elements_text(
        (widget_record.event_types_json)::jsonb
      )
    ) INTO event_types;
    
    -- Count matching events
    SELECT COUNT(*) INTO event_count
    FROM events
    WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
      AND event_type = ANY(event_types)
      AND timestamp > NOW() - INTERVAL '7 days';
    
    RAISE NOTICE 'Widget: % - Event Types: % - Matching Events: %', 
      widget_record.name, 
      event_types, 
      event_count;
  END LOOP;
END $$;

-- Final summary
SELECT 
  '📊 FINAL SUMMARY:' as section,
  w.name as widget_name,
  w.config->'triggers'->'events'->>'eventTypes' as looks_for_events,
  COUNT(e.id) as matching_events_in_db
FROM widgets w
LEFT JOIN events e ON 
  e.site_id = w.site_id 
  AND e.event_type = ANY(
    SELECT jsonb_array_elements_text(
      (w.config->'triggers'->'events'->>'eventTypes')::jsonb
    )
  )
  AND e.timestamp > NOW() - INTERVAL '7 days'
WHERE w.site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND w.is_active = true
GROUP BY w.name, w.config->'triggers'->'events'->>'eventTypes'
ORDER BY matching_events_in_db DESC;

-- Expected result:
-- Each active widget should show the event types it looks for
-- and the count of matching events in the database
-- If count is 0 but events exist, there's still a mismatch!
