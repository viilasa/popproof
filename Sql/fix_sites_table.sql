-- ========================================
-- FIX: Enable pgcrypto extension and fix trigger
-- Run this in Supabase SQL Editor
-- ========================================

-- 1. Enable the pgcrypto extension (required for gen_random_bytes)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Verify sites table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'sites'
) as sites_table_exists;

-- 3. If the trigger is still causing issues, disable it temporarily
DROP TRIGGER IF EXISTS ensure_pixel_code_trigger ON public.sites;

-- 4. Recreate the function with proper extension check
CREATE OR REPLACE FUNCTION ensure_pixel_code()
RETURNS trigger AS $$
BEGIN
  IF NEW.pixel_code IS NULL THEN
    -- Use gen_random_uuid instead if pgcrypto is not available
    NEW.pixel_code := 'px_' || replace(gen_random_uuid()::text, '-', '');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Recreate the trigger (optional - only if you want auto pixel codes)
-- CREATE TRIGGER ensure_pixel_code_trigger
--   BEFORE INSERT OR UPDATE ON public.sites
--   FOR EACH ROW
--   EXECUTE FUNCTION ensure_pixel_code();

-- 6. Make sure all required columns exist
ALTER TABLE public.sites
ADD COLUMN IF NOT EXISTS pixel_code text;

-- 7. Enable RLS and check policies
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

-- Check if insert policy exists
SELECT policyname FROM pg_policies WHERE tablename = 'sites' AND cmd = 'INSERT';

-- Create insert policy if missing
DROP POLICY IF EXISTS "Users can insert their own sites" ON public.sites;
CREATE POLICY "Users can insert their own sites"
  ON public.sites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

SELECT 'Fix applied! Try adding a site now.' AS result;
