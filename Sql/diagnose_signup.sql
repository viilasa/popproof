-- ========================================
-- DIAGNOSE AND FIX USER SIGNUP ISSUE
-- Run this in Supabase SQL Editor
-- ========================================

-- Step 1: Check if profiles table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'profiles'
) as profiles_table_exists;

-- Step 2: Check profiles table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Step 3: Check if handle_new_user function exists
SELECT proname, prosecdef, proconfig 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Step 4: Check if the trigger exists on auth.users
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth' 
AND event_object_table = 'users';

-- Step 5: Check the current handle_new_user function definition
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'handle_new_user';
