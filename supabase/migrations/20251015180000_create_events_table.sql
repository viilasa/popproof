-- ========================================
-- Create Events Table for Enhanced Tracking
-- Phase 1, Task 1.2
-- ========================================

-- Drop existing events table if it exists
DROP TABLE IF EXISTS events CASCADE;

-- Create events table with rich metadata support
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core identifiers
  site_id uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  session_id text,
  
  -- Event information
  event_type text NOT NULL,
  type text, -- Alias for event_type for backwards compatibility
  
  -- URL information
  url text,
  domain text,
  path text,
  referrer text,
  
  -- User information (optional)
  user_name text,
  user_agent text,
  ip_address text,
  
  -- Event-specific data
  product_name text,
  value numeric,
  currency text DEFAULT 'USD',
  location text,
  
  -- Platform & source
  platform text DEFAULT 'custom',
  source text DEFAULT 'pixel',
  
  -- Rich metadata (JSONB for flexibility)
  metadata jsonb DEFAULT '{}'::jsonb,
  event_data jsonb DEFAULT '{}'::jsonb,
  
  -- Timestamps
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  
  -- Legacy field
  client_id text
);

-- ========================================
-- Indexes for Performance
-- ========================================

-- Primary queries
CREATE INDEX idx_events_site_id ON events(site_id);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_session_id ON events(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_events_timestamp ON events(timestamp DESC);

-- Composite indexes for common queries
CREATE INDEX idx_events_site_timestamp ON events(site_id, timestamp DESC);
CREATE INDEX idx_events_site_type_timestamp ON events(site_id, event_type, timestamp DESC);
CREATE INDEX idx_events_session_timestamp ON events(session_id, timestamp DESC) WHERE session_id IS NOT NULL;

-- Platform-specific queries
CREATE INDEX idx_events_platform ON events(platform) WHERE platform IS NOT NULL;

-- JSONB indexes for metadata queries
CREATE INDEX idx_events_metadata ON events USING GIN (metadata);
CREATE INDEX idx_events_event_data ON events USING GIN (event_data);

-- ========================================
-- Row Level Security (RLS)
-- ========================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Users can view events for their own sites
CREATE POLICY "Users can view their site events"
  ON events
  FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites WHERE user_id = auth.uid()
    )
  );

-- Users can insert events for their own sites
CREATE POLICY "Users can insert events for their sites"
  ON events
  FOR INSERT
  WITH CHECK (
    site_id IN (
      SELECT id FROM sites WHERE user_id = auth.uid()
    )
  );

-- Service role can do everything (for edge functions)
CREATE POLICY "Service role has full access"
  ON events
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ========================================
-- Helper Functions
-- ========================================

-- Function to get active visitor count for a site
CREATE OR REPLACE FUNCTION get_active_visitors(p_site_id uuid, p_minutes integer DEFAULT 5)
RETURNS integer AS $$
  SELECT COUNT(DISTINCT session_id)::integer
  FROM events
  WHERE site_id = p_site_id
    AND event_type = 'visitor_active'
    AND timestamp > now() - (p_minutes || ' minutes')::interval
    AND session_id IS NOT NULL;
$$ LANGUAGE SQL STABLE;

-- Function to get recent events by type
CREATE OR REPLACE FUNCTION get_recent_events(
  p_site_id uuid,
  p_event_type text DEFAULT NULL,
  p_limit integer DEFAULT 10,
  p_hours integer DEFAULT 24
)
RETURNS TABLE (
  id uuid,
  event_type text,
  event_data jsonb,
  timestamp timestamptz,
  user_name text,
  product_name text,
  location text
) AS $$
  SELECT 
    id,
    event_type,
    event_data,
    timestamp,
    user_name,
    product_name,
    location
  FROM events
  WHERE site_id = p_site_id
    AND timestamp > now() - (p_hours || ' hours')::interval
    AND (p_event_type IS NULL OR event_type = p_event_type)
  ORDER BY timestamp DESC
  LIMIT p_limit;
$$ LANGUAGE SQL STABLE;

-- Function to clean up old events (optional maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_events(p_days integer DEFAULT 90)
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM events
  WHERE created_at < now() - (p_days || ' days')::interval;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- Comments for Documentation
-- ========================================

COMMENT ON TABLE events IS 'Stores all tracked events from pixel v3.0';
COMMENT ON COLUMN events.site_id IS 'Reference to the site where event occurred';
COMMENT ON COLUMN events.session_id IS 'Unique session identifier for user journey tracking';
COMMENT ON COLUMN events.event_type IS 'Type of event (page_view, form_submit, purchase, etc.)';
COMMENT ON COLUMN events.platform IS 'Detected platform (shopify, woocommerce, wordpress, custom, etc.)';
COMMENT ON COLUMN events.event_data IS 'Rich event-specific data in JSONB format';
COMMENT ON COLUMN events.metadata IS 'Additional metadata (screen size, language, timezone, etc.)';

-- ========================================
-- Test Data (Optional - Remove in production)
-- ========================================

-- Uncomment to add test data
-- INSERT INTO events (site_id, event_type, user_name, product_name, event_data) VALUES
-- ((SELECT id FROM sites LIMIT 1), 'purchase', 'John Doe', 'Premium Plan', '{"price": 99}'::jsonb),
-- ((SELECT id FROM sites LIMIT 1), 'signup', 'Jane Smith', NULL, '{"plan": "free"}'::jsonb);
