-- Dodo Payments is the only gateway now. Remove Razorpay/PayPal leftovers.
-- NOTE: this drops historical Razorpay/PayPal IDs. Existing payment rows are kept.

-- 1. Allow 'dodo' as gateway (old CHECK only allowed razorpay/paypal)
ALTER TABLE payment_history DROP CONSTRAINT IF EXISTS payment_history_payment_gateway_check;
UPDATE payment_history SET payment_gateway = 'dodo' WHERE payment_gateway IS NULL OR payment_gateway = '';
ALTER TABLE payment_history ALTER COLUMN payment_gateway SET DEFAULT 'dodo';
ALTER TABLE payment_history
  ADD CONSTRAINT payment_history_payment_gateway_check
  CHECK (payment_gateway IN ('dodo', 'razorpay', 'paypal'));  -- old values kept so historical rows stay valid

-- 2. Drop PayPal / Razorpay helper functions
DROP FUNCTION IF EXISTS detect_payment_gateway(TEXT);
DROP FUNCTION IF EXISTS verify_payment_and_update_subscription(TEXT, JSONB, UUID);

-- 3. Drop unused columns
DROP INDEX IF EXISTS idx_payment_history_razorpay_order_id;

ALTER TABLE payment_history
  DROP COLUMN IF EXISTS razorpay_order_id,
  DROP COLUMN IF EXISTS razorpay_payment_id,
  DROP COLUMN IF EXISTS razorpay_signature,
  DROP COLUMN IF EXISTS paypal_order_id,
  DROP COLUMN IF EXISTS paypal_payment_id,
  DROP COLUMN IF EXISTS paypal_payer_id;

ALTER TABLE user_subscriptions
  DROP COLUMN IF EXISTS razorpay_subscription_id,
  DROP COLUMN IF EXISTS razorpay_customer_id,
  DROP COLUMN IF EXISTS paypal_subscription_id,
  DROP COLUMN IF EXISTS paypal_payer_id;
