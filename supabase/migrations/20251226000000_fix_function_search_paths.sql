-- ========================================
-- Fix Function search_path Security Issues
-- Created: 2024-12-26
-- ========================================
-- This migration fixes mutable search_path on all functions
-- Adding SET search_path = public to prevent search_path injection attacks

-- ========================================
-- 1. Fix generate_pixel_code function
-- ========================================
CREATE OR REPLACE FUNCTION public.generate_pixel_code()
RETURNS text AS $$
BEGIN
  RETURN 'px_' || encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- ========================================
-- 2. Fix ensure_pixel_code function
-- ========================================
CREATE OR REPLACE FUNCTION public.ensure_pixel_code()
RETURNS trigger AS $$
BEGIN
  IF NEW.pixel_code IS NULL THEN
    NEW.pixel_code := public.generate_pixel_code();
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM public.sites WHERE pixel_code = NEW.pixel_code) LOOP
      NEW.pixel_code := public.generate_pixel_code();
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- ========================================
-- 3. Fix cleanup_expired_verifications function
-- ========================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_verifications()
RETURNS void AS $$
BEGIN
  DELETE FROM public.pixel_verifications 
  WHERE expires_at < now() AND status = 'pending';
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- ========================================
-- 4. Fix update_site_verification_status function
-- ========================================
CREATE OR REPLACE FUNCTION public.update_site_verification_status(
  p_site_id uuid,
  p_status text,
  p_error_message text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE public.sites 
  SET 
    verification_status = p_status,
    verified = (p_status = 'verified'),
    last_verification_attempt = now(),
    verification_attempts = verification_attempts + 1,
    last_ping = CASE WHEN p_status = 'verified' THEN now() ELSE last_ping END
  WHERE id = p_site_id;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- ========================================
-- 5. Fix sync_event_type function
-- ========================================
CREATE OR REPLACE FUNCTION public.sync_event_type()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically set type to match event_type
  IF NEW.type IS NULL OR NEW.type = '' THEN
    NEW.type := NEW.event_type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- ========================================
-- 6. Fix verify_site function (if exists, recreate with secure search_path)
-- ========================================
-- Drop ALL existing verify_site functions regardless of signature
DO $$
DECLARE
  func_oid oid;
BEGIN
  FOR func_oid IN 
    SELECT p.oid 
    FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'verify_site'
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || func_oid::regprocedure || ' CASCADE';
  END LOOP;
END $$;

CREATE FUNCTION public.verify_site(p_site_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.sites 
  SET 
    verified = true,
    verification_status = 'verified',
    last_verification_attempt = now()
  WHERE id = p_site_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ========================================
-- 7. Fix update_api_keys_updated_at function
-- ========================================
CREATE OR REPLACE FUNCTION public.update_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS api_keys_updated_at ON public.api_keys;
CREATE TRIGGER api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_api_keys_updated_at();

-- ========================================
-- 8. Fix update_site_integrations_updated_at function
-- ========================================
CREATE OR REPLACE FUNCTION public.update_site_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- ========================================
-- 9. Fix update_user_settings_updated_at function
-- ========================================
CREATE OR REPLACE FUNCTION public.update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- ========================================
-- 10. Fix create_user_settings_on_signup function
-- ========================================
CREATE OR REPLACE FUNCTION public.create_user_settings_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ========================================
-- Done! All functions now have secure search_path
-- ========================================

COMMENT ON FUNCTION public.generate_pixel_code IS 'Generates unique pixel tracking codes - fixed with secure search_path';
COMMENT ON FUNCTION public.ensure_pixel_code IS 'Trigger function to auto-generate pixel codes - fixed with secure search_path';
COMMENT ON FUNCTION public.cleanup_expired_verifications IS 'Removes expired verification attempts - fixed with secure search_path';
COMMENT ON FUNCTION public.update_site_verification_status IS 'Updates site verification status - fixed with secure search_path';
COMMENT ON FUNCTION public.sync_event_type IS 'Syncs type column with event_type - fixed with secure search_path';
COMMENT ON FUNCTION public.verify_site IS 'Marks a site as verified - fixed with secure search_path';
COMMENT ON FUNCTION public.update_api_keys_updated_at IS 'Updates api_keys timestamp - fixed with secure search_path';
COMMENT ON FUNCTION public.update_site_integrations_updated_at IS 'Updates site_integrations timestamp - fixed with secure search_path';
COMMENT ON FUNCTION public.update_user_settings_updated_at IS 'Updates user_settings timestamp - fixed with secure search_path';
COMMENT ON FUNCTION public.create_user_settings_on_signup IS 'Creates user settings on signup - fixed with secure search_path';
