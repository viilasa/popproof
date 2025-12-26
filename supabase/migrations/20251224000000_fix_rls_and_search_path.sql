-- ========================================
-- Fix RLS and Function Security Issues
-- Created: 2024-12-24
-- ========================================
-- This migration fixes:
-- 1. RLS not enabled on event_notifications table
-- 2. RLS not enabled on events table  
-- 3. search_path security issue on validate_widget_config function
-- 4. search_path security issue on handle_new_user function

-- ========================================
-- 1. Enable RLS on events table (force enable)
-- ========================================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 2. Enable RLS on event_notifications table (force enable)
-- ========================================
ALTER TABLE public.event_notifications ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 3. Fix validate_widget_config function with secure search_path
-- ========================================
CREATE OR REPLACE FUNCTION public.validate_widget_config(config jsonb)
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
$$ LANGUAGE plpgsql
SET search_path = public;

-- ========================================
-- 4. Fix handle_new_user function with secure search_path
-- ========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ========================================
-- 5. Also fix other functions that may have the same issue
-- ========================================

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Fix update_notification_timestamp function
CREATE OR REPLACE FUNCTION public.update_notification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Fix increment_notification_views function
CREATE OR REPLACE FUNCTION public.increment_notification_views(notif_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.event_notifications
  SET displayed_count = displayed_count + 1,
      updated_at = now()
  WHERE id = notif_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Fix increment_notification_clicks function
CREATE OR REPLACE FUNCTION public.increment_notification_clicks(notif_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.event_notifications
  SET clicked_count = clicked_count + 1,
      updated_at = now()
  WHERE id = notif_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Fix get_active_notifications function
CREATE OR REPLACE FUNCTION public.get_active_notifications(p_site_id uuid, p_limit integer DEFAULT 50)
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
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Fix get_active_visitors function
CREATE OR REPLACE FUNCTION public.get_active_visitors(p_site_id uuid, p_minutes integer DEFAULT 5)
RETURNS integer AS $$
  SELECT COUNT(DISTINCT session_id)::integer
  FROM public.events
  WHERE site_id = p_site_id
    AND event_type = 'visitor_active'
    AND timestamp > now() - (p_minutes || ' minutes')::interval
    AND session_id IS NOT NULL;
$$ LANGUAGE SQL STABLE
SET search_path = public;

-- Fix get_recent_events function
CREATE OR REPLACE FUNCTION public.get_recent_events(
  p_site_id uuid,
  p_event_type text DEFAULT NULL,
  p_limit integer DEFAULT 10,
  p_hours integer DEFAULT 24
)
RETURNS TABLE (
  id uuid,
  event_type text,
  event_data jsonb,
  "timestamp" timestamptz,
  user_name text,
  product_name text,
  location text
) AS $$
  SELECT 
    e.id,
    e.event_type,
    e.event_data,
    e."timestamp",
    e.user_name,
    e.product_name,
    e.location
  FROM public.events e
  WHERE e.site_id = p_site_id
    AND e.timestamp > now() - (p_hours || ' hours')::interval
    AND (p_event_type IS NULL OR e.event_type = p_event_type)
  ORDER BY e.timestamp DESC
  LIMIT p_limit;
$$ LANGUAGE SQL STABLE
SET search_path = public;

-- Fix cleanup_old_events function
CREATE OR REPLACE FUNCTION public.cleanup_old_events(p_days integer DEFAULT 90)
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.events
  WHERE created_at < now() - (p_days || ' days')::interval;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Fix get_widget_performance function
CREATE OR REPLACE FUNCTION public.get_widget_performance(
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
        FROM public.widget_analytics
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
        FROM public.widget_analytics
        WHERE widget_id = p_widget_id
        AND timestamp > NOW() - (p_days || ' days')::interval
        GROUP BY device_type
      ) devices
    )
  ) INTO result
  FROM public.widget_analytics
  WHERE widget_id = p_widget_id
  AND timestamp > NOW() - (p_days || ' days')::interval;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ========================================
-- Verification queries (run manually to verify)
-- ========================================
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('events', 'event_notifications');
-- SELECT proname, prosecdef, proconfig FROM pg_proc WHERE proname IN ('validate_widget_config', 'handle_new_user');

COMMENT ON FUNCTION public.validate_widget_config IS 'Validates widget config structure - fixed with secure search_path';
COMMENT ON FUNCTION public.handle_new_user IS 'Creates profile for new users - fixed with secure search_path';
