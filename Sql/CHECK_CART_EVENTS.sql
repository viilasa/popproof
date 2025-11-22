-- Run this in Supabase SQL Editor to check for cart activity events

-- Check if you have any add_to_cart events
SELECT 
  id,
  site_id,
  event_type,
  type,
  timestamp,
  metadata
FROM events
WHERE event_type = 'add_to_cart'
ORDER BY timestamp DESC
LIMIT 10;

-- Also check the 'type' column in case events were logged there
SELECT 
  id,
  site_id,
  event_type,
  type,
  timestamp,
  metadata
FROM events
WHERE type = 'add_to_cart'
ORDER BY timestamp DESC
LIMIT 10;

-- Check all event types for your site
SELECT 
  event_type,
  COUNT(*) as count
FROM events
GROUP BY event_type
ORDER BY count DESC;

-- Check if cart activity widget exists and is active
SELECT 
  id,
  name,
  is_active,
  site_id,
  config->'template_id' as template_id,
  config->'rules'->'eventTypes' as event_types
FROM widgets
WHERE config->>'template_id' = 'cart_activity'
   OR name ILIKE '%cart%';
