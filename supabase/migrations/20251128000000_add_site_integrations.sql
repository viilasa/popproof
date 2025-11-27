-- Create site_integrations table for storing integration settings
CREATE TABLE IF NOT EXISTS site_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL, -- 'google-reviews', 'trustpilot', etc.
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}', -- Store API keys, place IDs, etc.
  last_sync TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending', -- 'pending', 'success', 'error'
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique integration per site
  UNIQUE(site_id, integration_type)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_site_integrations_site_id ON site_integrations(site_id);
CREATE INDEX IF NOT EXISTS idx_site_integrations_type ON site_integrations(integration_type);

-- Enable RLS
ALTER TABLE site_integrations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own site integrations"
  ON site_integrations FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own site integrations"
  ON site_integrations FOR INSERT
  WITH CHECK (
    site_id IN (
      SELECT id FROM sites WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own site integrations"
  ON site_integrations FOR UPDATE
  USING (
    site_id IN (
      SELECT id FROM sites WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own site integrations"
  ON site_integrations FOR DELETE
  USING (
    site_id IN (
      SELECT id FROM sites WHERE user_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_site_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_site_integrations_updated_at
  BEFORE UPDATE ON site_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_site_integrations_updated_at();
