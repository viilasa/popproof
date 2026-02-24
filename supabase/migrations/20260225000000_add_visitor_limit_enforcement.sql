-- Function to atomically increment visitors_used for a user
CREATE OR REPLACE FUNCTION increment_visitors_used(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE user_subscriptions
  SET visitors_used = COALESCE(visitors_used, 0) + 1
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset all visitors_used counters (called monthly)
CREATE OR REPLACE FUNCTION reset_monthly_visitors()
RETURNS void AS $$
BEGIN
  UPDATE user_subscriptions SET visitors_used = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule monthly reset using pg_cron (runs on 1st of every month at midnight UTC)
-- Note: pg_cron must be enabled in Supabase dashboard under Database > Extensions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'reset-monthly-visitors',
      '0 0 1 * *',
      'SELECT reset_monthly_visitors()'
    );
  END IF;
END $$;
