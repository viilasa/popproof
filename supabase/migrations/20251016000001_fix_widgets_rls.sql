-- Fix widgets RLS policy for inserts
-- The current policy checks if site.user_id = auth.uid()
-- But we need to make sure it works for all authenticated users

-- Drop existing insert policy
DROP POLICY IF EXISTS "Users can insert widgets for their sites" ON public.widgets;

-- Create new insert policy that's more permissive
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

-- Also make sure update policy exists
DROP POLICY IF EXISTS "Users can update widgets for their sites" ON public.widgets;

CREATE POLICY "Users can update widgets for their sites"
  ON public.widgets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = widgets.site_id
      AND sites.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = widgets.site_id
      AND sites.user_id = auth.uid()
    )
  );

-- Make sure select policy exists
DROP POLICY IF EXISTS "Users can view widgets for their sites" ON public.widgets;

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

-- Make sure delete policy exists  
DROP POLICY IF EXISTS "Users can delete widgets for their sites" ON public.widgets;

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
