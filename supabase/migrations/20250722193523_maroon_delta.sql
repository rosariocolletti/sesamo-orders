/*
  # Create orders table

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `delivery_date` (date, not null)
      - `status` (text, not null, check constraint)
      - `notes` (text, nullable)
      - `total` (numeric, not null, >= 0)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `orders` table
    - Add policies for authenticated users to manage orders

  3. Relationships
    - Foreign key constraint to clients table
*/

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  delivery_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered')),
  notes text,
  total numeric(10, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all orders
CREATE POLICY "Users can read orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert orders
CREATE POLICY "Users can insert orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update orders
CREATE POLICY "Users can update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete orders
CREATE POLICY "Users can delete orders"
  ON orders
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);