-- Enable RLS on event_notifications table
ALTER TABLE event_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert notification impressions (tracked via anon key)
CREATE POLICY "Allow public inserts for notification tracking"
ON event_notifications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy: Users can view notifications for their own sites
CREATE POLICY "Users can view their site notifications"
ON event_notifications
FOR SELECT
TO authenticated
USING (
  site_id IN (
    SELECT id FROM sites WHERE user_id = auth.uid()
  )
);

-- Policy: Users can update their site notifications (for click/close counts)
CREATE POLICY "Users can update their site notifications"
ON event_notifications
FOR UPDATE
TO authenticated
USING (
  site_id IN (
    SELECT id FROM sites WHERE user_id = auth.uid()
  )
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_event_notifications_site_created 
ON event_notifications(site_id, created_at DESC);

COMMENT ON POLICY "Allow public inserts for notification tracking" ON event_notifications 
IS 'Allows anonymous users to track notification impressions via the widget';
