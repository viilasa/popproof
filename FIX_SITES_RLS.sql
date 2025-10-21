-- Quick fix for sites table RLS
-- Run this in Supabase SQL Editor NOW to fix the 406 error

-- Enable RLS on sites table
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own sites" ON public.sites;
DROP POLICY IF EXISTS "Users can insert their own sites" ON public.sites;
DROP POLICY IF EXISTS "Users can update their own sites" ON public.sites;
DROP POLICY IF EXISTS "Users can delete their own sites" ON public.sites;

-- Create new policies
CREATE POLICY "Users can view their own sites"
  ON public.sites FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own sites"
  ON public.sites FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sites"
  ON public.sites FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own sites"
  ON public.sites FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Test query to verify it works
SELECT 
  id,
  user_id,
  name,
  domain,
  CASE 
    WHEN user_id = auth.uid() THEN '✅ YOU OWN THIS SITE'
    ELSE '❌ NOT YOUR SITE'
  END as ownership
FROM public.sites;
