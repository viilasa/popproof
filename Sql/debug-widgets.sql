-- Debug Widget Display Issues
-- Run these queries to find out why widgets aren't showing

-- 1. Check if test site exists
SELECT id, name, domain, pixel_code, verification_status, verified
FROM sites
WHERE id = '1808e26c-e195-4fcf-8eb1-95a4be718b39';

-- 2. Check if any widgets exist for this site
SELECT id, name, type, is_active, site_id, user_id
FROM widgets
WHERE site_id = '1808e26c-e195-4fcf-8eb1-95a4be718b39';

-- 3. Check ALL widgets in database
SELECT id, name, type, is_active, site_id, user_id
FROM widgets
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check if widgets have site_id column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'widgets'
AND column_name IN ('site_id', 'user_id', 'type', 'config', 'is_active');

-- 5. Check widget_type enum values
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'widget_type')
ORDER BY enumsortorder;

-- 6. Check if get-widgets function would return anything
-- (Simulating what the edge function does)
SELECT w.*, s.domain
FROM widgets w
LEFT JOIN sites s ON w.site_id = s.id
WHERE w.site_id = '1808e26c-e195-4fcf-8eb1-95a4be718b39'
AND w.is_active = true;

-- 7. Check recent events
SELECT event_type, url, timestamp
FROM events
WHERE site_id = '1808e26c-e195-4fcf-8eb1-95a4be718b39'
ORDER BY timestamp DESC
LIMIT 5;
