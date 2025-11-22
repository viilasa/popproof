-- Create api_keys table for per-user API keys (used by WooCommerce integration, EventAnalytics, etc.)

CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  public_key text NOT NULL UNIQUE,
  domain text,
  is_active boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  last_used timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_public_key ON public.api_keys(public_key);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON public.api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_domain ON public.api_keys(domain);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Policies: users can manage their own API keys
CREATE POLICY "Users can view their api keys"
  ON public.api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their api keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their api keys"
  ON public.api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their api keys"
  ON public.api_keys FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.api_keys IS 'Per-user API keys used for server-side integrations (WooCommerce, webhooks, etc.)';
COMMENT ON COLUMN public.api_keys.public_key IS 'The actual API key value presented to the user/app';
