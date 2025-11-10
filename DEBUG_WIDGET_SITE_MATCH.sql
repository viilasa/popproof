-- Debug: Check if widget and site match correctly
-- Site ID: 48bf66cb-8842-422f-a66f-a3a341a00ec1

-- 1. Show ALL active widgets (regardless of site)
SELECT 
  w.id as widget_id,
  w.name,
  w.site_id as widget_site_id,
  w.is_active,
  s.id as actual_site_id,
  s.name as site_name,
  s.public_key,
  w.config->>'template_id' as template_id,
  CASE 
    WHEN w.site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1' THEN '✅ MATCHES'
    ELSE '❌ MISMATCH'
  END as site_match
FROM widgets w
LEFT JOIN sites s ON w.site_id = s.id
WHERE w.is_active = true
ORDER BY w.created_at DESC;

-- 2. Check if cart widget exists for THIS specific site
SELECT 
  id,
  name,
  is_active,
  site_id,
  config->>'template_id' as template_id,
  config->'triggers'->'events'->>'eventTypes' as event_types
FROM widgets
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND is_active = true;

-- 3. Show the site's public key (this is what the pixel uses)
SELECT 
  id,
  name,
  public_key,
  domain
FROM sites
WHERE id = '48bf66cb-8842-422f-a66f-a3a341a00ec1';

-- 4. Check if events are being tracked to the right site
SELECT 
  COUNT(*) as event_count,
  site_id,
  event_type
FROM events
WHERE event_type = 'add_to_cart'
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY site_id, event_type;
