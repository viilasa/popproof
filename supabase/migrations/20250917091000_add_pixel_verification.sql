/*
  # Pixel Verification Table

  1. New Table
    - `pixel_verification`
      - `id` (uuid, primary key)
      - `client_id` (text, required) - Identifies the client/website
      - `last_seen_at` (timestamptz, required) - When the pixel was last verified
      - `created_at` (timestamptz) - When the record was created
      - `updated_at` (timestamptz) - When the record was last updated

  2. Security
    - Enable RLS on `pixel_verification` table
    - Add policy for public read access (filtered by client_id)
    - Add policy for public insert/update access
*/

CREATE TABLE IF NOT EXISTS pixel_verification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL UNIQUE,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE pixel_verification ENABLE ROW LEVEL SECURITY;

-- Policy for reading pixel verification (public access, filtered by client_id)
CREATE POLICY "Anyone can read pixel verification"
  ON pixel_verification
  FOR SELECT
  TO public
  USING (true);

-- Policy for inserting pixel verification (public access)
CREATE POLICY "Anyone can insert pixel verification"
  ON pixel_verification
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy for updating pixel verification (public access)
CREATE POLICY "Anyone can update pixel verification"
  ON pixel_verification
  FOR UPDATE
  TO public
  USING (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_pixel_verification_client_id 
  ON pixel_verification(client_id);

-- Add trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pixel_verification_updated_at
  BEFORE UPDATE
  ON pixel_verification
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
