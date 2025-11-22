-- Complete diagnostic for notification issues
-- Run this to check everything needed for notifications to work

-- 1. Check if you have any sites
SELECT 'SITES' as check_type, COUNT(*) as count FROM sites;

-- 2. Check active widgets and their settings
SELECT 
  'ACTIVE WIDGETS' as check_type,
  w.id,
  w.name,
  w.is_active,
  w.hide_on_mobile,
  w.hide_on_desktop,
  w.mobile_position,
  w.position,
  s.public_key as client_id
FROM widgets w
LEFT JOIN sites s ON w.site_id = s.id
WHERE w.is_active = true;

-- 3. Check recent events (last 24 hours)
SELECT 
  'RECENT EVENTS' as check_type,
  COUNT(*) as total_events,
  MIN(timestamp) as oldest_event,
  MAX(timestamp) as newest_event
FROM events
WHERE timestamp > NOW() - INTERVAL '24 hours';

-- 4. Check events by type
SELECT 
  'EVENTS BY TYPE' as check_type,
  event_type,
  COUNT(*) as count
FROM events
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY event_type
ORDER BY count DESC;

-- 5. Check if events match active widgets
SELECT 
  'EVENT-WIDGET MATCH' as check_type,
  w.name as widget_name,
  w.config->>'template_id' as template,
  COUNT(e.id) as matching_events
FROM widgets w
LEFT JOIN sites s ON w.site_id = s.id
LEFT JOIN events e ON e.client_id = s.public_key
  AND e.timestamp > NOW() - INTERVAL '24 hours'
WHERE w.is_active = true
GROUP BY w.id, w.name, w.config
ORDER BY matching_events DESC;

-- 6. Show sample events for debugging
SELECT 
  'SAMPLE EVENTS' as check_type,
  e.event_type,
  e.user_name,
  e.timestamp,
  e.client_id,
  s.name as site_name
FROM events e
LEFT JOIN sites s ON e.client_id = s.public_key
WHERE e.timestamp > NOW() - INTERVAL '24 hours'
ORDER BY e.timestamp DESC
LIMIT 5;
