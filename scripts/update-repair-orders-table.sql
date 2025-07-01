-- Update repair_orders table to use existing remonline_id column
-- First, check if the table exists and add missing columns if needed

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add device_brand column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'repair_orders' AND column_name = 'device_brand') THEN
        ALTER TABLE repair_orders ADD COLUMN device_brand TEXT;
    END IF;
    
    -- Add device_model column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'repair_orders' AND column_name = 'device_model') THEN
        ALTER TABLE repair_orders ADD COLUMN device_model TEXT;
    END IF;
    
    -- Add service_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'repair_orders' AND column_name = 'service_type') THEN
        ALTER TABLE repair_orders ADD COLUMN service_type TEXT;
    END IF;
    
    -- Add status_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'repair_orders' AND column_name = 'status_id') THEN
        ALTER TABLE repair_orders ADD COLUMN status_id TEXT;
    END IF;
    
    -- Add status_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'repair_orders' AND column_name = 'status_name') THEN
        ALTER TABLE repair_orders ADD COLUMN status_name TEXT;
    END IF;
    
    -- Add status_color column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'repair_orders' AND column_name = 'status_color') THEN
        ALTER TABLE repair_orders ADD COLUMN status_color TEXT;
    END IF;
    
    -- Add reference_number column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'repair_orders' AND column_name = 'reference_number') THEN
        ALTER TABLE repair_orders ADD COLUMN reference_number TEXT;
    END IF;
END $$;

-- Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_repair_orders_user_id ON repair_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_repair_orders_remonline_id ON repair_orders(remonline_id);
CREATE INDEX IF NOT EXISTS idx_repair_orders_created_at ON repair_orders(created_at);

-- Enable RLS if not already enabled
ALTER TABLE repair_orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and create new one
DROP POLICY IF EXISTS "Users can only see their own orders" ON repair_orders;

-- Create policy to ensure users can only see their own orders
CREATE POLICY "Users can only see their own orders" ON repair_orders
  FOR ALL USING (user_id = auth.uid());
