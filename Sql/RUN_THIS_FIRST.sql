-- Step 1: Add the enum value FIRST (run this separately)
-- This must be committed before it can be used

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'notification' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'widget_type')
  ) THEN
    ALTER TYPE widget_type ADD VALUE 'notification';
    RAISE NOTICE 'Added notification enum value';
  ELSE
    RAISE NOTICE 'notification enum value already exists';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'notification enum value already exists (caught exception)';
END $$;

-- That's it! Now run the main migration file.
