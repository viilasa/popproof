-- Migration: Add Dodo Payments Support
-- Description: Adds necessary columns for Dodo Payments integration

-- Add Dodo Payments columns to payment_history table
ALTER TABLE payment_history 
ADD COLUMN IF NOT EXISTS payment_gateway TEXT NOT NULL DEFAULT 'razorpay',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS dodo_session_id TEXT,
ADD COLUMN IF NOT EXISTS dodo_payment_id TEXT,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add Dodo subscription ID to user_subscriptions table
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS dodo_subscription_id TEXT;

-- Add Dodo product ID to subscription_plans table
-- This links your plans to Dodo Payments products
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS dodo_product_id TEXT;

-- Create indexes for faster webhook lookups
CREATE INDEX IF NOT EXISTS idx_payment_history_dodo_session 
ON payment_history(dodo_session_id) WHERE dodo_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_history_dodo_payment 
ON payment_history(dodo_payment_id) WHERE dodo_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_dodo 
ON user_subscriptions(dodo_subscription_id) WHERE dodo_subscription_id IS NOT NULL;

-- Add 'dodo' to payment_gateway if it's an enum or has a check constraint
-- Uncomment and modify based on your actual constraint:

-- If using CHECK constraint:
-- ALTER TABLE payment_history DROP CONSTRAINT IF EXISTS payment_history_gateway_check;
-- ALTER TABLE payment_history ADD CONSTRAINT payment_history_gateway_check 
--   CHECK (payment_gateway IN ('razorpay', 'paypal', 'dodo', 'revenuecat'));

-- Add comment for documentation
COMMENT ON COLUMN payment_history.dodo_session_id IS 'Dodo Payments checkout session ID';
COMMENT ON COLUMN payment_history.dodo_payment_id IS 'Dodo Payments payment ID after completion';
COMMENT ON COLUMN user_subscriptions.dodo_subscription_id IS 'Dodo Payments subscription ID for recurring billing';
COMMENT ON COLUMN subscription_plans.dodo_product_id IS 'Dodo Payments product ID - create products in Dodo dashboard first';
