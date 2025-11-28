-- Check all widgets for the specific site
SELECT id, name, is_active, site_id, type, created_at
FROM widgets
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1';

-- Check if the site exists and is verified
SELECT id, domain, verified, created_at
FROM sites
WHERE id = '48bf66cb-8842-422f-a66f-a3a341a00ec1';

-- Check all active widgets across all sites
SELECT w.id, w.name, w.is_active, w.site_id, s.domain
FROM widgets w
JOIN sites s ON w.site_id = s.id
WHERE w.is_active = true
LIMIT 10;
