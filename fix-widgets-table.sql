-- Add site_id column to widgets table
ALTER TABLE public.widgets 
ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES public.sites(id) ON DELETE CASCADE;

-- Create index for site_id
CREATE INDEX IF NOT EXISTS idx_widgets_site_id ON public.widgets(site_id);

-- Insert a test widget with site_id
INSERT INTO widgets (user_id, site_id, name, type, config, is_active)
VALUES (
  (SELECT auth.uid()),  -- Current user, or use a specific user_id
  '1808e26c-e195-4fcf-8eb1-95a4be718b39'::uuid,
  'Test Notification Widget',
  'notification',  -- Make sure this matches your widget_type enum
  '{
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
