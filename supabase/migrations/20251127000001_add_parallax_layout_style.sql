-- Add all layout styles to the layout_style check constraint
ALTER TABLE widgets DROP CONSTRAINT IF EXISTS widgets_layout_style_check;

ALTER TABLE widgets 
ADD CONSTRAINT widgets_layout_style_check 
CHECK (layout_style IN ('card', 'compact', 'minimal', 'full-width', 'ripple', 'parallax', 'puzzle', 'peekaboo', 'floating-tag', 'story-pop', 'frosted-token'));

-- Update comment
COMMENT ON COLUMN widgets.layout_style IS 'Widget layout style (card, compact, minimal, full-width, ripple, parallax, puzzle, peekaboo, floating-tag, story-pop, or frosted-token)';
