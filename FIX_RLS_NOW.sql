-- Quick fix for RLS issue
-- Run this directly in Supabase SQL Editor

-- Option 1: Temporarily disable RLS (TESTING ONLY)
-- ALTER TABLE public.widgets DISABLE ROW LEVEL SECURITY;

-- Option 2: Fix the policies (RECOMMENDED)
-- Drop and recreate all widget policies

DROP POLICY IF EXISTS "Users can view widgets for their sites" ON public.widgets;
DROP POLICY IF EXISTS "Users can insert widgets for their sites" ON public.widgets;
DROP POLICY IF EXISTS "Users can update widgets for their sites" ON public.widgets;
DROP POLICY IF EXISTS "Users can delete widgets for their sites" ON public.widgets;

-- Recreate policies with proper permissions
CREATE POLICY "Users can view widgets for their sites"
  ON public.widgets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = widgets.site_id
      AND sites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert widgets for their sites"
  ON public.widgets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = widgets.site_id
      AND sites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update widgets for their sites"
  ON public.widgets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = widgets.site_id
      AND sites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete widgets for their sites"
  ON public.widgets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = widgets.site_id
      AND sites.user_id = auth.uid()
    )
  );

-- Test query to verify your site setup
SELECT 
  s.id as site_id,
  s.user_id as site_user_id,
  auth.uid() as current_user_id,
  CASE WHEN s.user_id = auth.uid() THEN 'MATCH ✅' ELSE 'NO MATCH ❌' END as match_status
FROM public.sites s
WHERE s.id = 'b43242cc-4230-408f-b963-7cbb03391202';

-- Try manual insert to test
-- INSERT INTO public.widgets (site_id, type, is_active, config)
-- VALUES (
--   'b43242cc-4230-408f-b963-7cbb03391202',
--   'notification',
--   true,
--   '{"name": "Test Widget", "template_id": "recent_purchase"}'::jsonb
-- );
