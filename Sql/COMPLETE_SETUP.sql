-- ========================================
-- COMPLETE PIXEL INTEGRATION SETUP
-- Run this in Supabase SQL Editor
-- ========================================

-- Your site ID
DO $$
DECLARE
  v_site_id uuid := '1808e26c-e195-4fcf-8eb1-95a4be718b39';
  v_user_id uuid;
  v_widget_count integer;
BEGIN
  
  -- ========================================
  -- STEP 1: Verify Site Exists
  -- ========================================
  RAISE NOTICE '=== STEP 1: Checking Site ===';
  
  SELECT user_id INTO v_user_id
  FROM sites
  WHERE id = v_site_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Site not found! ID: %', v_site_id;
  END IF;
  
  RAISE NOTICE 'Site found. User ID: %', v_user_id;
  
  -- ========================================
  -- STEP 2: Ensure Site is Verified
  -- ========================================
  RAISE NOTICE '=== STEP 2: Verifying Site ===';
  
  UPDATE sites
  SET 
    verified = true,
    verification_status = 'verified',
    last_ping = now()  -- Set initial ping
  WHERE id = v_site_id;
  
  RAISE NOTICE 'Site verified and last_ping updated';
  
  -- ========================================
  -- STEP 3: Check/Create Widget
  -- ========================================
  RAISE NOTICE '=== STEP 3: Checking Widgets ===';
  
  SELECT COUNT(*) INTO v_widget_count
  FROM widgets
  WHERE site_id = v_site_id
  AND is_active = true;
  
  RAISE NOTICE 'Found % active widgets', v_widget_count;
  
  IF v_widget_count = 0 THEN
    RAISE NOTICE 'Creating new widget...';
    
    INSERT INTO widgets (
      user_id,
      site_id,
      name,
      type,
      config,
      is_active
    ) VALUES (
      v_user_id,
      v_site_id,
      'Social Proof Notifications',
      'notification'::widget_type,
      jsonb_build_object(
        'position', 'bottom-left',
        'displayDuration', 5000,
        'delayBetween', 8000,
        'showRecent', true,
        'recentTimeframe', 24,
        'animation', 'slide',
        'theme', jsonb_build_object(
          'backgroundColor', '#ffffff',
          'textColor', '#333333',
          'accentColor', '#06b6d4'
        )
      ),
      true
    );
    
    RAISE NOTICE 'Widget created successfully';
  ELSE
    RAISE NOTICE 'Widgets already exist, ensuring they are active...';
    
    UPDATE widgets
    SET is_active = true
    WHERE site_id = v_site_id;
    
    RAISE NOTICE 'Widgets activated';
  END IF;
  
  -- ========================================
  -- STEP 4: Test Verification Function
  -- ========================================
  RAISE NOTICE '=== STEP 4: Testing Verification Function ===';
  
  PERFORM update_site_verification_status(v_site_id, 'verified');
  
  RAISE NOTICE 'Verification function executed';
  
END $$;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check site status
SELECT 
  id,
  name,
  domain,
  verified,
  verification_status,
  last_ping,
  last_verification_attempt,
  verification_attempts
FROM sites
WHERE id = '1808e26c-e195-4fcf-8eb1-95a4be718b39';

-- Check widgets
SELECT 
  id,
  name,
  type,
  is_active,
  site_id,
  created_at
FROM widgets
WHERE site_id = '1808e26c-e195-4fcf-8eb1-95a4be718b39';

-- Check recent verifications
SELECT 
  id,
  site_id,
  status,
  verified_at,
  user_agent,
  ip_address,
  created_at
FROM pixel_verifications
WHERE site_id = '1808e26c-e195-4fcf-8eb1-95a4be718b39'
ORDER BY created_at DESC
LIMIT 5;

-- Check recent events
SELECT 
  id,
  event_type,
  url,
  timestamp,
  created_at
FROM events
WHERE site_id = '1808e26c-e195-4fcf-8eb1-95a4be718b39'
ORDER BY created_at DESC
LIMIT 5;

-- ========================================
-- EXPECTED RESULTS
-- ========================================
-- Site: verified = true, last_ping = recent timestamp
-- Widgets: At least 1 active widget
-- Ready to test!
