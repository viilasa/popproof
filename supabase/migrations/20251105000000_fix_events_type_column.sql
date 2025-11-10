-- Fix events table type column
-- The 'type' column should automatically mirror 'event_type' for backwards compatibility

-- 1. Make type column nullable first (in case there's existing data)
ALTER TABLE events ALTER COLUMN type DROP NOT NULL;

-- 2. Set default value to match event_type
ALTER TABLE events ALTER COLUMN type SET DEFAULT '';

-- 3. Update any existing rows where type is null
UPDATE events SET type = event_type WHERE type IS NULL;

-- 4. Create a trigger to automatically set type = event_type
CREATE OR REPLACE FUNCTION sync_event_type()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically set type to match event_type
  IF NEW.type IS NULL OR NEW.type = '' THEN
    NEW.type := NEW.event_type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS sync_event_type_trigger ON events;

-- Create trigger
CREATE TRIGGER sync_event_type_trigger
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION sync_event_type();

-- Add comment
COMMENT ON COLUMN events.type IS 'Alias for event_type (auto-synced via trigger for backwards compatibility)';
