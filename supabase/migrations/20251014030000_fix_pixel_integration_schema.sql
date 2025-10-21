-- Fix Pixel Integration Database Schema
-- This migration adds missing columns and relationships for proper pixel integration

-- 1. Add site_id column to widgets table
ALTER TABLE public.widgets 
ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES public.sites(id) ON DELETE CASCADE;

-- 2. Add pixel_code column to sites table for unique pixel tracking
ALTER TABLE public.sites 
ADD COLUMN IF NOT EXISTS pixel_code text UNIQUE,
ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
ADD COLUMN IF NOT EXISTS verification_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_verification_attempt timestamp with time zone;

-- 3. Create pixel_verifications table for tracking verification attempts
CREATE TABLE IF NOT EXISTS public.pixel_verifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  verification_token text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'timeout')),
  user_agent text,
  ip_address text,
  referrer text,
  error_message text,
  verified_at timestamp with time zone,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pixel_verifications_pkey PRIMARY KEY (id)
);

-- 4. Create session_tracking table for event grouping
CREATE TABLE IF NOT EXISTS public.session_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  user_agent text,
  ip_address text,
  referrer text,
  first_seen timestamp with time zone DEFAULT now(),
  last_seen timestamp with time zone DEFAULT now(),
  page_views integer DEFAULT 1,
  events_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  CONSTRAINT session_tracking_pkey PRIMARY KEY (id),
  CONSTRAINT unique_site_session UNIQUE (site_id, session_id)
);

-- 5. Update events table to include session tracking
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS session_tracking_id uuid REFERENCES public.session_tracking(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS event_data jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS user_agent text,
ADD COLUMN IF NOT EXISTS ip_address text;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_widgets_site_id ON public.widgets(site_id);
CREATE INDEX IF NOT EXISTS idx_sites_pixel_code ON public.sites(pixel_code) WHERE pixel_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sites_verification_status ON public.sites(verification_status);
CREATE INDEX IF NOT EXISTS idx_pixel_verifications_site_id ON public.pixel_verifications(site_id);
CREATE INDEX IF NOT EXISTS idx_pixel_verifications_token ON public.pixel_verifications(verification_token);
CREATE INDEX IF NOT EXISTS idx_pixel_verifications_expires ON public.pixel_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_session_tracking_site_id ON public.session_tracking(site_id);
CREATE INDEX IF NOT EXISTS idx_session_tracking_session_id ON public.session_tracking(session_id);
CREATE INDEX IF NOT EXISTS idx_session_tracking_active ON public.session_tracking(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_events_session_tracking ON public.events(session_tracking_id);
CREATE INDEX IF NOT EXISTS idx_events_site_timestamp ON public.events(site_id, created_at DESC);

-- 7. Create function to generate unique pixel codes
CREATE OR REPLACE FUNCTION generate_pixel_code()
RETURNS text AS $$
BEGIN
  RETURN 'px_' || encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- 8. Create function to auto-generate pixel codes for existing sites
CREATE OR REPLACE FUNCTION ensure_pixel_code()
RETURNS trigger AS $$
BEGIN
  IF NEW.pixel_code IS NULL THEN
    NEW.pixel_code := generate_pixel_code();
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM sites WHERE pixel_code = NEW.pixel_code) LOOP
      NEW.pixel_code := generate_pixel_code();
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger to auto-generate pixel codes
DROP TRIGGER IF EXISTS ensure_pixel_code_trigger ON public.sites;
CREATE TRIGGER ensure_pixel_code_trigger
  BEFORE INSERT OR UPDATE ON public.sites
  FOR EACH ROW
  EXECUTE FUNCTION ensure_pixel_code();

-- 10. Generate pixel codes for existing sites
UPDATE public.sites 
SET pixel_code = generate_pixel_code() 
WHERE pixel_code IS NULL;

-- 11. Enable RLS on new tables
ALTER TABLE public.pixel_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_tracking ENABLE ROW LEVEL SECURITY;

-- 12. Create RLS policies for pixel_verifications
CREATE POLICY "Users can view their site verifications"
  ON public.pixel_verifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = pixel_verifications.site_id
      AND sites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert verifications for their sites"
  ON public.pixel_verifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = pixel_verifications.site_id
      AND sites.user_id = auth.uid()
    )
  );

-- 13. Create RLS policies for session_tracking
CREATE POLICY "Users can view their site sessions"
  ON public.session_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sites
      WHERE sites.id = session_tracking.site_id
      AND sites.user_id = auth.uid()
    )
  );

-- 14. Note about widget_type enum
-- If you need to add 'notification' to widget_type enum, run RUN_THIS_FIRST.sql separately
-- Enum values must be committed before they can be used in the same migration

-- 15. Insert test data for existing site
DO $$
DECLARE
  test_site_id uuid := '1808e26c-e195-4fcf-8eb1-95a4be718b39';
  test_user_id uuid;
  valid_widget_type text;
BEGIN
  -- Get first user or create a placeholder
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  -- Get the first available widget type (don't try to use newly added enum values)
  -- Skip 'notification' if it was just added in this migration
  SELECT enumlabel INTO valid_widget_type 
  FROM pg_enum 
  WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'widget_type')
  AND enumlabel != 'notification' -- Skip the newly added one
  ORDER BY enumsortorder
  LIMIT 1;
  
  -- If no other widget type exists, we'll skip widget creation
  IF valid_widget_type IS NULL THEN
    RAISE NOTICE 'No existing widget types found. Skipping test widget creation.';
  END IF;
  
  -- Insert or update the test site
  INSERT INTO public.sites (id, user_id, name, public_key, domain, pixel_code, verified, verification_status)
  VALUES (
    test_site_id,
    COALESCE(test_user_id, '00000000-0000-0000-0000-000000000000'::uuid),
    'Test Site',
    'pk_test_' || encode(gen_random_bytes(16), 'hex'),
    'test.example.com',
    'px_test_1808e26ce1954fcf8eb195a4be718b39',
    true,
    'verified'
  )
  ON CONFLICT (id) DO UPDATE SET
    public_key = COALESCE(sites.public_key, 'pk_test_' || encode(gen_random_bytes(16), 'hex')),
    pixel_code = COALESCE(sites.pixel_code, EXCLUDED.pixel_code),
    verification_status = 'verified',
    verified = true;
    
  -- Insert test widget only if we have a valid widget type
  IF valid_widget_type IS NOT NULL THEN
    EXECUTE format('
      INSERT INTO public.widgets (user_id, site_id, name, type, config, is_active)
      VALUES (
        %L,
        %L,
        %L,
        %L::%I,
        %L::jsonb,
        %L
      )
      ON CONFLICT DO NOTHING',
      COALESCE(test_user_id, '00000000-0000-0000-0000-000000000000'::uuid),
      test_site_id,
      'Test Social Proof Widget',
      valid_widget_type,
      'widget_type',
      '{
        "position": "bottom-left",
        "displayDuration": 5000,
        "delayBetween": 8000,
        "showRecent": true,
        "recentTimeframe": 24,
        "animation": "slide",
        "theme": {
          "backgroundColor": "#ffffff",
          "textColor": "#333333",
          "accentColor": "#06b6d4"
        }
      }',
      true
    );
  END IF;
  
  RAISE NOTICE 'Using widget type: %', COALESCE(valid_widget_type, 'NONE FOUND');
END $$;

-- 16. Create cleanup function for expired verifications
CREATE OR REPLACE FUNCTION cleanup_expired_verifications()
RETURNS void AS $$
BEGIN
  DELETE FROM public.pixel_verifications 
  WHERE expires_at < now() AND status = 'pending';
END;
$$ LANGUAGE plpgsql;

-- 17. Create function to update site verification status
CREATE OR REPLACE FUNCTION update_site_verification_status(
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
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.pixel_verifications IS 'Tracks pixel verification attempts and results';
COMMENT ON TABLE public.session_tracking IS 'Groups events by user sessions for analytics';
COMMENT ON FUNCTION generate_pixel_code() IS 'Generates unique pixel tracking codes';
COMMENT ON FUNCTION cleanup_expired_verifications() IS 'Removes expired verification attempts';
COMMENT ON FUNCTION update_site_verification_status(uuid, text, text) IS 'Updates site verification status and metadata';
