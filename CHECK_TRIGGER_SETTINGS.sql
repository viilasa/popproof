-- Check what trigger settings are actually saved in your widgets

SELECT 
  id,
  name,
  type,
  is_active,
  config->'triggers'->'behavior'->'showAfterDelay' as show_after_delay,
  config->'triggers'->'behavior' as behavior_triggers,
  config->'triggers' as all_triggers,
  config
FROM widgets
WHERE is_active = true
ORDER BY created_at DESC;

-- If the trigger settings are missing, run this to verify what's in config:
-- SELECT id, name, jsonb_pretty(config) FROM widgets WHERE is_active = true;
