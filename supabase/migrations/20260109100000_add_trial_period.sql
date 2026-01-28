-- ========================================
-- Add Trial Period Support
-- Created: 2026-01-09
-- ========================================
-- This migration adds trial period support to the subscription system

-- 1. Add trial_ends_at column to user_subscriptions
ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- 2. Add trial_started_at column
ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ;

-- 3. Update status check constraint to include 'trialing'
-- First drop the old constraint if it exists
ALTER TABLE public.user_subscriptions 
DROP CONSTRAINT IF EXISTS user_subscriptions_status_check;

-- Add new constraint with trialing status
ALTER TABLE public.user_subscriptions
ADD CONSTRAINT user_subscriptions_status_check 
CHECK (status IN ('active', 'cancelled', 'expired', 'past_due', 'trialing'));

-- 4. Update the create_default_subscription function to start with trial
CREATE OR REPLACE FUNCTION public.create_default_subscription()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    starter_plan_id UUID;
    trial_end_date TIMESTAMPTZ;
BEGIN
    -- Get the starter plan ID
    SELECT id INTO starter_plan_id FROM public.subscription_plans WHERE slug = 'starter' LIMIT 1;
    
    -- Calculate trial end date (14 days from now)
    trial_end_date := NOW() + INTERVAL '14 days';
    
    -- If no starter plan exists, just skip creating subscription
    IF starter_plan_id IS NULL THEN
      RAISE WARNING 'Starter plan not found, skipping subscription creation';
      RETURN NEW;
    END IF;
    
    -- Create subscription with trial status
    INSERT INTO public.user_subscriptions (
        user_id,
        plan_id,
        status,
        current_period_start,
        current_period_end,
        trial_started_at,
        trial_ends_at,
        visitors_used
    ) VALUES (
        NEW.id,
        starter_plan_id,
        'trialing',  -- Start as trialing instead of active
        NOW(),
        trial_end_date,
        NOW(),
        trial_end_date,
        0
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'create_default_subscription error: % %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create function to check and expire trials
CREATE OR REPLACE FUNCTION public.check_expired_trials()
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update all expired trials to 'expired' status
  UPDATE public.user_subscriptions
  SET status = 'expired',
      updated_at = NOW()
  WHERE status = 'trialing'
    AND trial_ends_at IS NOT NULL
    AND trial_ends_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 6. Update existing starter subscriptions to trialing (for testing)
-- Only update subscriptions created in the last 14 days
UPDATE public.user_subscriptions
SET 
    status = 'trialing',
    trial_started_at = created_at,
    trial_ends_at = created_at + INTERVAL '14 days'
WHERE status = 'active'
  AND plan_id = (SELECT id FROM public.subscription_plans WHERE slug = 'starter' LIMIT 1)
  AND created_at > NOW() - INTERVAL '14 days';

-- 7. Grant execute permission on new function
GRANT EXECUTE ON FUNCTION public.check_expired_trials TO authenticated, service_role;

-- Success message
SELECT 'Trial period support added successfully!' AS result;
