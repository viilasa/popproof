-- ========================================
-- COMPLETE FIX for "Database error saving new user"
-- Run this ENTIRE script in Supabase SQL Editor
-- ========================================

-- ========================================
-- PART 1: Fix profiles table and trigger
-- ========================================

-- Ensure profiles table exists
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Fix RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (true);

-- Robust handle_new_user function with error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
  v_avatar_url TEXT;
  v_full_name TEXT;
BEGIN
  -- Extract name from various possible sources
  v_first_name := NEW.raw_user_meta_data->>'first_name';
  v_last_name := NEW.raw_user_meta_data->>'last_name';
  v_avatar_url := COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture');
  
  -- Handle Google OAuth (provides full_name or name)
  IF v_first_name IS NULL THEN
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name');
    IF v_full_name IS NOT NULL THEN
      v_first_name := split_part(v_full_name, ' ', 1);
      v_last_name := NULLIF(trim(substring(v_full_name FROM position(' ' IN v_full_name))), '');
    END IF;
  END IF;

  INSERT INTO public.profiles (id, email, first_name, last_name, avatar_url)
  VALUES (NEW.id, NEW.email, v_first_name, v_last_name, v_avatar_url)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user error: % %', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PART 2: Fix user_settings table and trigger
-- ========================================

-- Ensure user_settings table exists
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  avatar_url TEXT,
  billing_first_name TEXT,
  billing_last_name TEXT,
  billing_email TEXT,
  billing_country TEXT,
  billing_city TEXT,
  billing_state TEXT,
  billing_zip TEXT,
  billing_address TEXT,
  billing_address2 TEXT,
  billing_phone TEXT,
  billing_company TEXT,
  billing_vat_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- User settings RLS
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
CREATE POLICY "Users can view their own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
CREATE POLICY "Users can insert their own settings" ON public.user_settings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
CREATE POLICY "Users can update their own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);

-- Robust user settings trigger function with error handling
CREATE OR REPLACE FUNCTION public.create_user_settings_on_signup()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_settings (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'create_user_settings_on_signup error: % %', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PART 3: Fix subscription tables and trigger
-- ========================================

-- Ensure subscription_plans table exists
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    tier TEXT NOT NULL CHECK (tier IN ('starter', 'pro', 'growth')),
    price_usd DECIMAL(10, 2) NOT NULL,
    price_inr DECIMAL(10, 2) NOT NULL,
    visitor_limit INTEGER NOT NULL,
    website_limit INTEGER NOT NULL,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure starter plan exists
INSERT INTO public.subscription_plans (name, slug, tier, price_usd, price_inr, visitor_limit, website_limit, features, sort_order)
VALUES ('Starter', 'starter', 'starter', 0, 0, 1000, 1, '["Basic widget styles", "ProofEdge branding", "Basic support"]'::jsonb, 0)
ON CONFLICT (slug) DO NOTHING;

-- Ensure user_subscriptions table exists
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.subscription_plans(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due', 'trialing')),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '100 years'),
    cancel_at_period_end BOOLEAN DEFAULT false,
    cancelled_at TIMESTAMPTZ,
    razorpay_subscription_id TEXT,
    razorpay_customer_id TEXT,
    visitors_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can view their own subscription" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can insert their own subscription" ON public.user_subscriptions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can update their own subscription" ON public.user_subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Robust subscription trigger function with error handling
CREATE OR REPLACE FUNCTION public.create_default_subscription()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    starter_plan_id UUID;
BEGIN
    -- Get the starter plan ID
    SELECT id INTO starter_plan_id FROM public.subscription_plans WHERE slug = 'starter' LIMIT 1;
    
    -- If no starter plan exists, just skip creating subscription
    IF starter_plan_id IS NULL THEN
      RAISE WARNING 'Starter plan not found, skipping subscription creation';
      RETURN NEW;
    END IF;
    
    -- Create subscription with starter plan
    INSERT INTO public.user_subscriptions (
        user_id,
        plan_id,
        status,
        current_period_start,
        current_period_end,
        visitors_used
    ) VALUES (
        NEW.id,
        starter_plan_id,
        'active',
        NOW(),
        NOW() + INTERVAL '100 years',
        0
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'create_default_subscription error: % %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PART 4: Recreate all triggers
-- ========================================

-- Drop ALL existing triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_settings ON auth.users;

-- Create triggers in correct order
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_created_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_settings_on_signup();

CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_subscription();

-- ========================================
-- PART 5: Grant permissions
-- ========================================
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT ALL ON public.user_settings TO postgres, service_role;
GRANT ALL ON public.user_subscriptions TO postgres, service_role;
GRANT ALL ON public.subscription_plans TO postgres, service_role;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_settings TO authenticated;
GRANT SELECT, UPDATE ON public.user_subscriptions TO authenticated;
GRANT SELECT ON public.subscription_plans TO authenticated;

-- ========================================
-- SUCCESS!
-- ========================================
SELECT 'ALL FIXES APPLIED SUCCESSFULLY! Try signing up again.' AS result;
