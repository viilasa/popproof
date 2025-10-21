-- Create sites table
CREATE TABLE IF NOT EXISTS sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  domain text NOT NULL,
  name text,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create widgets table
CREATE TABLE IF NOT EXISTS widgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES sites(id) ON DELETE CASCADE,
  type text NOT NULL,
  config jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;

-- Policies for sites table
CREATE POLICY "Users can view their own sites"
  ON sites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sites"
  ON sites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sites"
  ON sites FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sites"
  ON sites FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for widgets table
CREATE POLICY "Users can view widgets for their sites"
  ON widgets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = widgets.site_id
      AND sites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert widgets for their sites"
  ON widgets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = widgets.site_id
      AND sites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update widgets for their sites"
  ON widgets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = widgets.site_id
      AND sites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete widgets for their sites"
  ON widgets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = widgets.site_id
      AND sites.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sites_user_id ON sites(user_id);
CREATE INDEX IF NOT EXISTS idx_sites_domain ON sites(domain);
CREATE INDEX IF NOT EXISTS idx_widgets_site_id ON widgets(site_id);
CREATE INDEX IF NOT EXISTS idx_widgets_is_active ON widgets(is_active);

-- Insert test site with the ID from your script tag
INSERT INTO sites (id, domain, name, verified)
VALUES (
  '1808e26c-e195-4fcf-8eb1-95a4be718b39'::uuid,
  'test.example.com',
  'Test Site',
  true
)
ON CONFLICT (id) DO UPDATE
SET verified = true;
