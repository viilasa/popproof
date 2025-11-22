-- Fix for Google OAuth "Database error saving new user"
-- Run this SQL in your Supabase SQL Editor

-- 1. Create profiles table if it doesn't exist (for storing user metadata)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies (Users can read their own profile)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 4. Create RLS Policy (Users can update their own profile)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- 5. Create RLS Policy (Allow inserts for new users)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 6. Create a trigger to automatically create profile on user signup
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger that runs after user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 8. Also update user_settings table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_settings') THEN
    -- Enable RLS on user_settings
    ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
    
    -- Create policies for user_settings
    DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
    CREATE POLICY "Users can view own settings"
      ON public.user_settings
      FOR SELECT
      USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
    CREATE POLICY "Users can update own settings"
      ON public.user_settings
      FOR UPDATE
      USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
    CREATE POLICY "Users can insert own settings"
      ON public.user_settings
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Success message
SELECT 'Google OAuth database setup completed successfully!' AS message;
