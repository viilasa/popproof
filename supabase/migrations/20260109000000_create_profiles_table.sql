-- ========================================
-- Fix Profiles Table and Trigger
-- Created: 2026-01-09
-- ========================================
-- This migration ensures the profiles table exists and the 
-- handle_new_user trigger is properly set up.

-- ========================================
-- 1. Create the profiles table (if not exists)
-- ========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text,
  first_name text,
  last_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ========================================
-- 2. Enable RLS
-- ========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 3. Drop existing policies (to make this idempotent)
-- ========================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for service role" ON public.profiles;

-- ========================================
-- 4. Create RLS Policies
-- ========================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow inserting via trigger (service role)
CREATE POLICY "Enable insert for service role"
  ON public.profiles
  FOR INSERT
  WITH CHECK (true);

-- ========================================
-- 5. Create updated_at trigger
-- ========================================
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- 5. Ensure the handle_new_user trigger exists
-- ========================================
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- 6. Create indexes for performance
-- ========================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

COMMENT ON TABLE public.profiles IS 'User profile information, created automatically on signup';
