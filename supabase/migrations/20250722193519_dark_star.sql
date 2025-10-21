/*
  # Create items table

  1. New Tables
    - `items`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `category` (text, not null)
      - `price` (numeric, not null, >= 0)
      - `weight` (numeric, not null, >= 0)
      - `picture_url` (text, nullable)
      - `description` (text, nullable)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `items` table
    - Add policies for authenticated users to manage items
*/

CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  price numeric(10, 2) NOT NULL CHECK (price >= 0),
  weight numeric(10, 2) NOT NULL CHECK (weight >= 0),
  picture_url text,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all items
CREATE POLICY "Users can read items"
  ON items
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert items
CREATE POLICY "Users can insert items"
  ON items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update items
CREATE POLICY "Users can update items"
  ON items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete items
CREATE POLICY "Users can delete items"
  ON items
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
CREATE INDEX IF NOT EXISTS idx_items_price ON items(price);