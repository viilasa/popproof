-- Add layout_style column to widgets table
ALTER TABLE widgets 
ADD COLUMN IF NOT EXISTS layout_style TEXT DEFAULT 'card' CHECK (layout_style IN ('card', 'compact', 'minimal', 'full-width'));

-- Add comment
COMMENT ON COLUMN widgets.layout_style IS 'Widget layout style (card, compact, minimal, or full-width)';
