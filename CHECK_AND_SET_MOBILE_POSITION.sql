-- Check and set mobile_position for all active widgets
-- This ensures widgets have mobile positioning configured

-- First, check current state
SELECT 
  id,
  name,
  position as desktop_position,
  mobile_position,
  is_active
FROM widgets
WHERE is_active = true
ORDER BY created_at DESC;

-- Set mobile_position to 'top-right' for widgets that don't have it set
UPDATE widgets
SET mobile_position = 'top-right'
WHERE is_active = true
  AND (mobile_position IS NULL OR mobile_position = '');

-- Verify the update
SELECT 
  id,
  name,
  position as desktop_position,
  mobile_position,
  is_active
FROM widgets
WHERE is_active = true
ORDER BY created_at DESC;
