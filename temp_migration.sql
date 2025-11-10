ALTER TABLE widgets ADD COLUMN IF NOT EXISTS layout_style TEXT DEFAULT 'card' CHECK (layout_style IN ('card', 'compact', 'minimal', 'full-width'));

ALTER TABLE widgets ADD COLUMN IF NOT EXISTS notification_time_range INTEGER DEFAULT 168;
ALTER TABLE widgets ADD COLUMN IF NOT EXISTS custom_time_range_hours INTEGER;

COMMENT ON COLUMN widgets.notification_time_range IS 'Hours to look back for notifications (1, 24, 48, 168, 720, or 0 for custom)';
COMMENT ON COLUMN widgets.custom_time_range_hours IS 'Custom hours when notification_time_range is 0';
