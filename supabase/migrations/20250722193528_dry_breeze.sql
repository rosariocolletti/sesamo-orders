/*
  # Create order_items table

  1. New Tables
    - `order_items`
      - `order_id` (uuid, foreign key to orders)
      - `item_id` (uuid, foreign key to items)
      - `quantity` (integer, not null, > 0)
      - `price` (numeric, not null, >= 0) - price at time of order
      - `created_at` (timestamptz, default now())
      - Primary key: composite (order_id, item_id)

  2. Security
    - Enable RLS on `order_items` table
    - Add policies for authenticated users to manage order items

  3. Relationships
    - Foreign key constraints to orders and items tables
*/

CREATE TABLE IF NOT EXISTS order_items (
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric(10, 2) NOT NULL CHECK (price >= 0),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (order_id, item_id)
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all order items
CREATE POLICY "Users can read order_items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert order items
CREATE POLICY "Users can insert order_items"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update order items
CREATE POLICY "Users can update order_items"
  ON order_items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete order items
CREATE POLICY "Users can delete order_items"
  ON order_items
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_item_id ON order_items(item_id);