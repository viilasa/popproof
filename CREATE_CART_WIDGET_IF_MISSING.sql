-- Create a cart activity widget if it doesn't exist
-- Site ID: 48bf66cb-8842-422f-a66f-a3a341a00ec1

-- First check if it already exists
DO $$
DECLARE
  widget_exists BOOLEAN;
  widget_count INTEGER;
BEGIN
  -- Check if cart activity widget exists
  SELECT COUNT(*) INTO widget_count
  FROM widgets
  WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
    AND config->>'template_id' = 'cart_activity';
  
  IF widget_count = 0 THEN
    -- Create the widget
    INSERT INTO widgets (
      site_id,
      name,
      type,
      is_active,
      config,
      position,
      offset_x,
      offset_y,
      display_duration,
      notification_time_range
    ) VALUES (
      '48bf66cb-8842-422f-a66f-a3a341a00ec1',
      'Cart Activity',
      'notification',
      true,
      jsonb_build_object(
        'template_id', 'cart_activity',
        'name', 'Cart Activity',
        'triggers', jsonb_build_object(
          'events', jsonb_build_object(
            'eventTypes', jsonb_build_array('add_to_cart')
          )
        ),
        'rules', jsonb_build_object(
          'eventTypes', jsonb_build_array('add_to_cart'),
          'timeWindowHours', 2,
          'excludeTestEvents', false
        )
      ),
      'bottom-left',
      20,
      20,
      8,
      2
    );
    RAISE NOTICE 'Cart Activity widget created!';
  ELSE
    RAISE NOTICE 'Cart Activity widget already exists!';
  END IF;
END $$;

-- Verify the widget exists and is active
SELECT 
  id,
  name,
  is_active,
  site_id,
  config->>'template_id' as template_id,
  config->'rules'->>'eventTypes' as event_types,
  notification_time_range,
  created_at
FROM widgets
WHERE site_id = '48bf66cb-8842-422f-a66f-a3a341a00ec1'
ORDER BY created_at DESC;
