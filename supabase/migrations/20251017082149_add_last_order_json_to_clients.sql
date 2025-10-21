/*
  # Add last_order_json field to clients table

  1. Changes
    - Add `last_order_json` column to `clients` table to store the last order data
    - Column type is JSONB for efficient storage of structured order data
    - Column is nullable as existing clients won't have a last order initially
    
  2. Purpose
    - Enables "Duplicate Last Order" feature for clients
    - Stores complete order item information for easy reordering
    - Updated automatically whenever a client creates a new order
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'last_order_json'
  ) THEN
    ALTER TABLE clients ADD COLUMN last_order_json JSONB;
  END IF;
END $$;
