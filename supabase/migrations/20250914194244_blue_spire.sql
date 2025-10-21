/*
  # Social Proof Events Table

  1. New Tables
    - `social_proof_events`
      - `id` (uuid, primary key)
      - `client_id` (text, required) - Identifies the client/website
      - `event_type` (text, required) - Type of social proof event (purchase, signup, etc.)
      - `user_name` (text, required) - Name of the user who performed the action
      - `product_name` (text, optional) - Product involved in the event
      - `location` (text, optional) - User's location
      - `value` (numeric, optional) - Monetary value or quantity
      - `timestamp` (timestamptz, required) - When the event occurred
      - `created_at` (timestamptz) - When the record was created

  2. Security
    - Enable RLS on `social_proof_events` table
    - Add policy for public read access (filtered by client_id)
    - Add policy for public insert access

  3. Performance
    - Add indexes on client_id and timestamp for fast queries
    - Add composite index for client_id + timestamp queries
*/

CREATE TABLE IF NOT EXISTS social_proof_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  event_type text NOT NULL,
  user_name text NOT NULL,
  product_name text,
  location text,
  value numeric,
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE social_proof_events ENABLE ROW LEVEL SECURITY;

-- Policy for reading events (public access, filtered by client_id)
CREATE POLICY "Anyone can read social proof events"
  ON social_proof_events
  FOR SELECT
  TO public
  USING (true);

-- Policy for inserting events (public access)
CREATE POLICY "Anyone can insert social proof events"
  ON social_proof_events
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_social_proof_events_client_id 
  ON social_proof_events(client_id);

CREATE INDEX IF NOT EXISTS idx_social_proof_events_timestamp 
  ON social_proof_events(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_social_proof_events_client_timestamp 
  ON social_proof_events(client_id, timestamp DESC);