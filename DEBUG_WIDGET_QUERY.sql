-- Run this in Supabase SQL Editor to debug your widget issue
-- This will show EXACTLY what's wrong

-- 1. Check if widget exists and its config
SELECT 
  id,
  name,
  type,
  is_active,
  site_id,
  created_at,
  config->>'template_id' as template_id,
  config->'rules'->'eventTypes' as event_types_in_config,
  config
FROM widgets 
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
ORDER BY created_at DESC;

-- 2. Check recent review events
SELECT 
  id,
  event_type,
  type,
  site_id,
  timestamp,
  metadata->'customer_name' as customer_name,
  metadata->'rating' as rating,
  metadata->'review_content' as review_content,
  metadata
FROM events 
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND (event_type = 'review' OR type = 'review')
ORDER BY timestamp DESC
LIMIT 10;

-- 3. Check notification_rules table
SELECT 
  id,
  widget_id,
  event_types,
  is_active,
  priority
FROM notification_rules
WHERE widget_id IN (
  SELECT id FROM widgets WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
);
