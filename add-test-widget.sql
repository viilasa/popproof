-- Add a test widget for your site
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  test_site_id uuid := '1808e26c-e195-4fcf-8eb1-95a4be718b39';
  test_user_id uuid;
  existing_widget_count integer;
BEGIN
  -- Get the first user
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  -- Check if widget already exists
  SELECT COUNT(*) INTO existing_widget_count
  FROM widgets
  WHERE site_id = test_site_id;
  
  IF existing_widget_count > 0 THEN
    -- Update existing widgets to be active
    UPDATE widgets
    SET is_active = true,
        site_id = test_site_id
    WHERE site_id = test_site_id OR site_id IS NULL;
    
    RAISE NOTICE 'Updated % existing widgets', existing_widget_count;
  ELSE
    -- Insert a new test widget
    INSERT INTO widgets (user_id, site_id, name, type, config, is_active)
    VALUES (
      COALESCE(test_user_id, '00000000-0000-0000-0000-000000000000'::uuid),
      test_site_id,
      'Social Proof Notification',
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
    );
    
    RAISE NOTICE 'Created new test widget';
  END IF;
  
  -- Ensure site is verified
  UPDATE sites
  SET verified = true,
      verification_status = 'verified'
  WHERE id = test_site_id;
  
  RAISE NOTICE 'Site verified';
  
END $$;

-- Verify the widget was created
SELECT 
  w.id,
  w.name,
  w.type,
  w.is_active,
  w.site_id,
  s.name as site_name,
  s.verified as site_verified
FROM widgets w
LEFT JOIN sites s ON w.site_id = s.id
WHERE w.site_id = '1808e26c-e195-4fcf-8eb1-95a4be718b39';
