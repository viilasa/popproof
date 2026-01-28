-- Razorpay Payment Integration - Subscription Tables
-- This migration creates tables for subscription plans, user subscriptions, and payment history

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
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

-- Create user subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due', 'trialing')),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false,
    cancelled_at TIMESTAMPTZ,
    razorpay_subscription_id TEXT,
    razorpay_customer_id TEXT,
    visitors_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create payment history table
CREATE TABLE IF NOT EXISTS payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    amount_usd DECIMAL(10, 2) NOT NULL,
    amount_inr DECIMAL(10, 2),
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method TEXT,
    receipt_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert subscription plans based on landing page pricing
INSERT INTO subscription_plans (name, slug, tier, price_usd, price_inr, visitor_limit, website_limit, features, sort_order) VALUES
-- Starter (Free)
('Starter', 'starter', 'starter', 0, 0, 1000, 1, 
 '["Basic widget styles", "ProofEdge branding", "Basic support"]'::jsonb, 0),

-- Pro tiers
('Pro 6K', 'pro-6k', 'pro', 9, 749, 6000, 3,
 '["All widget styles", "Remove branding", "Priority support"]'::jsonb, 1),
('Pro 10K', 'pro-10k', 'pro', 12, 999, 10000, 3,
 '["All widget styles", "Remove branding", "Priority support"]'::jsonb, 2),
('Pro 15K', 'pro-15k', 'pro', 16, 1329, 15000, 3,
 '["All widget styles", "Remove branding", "Priority support"]'::jsonb, 3),
('Pro 25K', 'pro-25k', 'pro', 21, 1749, 25000, 3,
 '["All widget styles", "Remove branding", "Priority support"]'::jsonb, 4),
('Pro 50K', 'pro-50k', 'pro', 36, 2999, 50000, 3,
 '["All widget styles", "Remove branding", "Priority support"]'::jsonb, 5),

-- Growth tiers
('Growth 100K', 'growth-100k', 'growth', 59, 4899, 100000, -1,
 '["All widget styles", "Remove branding", "Dedicated support", "SLA guarantee"]'::jsonb, 6),
('Growth 200K', 'growth-200k', 'growth', 79, 6569, 200000, -1,
 '["All widget styles", "Remove branding", "Dedicated support", "SLA guarantee"]'::jsonb, 7),
('Growth 400K', 'growth-400k', 'growth', 120, 9999, 400000, -1,
 '["All widget styles", "Remove branding", "Dedicated support", "SLA guarantee"]'::jsonb, 8),
('Growth 600K', 'growth-600k', 'growth', 180, 14999, 600000, -1,
 '["All widget styles", "Remove branding", "Dedicated support", "SLA guarantee"]'::jsonb, 9),
('Growth 1M', 'growth-1m', 'growth', 210, 17499, 1000000, -1,
 '["All widget styles", "Remove branding", "Dedicated support", "SLA guarantee"]'::jsonb, 10)
ON CONFLICT (slug) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_razorpay_order_id ON payment_history(razorpay_order_id);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans (public read)
CREATE POLICY "Anyone can view active plans" ON subscription_plans
    FOR SELECT USING (is_active = true);

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscription" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" ON user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for payment_history
CREATE POLICY "Users can view their own payment history" ON payment_history
    FOR SELECT USING (auth.uid() = user_id);

-- Function to get user's current plan with details
CREATE OR REPLACE FUNCTION get_user_subscription(p_user_id UUID)
RETURNS TABLE (
    subscription_id UUID,
    plan_name TEXT,
    plan_slug TEXT,
    tier TEXT,
    price_usd DECIMAL,
    visitor_limit INTEGER,
    website_limit INTEGER,
    visitors_used INTEGER,
    status TEXT,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.id as subscription_id,
        sp.name as plan_name,
        sp.slug as plan_slug,
        sp.tier,
        sp.price_usd,
        sp.visitor_limit,
        sp.website_limit,
        us.visitors_used,
        us.status,
        us.current_period_end,
        us.cancel_at_period_end
    FROM user_subscriptions us
    LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = p_user_id
    AND us.status IN ('active', 'trialing', 'past_due');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default free subscription for new users
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
DECLARE
    starter_plan_id UUID;
BEGIN
    -- Get the starter plan ID
    SELECT id INTO starter_plan_id FROM subscription_plans WHERE slug = 'starter' LIMIT 1;
    
    -- Create subscription with starter plan
    INSERT INTO user_subscriptions (
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
        NOW() + INTERVAL '100 years', -- Free plan never expires
        0
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create subscription for new users
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_subscription();

-- Grant necessary permissions
GRANT SELECT ON subscription_plans TO authenticated;
GRANT SELECT, UPDATE ON user_subscriptions TO authenticated;
GRANT SELECT ON payment_history TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_subscription TO authenticated;
