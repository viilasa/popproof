-- ========================================
-- APPLY TRIAL PERIOD SUPPORT
-- Run this in Supabase SQL Editor
-- ========================================

-- 1. Add trial columns (safe to run multiple times)
ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ;

-- 2. Update status constraint
ALTER TABLE public.user_subscriptions 
DROP CONSTRAINT IF EXISTS user_subscriptions_status_check;

ALTER TABLE public.user_subscriptions
ADD CONSTRAINT user_subscriptions_status_check 
CHECK (status IN ('active', 'cancelled', 'expired', 'past_due', 'trialing'));

-- 3. Update the subscription creation function for new users
CREATE OR REPLACE FUNCTION public.create_default_subscription()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    starter_plan_id UUID;
    trial_end_date TIMESTAMPTZ;
BEGIN
    SELECT id INTO starter_plan_id FROM public.subscription_plans WHERE slug = 'starter' LIMIT 1;
    trial_end_date := NOW() + INTERVAL '14 days';
    
    IF starter_plan_id IS NULL THEN
      RAISE WARNING 'Starter plan not found';
      RETURN NEW;
    END IF;
    
    INSERT INTO public.user_subscriptions (
        user_id, plan_id, status, current_period_start, current_period_end,
        trial_started_at, trial_ends_at, visitors_used
    ) VALUES (
        NEW.id, starter_plan_id, 'trialing', NOW(), trial_end_date,
        NOW(), trial_end_date, 0
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'create_default_subscription error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Update EXISTING users to have trial status (recent signups only)
UPDATE public.user_subscriptions
SET 
    status = 'trialing',
    trial_started_at = created_at,
    trial_ends_at = created_at + INTERVAL '14 days'
WHERE status = 'active'
  AND plan_id = (SELECT id FROM public.subscription_plans WHERE slug = 'starter' LIMIT 1)
  AND created_at > NOW() - INTERVAL '14 days'
  AND trial_ends_at IS NULL;

-- 5. Verify
SELECT 
  status, 
  trial_started_at, 
  trial_ends_at,
  EXTRACT(DAY FROM (trial_ends_at - NOW())) as days_left
FROM public.user_subscriptions
LIMIT 5;

SELECT 'Trial period support enabled!' AS result;
