-- Fix sites table RLS policies to allow users to read their own sites

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own sites" ON public.sites;
DROP POLICY IF EXISTS "Users can insert their own sites" ON public.sites;
DROP POLICY IF EXISTS "Users can update their own sites" ON public.sites;
DROP POLICY IF EXISTS "Users can delete their own sites" ON public.sites;

-- Enable RLS
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies for sites table
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
