-- Fix widget configurations - Set proper template_id and event types
-- Site ID: 48bf66cb-8842-422f-a66f-a3a341a00ec1

-- Check current state
SELECT 
  id,
  name,
  config->>'template_id' as current_template,
  config->'triggers'->'events'->>'eventTypes' as current_event_types,
  '❌ NULL means broken!' as note
FROM widgets
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND is_active = true;

-- Fix Cart Activity widget
UPDATE widgets
SET config = jsonb_set(
  jsonb_set(
    COALESCE(config, '{}'::jsonb),
    '{template_id}',
    '"cart_activity"'
  ),
  '{triggers,events,eventTypes}',
  '["add_to_cart"]'::jsonb
)
WHERE id = '432a9a16-3b5c-4278-8349-ff0dd5011327';

-- Fix Customer Reviews widget
UPDATE widgets
SET config = jsonb_set(
  jsonb_set(
    COALESCE(config, '{}'::jsonb),
    '{template_id}',
    '"customer_reviews"'
  ),
  '{triggers,events,eventTypes}',
  '["review"]'::jsonb
)
WHERE id = '9438f690-ec10-4095-8bbf-2abb7174b766';

-- Also set the rules.eventTypes for both
UPDATE widgets
SET config = jsonb_set(
  config,
  '{rules,eventTypes}',
  '["add_to_cart"]'::jsonb
)
WHERE id = '432a9a16-3b5c-4278-8349-ff0dd5011327';

UPDATE widgets
SET config = jsonb_set(
  config,
  '{rules,eventTypes}',
  '["review"]'::jsonb
)
WHERE id = '9438f690-ec10-4095-8bbf-2abb7174b766';

-- Verify the fix
SELECT 
  '✅ AFTER FIX:' as status,
  id,
  name,
  config->>'template_id' as template_id,
  config->'triggers'->'events'->>'eventTypes' as trigger_event_types,
  config->'rules'->>'eventTypes' as rule_event_types
FROM widgets
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
  AND is_active = true;
