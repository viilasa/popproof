-- =====================================================
-- PAYPAL PAYMENT INTEGRATION - MULTI-GATEWAY SUPPORT
-- Run this in Supabase SQL Editor to add PayPal support
-- =====================================================

-- Add payment gateway column to payment_history table
ALTER TABLE payment_history 
ADD COLUMN IF NOT EXISTS payment_gateway TEXT NOT NULL DEFAULT 'razorpay' 
CHECK (payment_gateway IN ('razorpay', 'paypal'));

-- Add PayPal-specific columns
ALTER TABLE payment_history 
ADD COLUMN IF NOT EXISTS paypal_order_id TEXT,
ADD COLUMN IF NOT EXISTS paypal_payment_id TEXT,
ADD COLUMN IF NOT EXISTS paypal_payer_id TEXT;

-- Update existing records to have razorpay as gateway
UPDATE payment_history 
SET payment_gateway = 'razorpay' 
WHERE payment_gateway IS NULL OR payment_gateway = '';

-- Add PayPal-specific columns to user_subscriptions
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS paypal_payer_id TEXT;

-- Create function to detect user's preferred payment gateway
CREATE OR REPLACE FUNCTION detect_payment_gateway(user_ip TEXT DEFAULT NULL)
RETURNS TEXT AS $$
BEGIN
    -- Default to Razorpay for Indian users, PayPal for international
    -- This is a simple heuristic - you can enhance this based on your needs
    IF user_ip IS NULL THEN
        RETURN 'razorpay'; -- Default
    END IF;
    
    -- Simple country detection (you can use a more sophisticated IP geolocation service)
    -- For now, we'll let the frontend decide based on user selection
    RETURN 'razorpay';
END;
$$ LANGUAGE plpgsql;

-- Create updated payment verification function for multiple gateways
CREATE OR REPLACE FUNCTION verify_payment_and_update_subscription(
    p_gateway TEXT,
    p_payment_data JSONB,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    plan_record RECORD;
    subscription_record RECORD;
    payment_record RECORD;
    plan_id UUID;
    plan_slug TEXT;
BEGIN
    -- Extract plan information from payment data
    CASE p_gateway
        WHEN 'razorpay' THEN
            SELECT plan_id, plan_slug INTO plan_id, plan_slug
            FROM payment_history
            WHERE razorpay_order_id = (p_payment_data->>'razorpay_order_id')::TEXT
            AND user_id = p_user_id;
            
        WHEN 'paypal' THEN
            SELECT plan_id, plan_slug INTO plan_id, plan_slug
            FROM payment_history
            WHERE paypal_order_id = (p_payment_data->>'paypal_order_id')::TEXT
            AND user_id = p_user_id;
    END CASE;
    
    IF plan_id IS NULL THEN
        RAISE EXCEPTION 'Payment record not found';
    END IF;
    
    -- Get plan details
    SELECT * INTO plan_record
    FROM subscription_plans
    WHERE id = plan_id;
    
    -- Update or create subscription
    SELECT * INTO subscription_record
    FROM user_subscriptions
    WHERE user_id = p_user_id;
    
    IF subscription_record.id IS NOT NULL THEN
        -- Update existing subscription
        UPDATE user_subscriptions SET
            plan_id = plan_id,
            status = 'active',
            current_period_start = NOW(),
            current_period_end = NOW() + INTERVAL '1 month',
            cancel_at_period_end = false,
            cancelled_at = NULL,
            visitors_used = 0,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    ELSE
        -- Create new subscription
        INSERT INTO user_subscriptions (
            user_id, plan_id, status, current_period_start, current_period_end
        ) VALUES (
            p_user_id, plan_id, 'active', NOW(), NOW() + INTERVAL '1 month'
        );
    END IF;
    
    -- Update payment record
    CASE p_gateway
        WHEN 'razorpay' THEN
            UPDATE payment_history SET
                razorpay_payment_id = p_payment_data->>'razorpay_payment_id',
                razorpay_signature = p_payment_data->>'razorpay_signature',
                status = 'completed',
                updated_at = NOW()
            WHERE razorpay_order_id = p_payment_data->>'razorpay_order_id'
            AND user_id = p_user_id;
            
        WHEN 'paypal' THEN
            UPDATE payment_history SET
                paypal_payment_id = p_payment_data->>'paypal_payment_id',
                paypal_payer_id = p_payment_data->>'paypal_payer_id',
                status = 'completed',
                updated_at = NOW()
            WHERE paypal_order_id = p_payment_data->>'paypal_order_id'
            AND user_id = p_user_id;
    END CASE;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_history_gateway ON payment_history(payment_gateway);
CREATE INDEX IF NOT EXISTS idx_payment_history_paypal_order ON payment_history(paypal_order_id) WHERE paypal_order_id IS NOT NULL;

COMMENT ON TABLE payment_history IS 'Payment history supporting multiple gateways (Razorpay, PayPal)';
COMMENT ON COLUMN payment_history.payment_gateway IS 'Payment gateway used: razorpay or paypal';
COMMENT ON COLUMN payment_history.paypal_order_id IS 'PayPal order ID for PayPal transactions';
COMMENT ON COLUMN payment_history.paypal_payment_id IS 'PayPal payment ID for PayPal transactions';
COMMENT ON COLUMN payment_history.paypal_payer_id IS 'PayPal payer ID for PayPal transactions';
