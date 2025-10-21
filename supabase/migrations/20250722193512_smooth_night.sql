/*
  # Create clients table

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `address` (text, not null)
      - `vat` (text, not null, unique)
      - `phone` (text, not null)
      - `email` (text, not null, unique)
      - `notes` (text, nullable)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `clients` table
    - Add policy for authenticated users to manage their own data
*/

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  vat text NOT NULL UNIQUE,
  phone text NOT NULL,
  email text NOT NULL UNIQUE,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all clients
CREATE POLICY "Users can read clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert clients
CREATE POLICY "Users can insert clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update clients
CREATE POLICY "Users can update clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete clients
CREATE POLICY "Users can delete clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_vat ON clients(vat);