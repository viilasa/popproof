-- Add design columns to widgets table if they don't exist
DO $$ 
BEGIN
    -- Position
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='widgets' AND column_name='position') THEN
        ALTER TABLE public.widgets ADD COLUMN position text DEFAULT 'bottom-left';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='widgets' AND column_name='offset_x') THEN
        ALTER TABLE public.widgets ADD COLUMN offset_x integer DEFAULT 20;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='widgets' AND column_name='offset_y') THEN
        ALTER TABLE public.widgets ADD COLUMN offset_y integer DEFAULT 20;
    END IF;
    
    -- Layout
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='widgets' AND column_name='max_width') THEN
        ALTER TABLE public.widgets ADD COLUMN max_width integer DEFAULT 320;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='widgets' AND column_name='min_width') THEN
        ALTER TABLE public.widgets ADD COLUMN min_width integer DEFAULT 280;
    END IF;
    
    -- Border
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='widgets' AND column_name='border_radius') THEN
        ALTER TABLE public.widgets ADD COLUMN border_radius integer DEFAULT 12;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='widgets' AND column_name='border_width') THEN
        ALTER TABLE public.widgets ADD COLUMN border_width integer DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='widgets' AND column_name='border_color') THEN
        ALTER TABLE public.widgets ADD COLUMN border_color text DEFAULT 'rgba(59, 130, 246, 0.2)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='widgets' AND column_name='border_left_accent') THEN
        ALTER TABLE public.widgets ADD COLUMN border_left_accent boolean DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='widgets' AND column_name='border_left_accent_width') THEN
        ALTER TABLE public.widgets ADD COLUMN border_left_accent_width integer DEFAULT 4;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='widgets' AND column_name='border_left_accent_color') THEN
        ALTER TABLE public.widgets ADD COLUMN border_left_accent_color text DEFAULT '#3B82F6';
    END IF;
    
    -- Shadow
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='widgets' AND column_name='shadow_enabled') THEN
        ALTER TABLE public.widgets ADD COLUMN shadow_enabled boolean DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='widgets' AND column_name='shadow_size') THEN
        ALTER TABLE public.widgets ADD COLUMN shadow_size text DEFAULT 'lg';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='widgets' AND column_name='glassmorphism') THEN
        ALTER TABLE public.widgets ADD COLUMN glassmorphism boolean DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='widgets' AND column_name='backdrop_blur') THEN
        ALTER TABLE public.widgets ADD COLUMN backdrop_blur integer DEFAULT 10;
    END IF;
    
    -- Background
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='widgets' AND column_name='background_color') THEN
        ALTER TABLE public.widgets ADD COLUMN background_color text DEFAULT 'rgba(255, 255, 255, 0.95)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='widgets' AND column_name='background_gradient') THEN
        ALTER TABLE public.widgets ADD COLUMN background_gradient boolean DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='widgets' AND column_name='gradient_start') THEN
        ALTER TABLE public.widgets ADD COLUMN gradient_start text DEFAULT '#ffffff';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='widgets' AND column_name='gradient_end') THEN
        ALTER TABLE public.widgets ADD COLUMN gradient_end text DEFAULT '#f3f4f6';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='widgets' AND column_name='gradient_direction') THEN
        ALTER TABLE public.widgets ADD COLUMN gradient_direction text DEFAULT 'to-br';
    END IF;
END $$;

-- Verify columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'widgets' 
AND column_name IN (
    'position', 'offset_x', 'offset_y', 'max_width', 'min_width',
    'border_radius', 'border_width', 'border_color', 'border_left_accent',
    'border_left_accent_width', 'border_left_accent_color',
    'shadow_enabled', 'shadow_size', 'glassmorphism', 'backdrop_blur',
    'background_color', 'background_gradient', 'gradient_start', 'gradient_end', 'gradient_direction'
)
ORDER BY ordinal_position;
