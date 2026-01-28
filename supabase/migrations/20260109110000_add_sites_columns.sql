-- Add missing columns to sites table
-- Created: 2026-01-09

-- Add public_key column for API authentication
ALTER TABLE public.sites
ADD COLUMN IF NOT EXISTS public_key text;

-- Add is_active column for site status
ALTER TABLE public.sites
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Create unique index on public_key if it has values
CREATE UNIQUE INDEX IF NOT EXISTS idx_sites_public_key_unique
ON public.sites(public_key) 
WHERE public_key IS NOT NULL;

-- Generate public keys for existing sites without one
UPDATE public.sites 
SET public_key = 'sp_' || encode(gen_random_bytes(24), 'hex')
WHERE public_key IS NULL;

SELECT 'Sites table columns updated!' AS result;
