-- Check which widgets have hide_on_mobile enabled
-- This might be causing notifications to disappear on mobile

SELECT 
  id,
  name,
  is_active,
  hide_on_mobile,
  hide_on_desktop,
  mobile_position,
  position as desktop_position
FROM widgets
WHERE is_active = true
ORDER BY created_at DESC;

-- Fix: Set hide_on_mobile to FALSE for all active widgets
-- (So they show on mobile devices)
UPDATE widgets
SET hide_on_mobile = false,
    hide_on_desktop = false
WHERE is_active = true;

-- Verify the fix
SELECT 
  id,
  name,
  is_active,
  hide_on_mobile,
  hide_on_desktop,
  mobile_position,
  position as desktop_position
FROM widgets
WHERE is_active = true
ORDER BY created_at DESC;
