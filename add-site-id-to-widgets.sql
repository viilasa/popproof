-- Add site_id column to widgets table
ALTER TABLE public.widgets 
ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES public.sites(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_widgets_site_id ON public.widgets(site_id);

-- Insert test widget with site_id
-- First, get or create a user_id (replace with actual user_id from auth.users)
DO $$
DECLARE
  test_user_id uuid;
BEGIN
  -- Try to get the first user, or use a specific user_id
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  -- If no user exists, you'll need to create one first or use a specific UUID
  IF test_user_id IS NULL THEN
    RAISE NOTICE 'No user found. Please create a user first or specify a user_id.';
  ELSE
    -- Insert test widget
    INSERT INTO widgets (user_id, site_id, name, type, config, is_active)
    VALUES (
      test_user_id,
      '1808e26c-e195-4fcf-8eb1-95a4be718b39'::uuid,
      'Test Notification Widget',
      'notification'::widget_type,
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
  END IF;
END $$;
