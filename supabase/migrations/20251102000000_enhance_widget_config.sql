-- Enhanced Widget Configuration Schema
-- Phase 3: Comprehensive widget settings with design, triggers, display, branding, webhooks

-- Add version column to widgets table for config versioning
ALTER TABLE widgets 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Add updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_widgets_updated_at ON widgets;
CREATE TRIGGER update_widgets_updated_at 
    BEFORE UPDATE ON widgets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create widget_analytics table to track widget performance
CREATE TABLE IF NOT EXISTS widget_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id uuid REFERENCES widgets(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- 'view', 'click', 'dismiss', 'conversion'
  event_data jsonb DEFAULT '{}'::jsonb,
  session_id text,
  user_agent text,
  ip_address inet,
  country_code text,
  city text,
  device_type text, -- 'mobile', 'desktop', 'tablet'
  browser text,
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_widget_analytics_widget_id ON widget_analytics(widget_id);
CREATE INDEX IF NOT EXISTS idx_widget_analytics_event_type ON widget_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_widget_analytics_timestamp ON widget_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_widget_analytics_session_id ON widget_analytics(session_id);

-- Enable Row Level Security on widget_analytics
ALTER TABLE widget_analytics ENABLE ROW LEVEL SECURITY;

-- Policies for widget_analytics table
CREATE POLICY "Users can view analytics for their widgets"
  ON widget_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM widgets
      JOIN sites ON sites.id = widgets.site_id
      WHERE widgets.id = widget_analytics.widget_id
      AND sites.user_id = auth.uid()
    )
  );

-- Allow public insert for tracking (widgets are public-facing)
CREATE POLICY "Public can insert analytics"
  ON widget_analytics FOR INSERT
  WITH CHECK (true);

-- Create webhook_logs table to track webhook executions
CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id uuid REFERENCES widgets(id) ON DELETE CASCADE,
  webhook_id text NOT NULL, -- ID from widget config webhooks array
  webhook_url text NOT NULL,
  http_method text NOT NULL,
  request_payload jsonb,
  response_status integer,
  response_body text,
  error_message text,
  retry_count integer DEFAULT 0,
  executed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for webhook_logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_widget_id ON webhook_logs(widget_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_executed_at ON webhook_logs(executed_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_response_status ON webhook_logs(response_status);

-- Enable Row Level Security on webhook_logs
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Policies for webhook_logs table
CREATE POLICY "Users can view webhook logs for their widgets"
  ON webhook_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM widgets
      JOIN sites ON sites.id = widgets.site_id
      WHERE widgets.id = webhook_logs.widget_id
      AND sites.user_id = auth.uid()
    )
  );

-- Create widget_templates table for reusable widget configurations
CREATE TABLE IF NOT EXISTS widget_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text, -- 'minimal', 'modern', 'glassmorphic', 'bold', 'custom'
  is_public boolean DEFAULT false,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  config jsonb NOT NULL,
  preview_image_url text,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for widget_templates
CREATE INDEX IF NOT EXISTS idx_widget_templates_user_id ON widget_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_widget_templates_category ON widget_templates(category);
CREATE INDEX IF NOT EXISTS idx_widget_templates_is_public ON widget_templates(is_public);

-- Enable Row Level Security on widget_templates
ALTER TABLE widget_templates ENABLE ROW LEVEL SECURITY;

-- Policies for widget_templates table
CREATE POLICY "Users can view their own templates"
  ON widget_templates FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert their own templates"
  ON widget_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON widget_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON widget_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment to explain the enhanced config structure
COMMENT ON COLUMN widgets.config IS 
'Enhanced widget configuration with structure:
{
  "design": { "position": {}, "layout": {}, "border": {}, "shadow": {}, "background": {}, "typography": {}, "icon": {} },
  "triggers": { "events": {}, "time": {}, "behavior": {}, "frequency": {}, "advanced": {} },
  "display": { "duration": {}, "content": {}, "privacy": {}, "interaction": {}, "responsive": {} },
  "branding": { "identity": {}, "colorScheme": {}, "templates": {}, "customCSS": {}, "localization": {}, "sound": {} },
  "webhooks": { "webhooks": [], "payload": {} },
  "autoCapture": { "forms": {}, "clicks": {}, "pageEvents": {} },
  "ecommerce": { ... },
  "integrations": { ... },
  "analytics": { ... }
}';

-- Create function to validate widget config structure
CREATE OR REPLACE FUNCTION validate_widget_config(config jsonb)
RETURNS boolean AS $$
BEGIN
  -- Basic validation: check if required top-level keys exist
  IF NOT (
    config ? 'design' AND
    config ? 'triggers' AND
    config ? 'display' AND
    config ? 'branding'
  ) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Add check constraint for widget config (optional, can be strict or lenient)
-- Commented out by default to allow flexible config structure
-- ALTER TABLE widgets ADD CONSTRAINT valid_widget_config 
-- CHECK (validate_widget_config(config));

-- Create view for widget statistics
CREATE OR REPLACE VIEW widget_stats AS
SELECT 
  w.id as widget_id,
  w.name as widget_name,
  w.is_active,
  COUNT(DISTINCT wa.session_id) as unique_sessions,
  COUNT(CASE WHEN wa.event_type = 'view' THEN 1 END) as total_views,
  COUNT(CASE WHEN wa.event_type = 'click' THEN 1 END) as total_clicks,
  COUNT(CASE WHEN wa.event_type = 'dismiss' THEN 1 END) as total_dismisses,
  COUNT(CASE WHEN wa.event_type = 'conversion' THEN 1 END) as total_conversions,
  CASE 
    WHEN COUNT(CASE WHEN wa.event_type = 'view' THEN 1 END) > 0 
    THEN (COUNT(CASE WHEN wa.event_type = 'click' THEN 1 END)::float / 
          COUNT(CASE WHEN wa.event_type = 'view' THEN 1 END)::float * 100)
    ELSE 0 
  END as click_through_rate,
  MAX(wa.timestamp) as last_activity,
  w.created_at,
  w.updated_at
FROM widgets w
LEFT JOIN widget_analytics wa ON wa.widget_id = w.id
GROUP BY w.id, w.name, w.is_active, w.created_at, w.updated_at;

-- Grant access to the view
GRANT SELECT ON widget_stats TO authenticated;

-- Create function to get widget performance summary
CREATE OR REPLACE FUNCTION get_widget_performance(
  p_widget_id uuid,
  p_days integer DEFAULT 7
)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'widget_id', p_widget_id,
    'period_days', p_days,
    'total_views', COUNT(CASE WHEN event_type = 'view' THEN 1 END),
    'total_clicks', COUNT(CASE WHEN event_type = 'click' THEN 1 END),
    'total_dismisses', COUNT(CASE WHEN event_type = 'dismiss' THEN 1 END),
    'unique_sessions', COUNT(DISTINCT session_id),
    'avg_views_per_session', 
      CASE 
        WHEN COUNT(DISTINCT session_id) > 0 
        THEN COUNT(CASE WHEN event_type = 'view' THEN 1 END)::float / COUNT(DISTINCT session_id)::float
        ELSE 0 
      END,
    'click_through_rate',
      CASE 
        WHEN COUNT(CASE WHEN event_type = 'view' THEN 1 END) > 0 
        THEN (COUNT(CASE WHEN event_type = 'click' THEN 1 END)::float / 
              COUNT(CASE WHEN event_type = 'view' THEN 1 END)::float * 100)
        ELSE 0 
      END,
    'top_countries', (
      SELECT jsonb_agg(jsonb_build_object('country', country_code, 'count', cnt))
      FROM (
        SELECT country_code, COUNT(*) as cnt
        FROM widget_analytics
        WHERE widget_id = p_widget_id
        AND timestamp > NOW() - (p_days || ' days')::interval
        AND country_code IS NOT NULL
        GROUP BY country_code
        ORDER BY cnt DESC
        LIMIT 5
      ) countries
    ),
    'device_breakdown', (
      SELECT jsonb_object_agg(device_type, cnt)
      FROM (
        SELECT 
          COALESCE(device_type, 'unknown') as device_type, 
          COUNT(*) as cnt
        FROM widget_analytics
        WHERE widget_id = p_widget_id
        AND timestamp > NOW() - (p_days || ' days')::interval
        GROUP BY device_type
      ) devices
    )
  ) INTO result
  FROM widget_analytics
  WHERE widget_id = p_widget_id
  AND timestamp > NOW() - (p_days || ' days')::interval;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_widget_performance(uuid, integer) TO authenticated;

-- Insert some default widget templates
INSERT INTO widget_templates (name, description, category, is_public, config) VALUES
  (
    'Minimal Clean',
    'A clean, minimal design with subtle shadows',
    'minimal',
    true,
    '{
      "design": {
        "border": {"borderRadius": 8, "borderLeftAccent": false},
        "shadow": {"shadowSize": "sm", "glassmorphism": false}
      }
    }'::jsonb
  ),
  (
    'Modern Glassmorphic',
    'Modern glass morphism effect with backdrop blur',
    'glassmorphic',
    true,
    '{
      "design": {
        "border": {"borderRadius": 16},
        "shadow": {"shadowSize": "xl", "glassmorphism": true, "backdropBlur": 20},
        "background": {"backgroundColor": "rgba(255, 255, 255, 0.7)"}
      }
    }'::jsonb
  ),
  (
    'Bold & Prominent',
    'Bold design with strong colors and thick borders',
    'bold',
    true,
    '{
      "design": {
        "border": {"borderRadius": 4, "borderLeftAccentWidth": 6},
        "typography": {"title": {"fontWeight": 700, "fontSize": 15}}
      }
    }'::jsonb
  )
ON CONFLICT DO NOTHING;

COMMENT ON TABLE widget_analytics IS 'Tracks all widget interactions for performance analysis';
COMMENT ON TABLE webhook_logs IS 'Logs all webhook executions for debugging and monitoring';
COMMENT ON TABLE widget_templates IS 'Stores reusable widget configuration templates';
