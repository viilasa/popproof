-- Phase 2: Real Data Integration - Notification System Schema
-- Created: 2025-10-16

-- 1. Notification Rules Table
-- Controls which events become notifications and how they're displayed
CREATE TABLE IF NOT EXISTS public.notification_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  widget_id uuid REFERENCES public.widgets(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  
  -- Trigger Configuration
  event_types text[] NOT NULL DEFAULT '{}', -- ['purchase', 'signup', 'form_submit']
  min_value numeric, -- Minimum transaction value
  max_value numeric, -- Maximum transaction value
  platforms text[], -- ['shopify', 'woocommerce', 'custom']
  time_window_hours integer DEFAULT 24, -- Only show events from last X hours
  
  -- Filter Configuration
  exclude_test_events boolean DEFAULT true,
  exclude_urls text[] DEFAULT '{}',
  exclude_user_agents text[] DEFAULT '{}',
  require_location boolean DEFAULT false, -- Only show if location is available
  
  -- Display Configuration
  display_delay_seconds integer DEFAULT 0, -- Delay before showing
  display_duration_seconds integer DEFAULT 8, -- How long to show
  max_displays_per_session integer DEFAULT 5, -- Max times to show per visitor
  display_order text DEFAULT 'recent', -- 'recent', 'random', 'priority'
  
  -- Template Configuration
  template_id text, -- Reference to notification template
  custom_template jsonb, -- Custom template overrides
  show_timestamp boolean DEFAULT true,
  show_location boolean DEFAULT true,
  anonymize_names boolean DEFAULT false, -- "John D." instead of "John Doe"
  
  -- Status
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0, -- Higher priority shown first
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- 2. Event Notifications Table
-- Links events to generated notifications
CREATE TABLE IF NOT EXISTS public.event_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  widget_id uuid REFERENCES public.widgets(id) ON DELETE SET NULL,
  rule_id uuid REFERENCES public.notification_rules(id) ON DELETE SET NULL,
  
  -- Notification Data
  notification_type text NOT NULL, -- 'purchase', 'signup', 'review', etc.
  title text NOT NULL,
  message text NOT NULL,
  customer_name text,
  customer_avatar text,
  location text,
  product_name text,
  amount numeric,
  currency text DEFAULT 'USD',
  icon text, -- Icon identifier
  display_timestamp text, -- Display timestamp like "2 minutes ago"
  
  -- Full notification config
  notification_config jsonb NOT NULL DEFAULT '{}',
  
  -- Analytics
  displayed_count integer DEFAULT 0,
  clicked_count integer DEFAULT 0,
  closed_count integer DEFAULT 0,
  conversion_count integer DEFAULT 0,
  
  -- Status
  is_active boolean DEFAULT true,
  expires_at timestamptz, -- Optional expiration
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Notification Analytics Table
-- Track notification performance
CREATE TABLE IF NOT EXISTS public.notification_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_notification_id uuid REFERENCES public.event_notifications(id) ON DELETE CASCADE,
  widget_id uuid REFERENCES public.widgets(id) ON DELETE CASCADE,
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  
  -- Action Details
  action_type text NOT NULL, -- 'view', 'click', 'close', 'conversion'
  session_id text,
  user_agent text,
  ip_address text,
  referrer text,
  
  -- Context
  page_url text,
  device_type text, -- 'desktop', 'mobile', 'tablet'
  
  -- Metadata
  timestamp timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- 4. Create Indexes
CREATE INDEX IF NOT EXISTS idx_notification_rules_site_id ON public.notification_rules(site_id);
CREATE INDEX IF NOT EXISTS idx_notification_rules_active ON public.notification_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_notification_rules_event_types ON public.notification_rules USING GIN(event_types);

CREATE INDEX IF NOT EXISTS idx_event_notifications_event_id ON public.event_notifications(event_id);
CREATE INDEX IF NOT EXISTS idx_event_notifications_site_id ON public.event_notifications(site_id);
CREATE INDEX IF NOT EXISTS idx_event_notifications_widget_id ON public.event_notifications(widget_id);
CREATE INDEX IF NOT EXISTS idx_event_notifications_active ON public.event_notifications(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_event_notifications_type ON public.event_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_event_notifications_created ON public.event_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_analytics_event_notif ON public.notification_analytics(event_notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_analytics_widget ON public.notification_analytics(widget_id);
CREATE INDEX IF NOT EXISTS idx_notification_analytics_site ON public.notification_analytics(site_id);
CREATE INDEX IF NOT EXISTS idx_notification_analytics_action ON public.notification_analytics(action_type);
CREATE INDEX IF NOT EXISTS idx_notification_analytics_timestamp ON public.notification_analytics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_notification_analytics_session ON public.notification_analytics(session_id);

-- 5. Enable RLS
ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_analytics ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for notification_rules
CREATE POLICY "Users can view their site rules"
  ON public.notification_rules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = notification_rules.site_id
      AND sites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create rules for their sites"
  ON public.notification_rules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = notification_rules.site_id
      AND sites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their site rules"
  ON public.notification_rules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = notification_rules.site_id
      AND sites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their site rules"
  ON public.notification_rules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = notification_rules.site_id
      AND sites.user_id = auth.uid()
    )
  );

-- 7. RLS Policies for event_notifications
CREATE POLICY "Users can view their site notifications"
  ON public.event_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = event_notifications.site_id
      AND sites.user_id = auth.uid()
    )
  );

-- Service role can insert/update for automation
CREATE POLICY "Service can manage event notifications"
  ON public.event_notifications FOR ALL
  USING (true)
  WITH CHECK (true);

-- 8. RLS Policies for notification_analytics
CREATE POLICY "Users can view their site analytics"
  ON public.notification_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = notification_analytics.site_id
      AND sites.user_id = auth.uid()
    )
  );

-- Service role can insert analytics
CREATE POLICY "Service can insert analytics"
  ON public.notification_analytics FOR INSERT
  WITH CHECK (true);

-- 9. Helper Functions

-- Function to update notification analytics on view
CREATE OR REPLACE FUNCTION increment_notification_views(notif_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.event_notifications
  SET displayed_count = displayed_count + 1,
      updated_at = now()
  WHERE id = notif_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update notification analytics on click
CREATE OR REPLACE FUNCTION increment_notification_clicks(notif_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.event_notifications
  SET clicked_count = clicked_count + 1,
      updated_at = now()
  WHERE id = notif_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active notifications for a site
CREATE OR REPLACE FUNCTION get_active_notifications(p_site_id uuid, p_limit integer DEFAULT 50)
RETURNS TABLE (
  id uuid,
  notification_type text,
  title text,
  message text,
  customer_name text,
  location text,
  display_timestamp text,
  icon text,
  notification_config jsonb,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    en.id,
    en.notification_type,
    en.title,
    en.message,
    en.customer_name,
    en.location,
    en.display_timestamp,
    en.icon,
    en.notification_config,
    en.created_at
  FROM public.event_notifications en
  WHERE en.site_id = p_site_id
    AND en.is_active = true
    AND (en.expires_at IS NULL OR en.expires_at > now())
  ORDER BY en.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Triggers
CREATE OR REPLACE FUNCTION update_notification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notification_rules_updated
  BEFORE UPDATE ON public.notification_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_timestamp();

CREATE TRIGGER event_notifications_updated
  BEFORE UPDATE ON public.event_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_timestamp();

-- Done!
COMMENT ON TABLE public.notification_rules IS 'Rules for converting events into displayable notifications';
COMMENT ON TABLE public.event_notifications IS 'Generated notifications from events, ready for display';
COMMENT ON TABLE public.notification_analytics IS 'Analytics tracking for notification performance';
