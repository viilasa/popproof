-- Add widget design settings columns (same pattern as notification_rules)
-- These settings control how notifications look on the live site

ALTER TABLE public.widgets
ADD COLUMN IF NOT EXISTS position text DEFAULT 'bottom-left',
ADD COLUMN IF NOT EXISTS offset_x integer DEFAULT 20,
ADD COLUMN IF NOT EXISTS offset_y integer DEFAULT 20,
ADD COLUMN IF NOT EXISTS max_width integer DEFAULT 320,
ADD COLUMN IF NOT EXISTS min_width integer DEFAULT 280,
ADD COLUMN IF NOT EXISTS border_radius integer DEFAULT 12,
ADD COLUMN IF NOT EXISTS border_width integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS border_color text DEFAULT 'rgba(59, 130, 246, 0.2)',
ADD COLUMN IF NOT EXISTS border_left_accent boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS border_left_accent_width integer DEFAULT 4,
ADD COLUMN IF NOT EXISTS border_left_accent_color text DEFAULT '#3B82F6',
ADD COLUMN IF NOT EXISTS shadow_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS shadow_size text DEFAULT 'lg',
ADD COLUMN IF NOT EXISTS glassmorphism boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS backdrop_blur integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS background_color text DEFAULT 'rgba(255, 255, 255, 0.95)',
ADD COLUMN IF NOT EXISTS background_gradient boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS gradient_start text DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS gradient_end text DEFAULT '#f3f4f6',
ADD COLUMN IF NOT EXISTS gradient_direction text DEFAULT 'to-br';

-- Add comment
COMMENT ON COLUMN widgets.position IS 'Widget position: bottom-left, bottom-right, top-left, top-right, center';
COMMENT ON COLUMN widgets.shadow_size IS 'Shadow size: sm, md, lg, xl, 2xl';
COMMENT ON COLUMN widgets.gradient_direction IS 'Gradient direction: to-r, to-l, to-b, to-t, to-br, to-bl';
