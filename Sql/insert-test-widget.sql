-- Insert a test widget for your site
INSERT INTO widgets (site_id, type, config, is_active)
VALUES (
  '1808e26c-e195-4fcf-8eb1-95a4be718b39'::uuid,
  'notification',
  '{
    "site_id": "1808e26c-e195-4fcf-8eb1-95a4be718b39",
    "position": "bottom-left",
    "displayDuration": 5000,
    "delayBetween": 8000,
    "showRecent": true,
    "recentTimeframe": 24,
    "animation": "slide",
    "theme": {
      "backgroundColor": "#ffffff",
      "textColor": "#333333",
      "accentColor": "#06b6d4"
    }
  }'::jsonb,
  true
)
ON CONFLICT DO NOTHING;
