-- Create repair_order_items table to store individual services/items for each order
CREATE TABLE IF NOT EXISTS repair_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  remonline_order_id BIGINT NOT NULL,
  remonline_item_id BIGINT NOT NULL,
  service_name TEXT NOT NULL,
  quantity DECIMAL(10,3) DEFAULT 1.000,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  warranty_period INTEGER,
  warranty_units TEXT, -- 'days', 'weeks', 'months', 'years'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_repair_order_items_order_id ON repair_order_items(remonline_order_id);
CREATE INDEX IF NOT EXISTS idx_repair_order_items_item_id ON repair_order_items(remonline_item_id);
CREATE INDEX IF NOT EXISTS idx_repair_order_items_created_at ON repair_order_items(created_at);

-- Add unique constraint to prevent duplicate items
CREATE UNIQUE INDEX IF NOT EXISTS idx_repair_order_items_unique 
ON repair_order_items(remonline_order_id, remonline_item_id);

-- Enable RLS
ALTER TABLE repair_order_items ENABLE ROW LEVEL SECURITY;

-- Create policy to allow access to order items based on the related order's user
CREATE POLICY "Users can access items for their orders" ON repair_order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM repair_orders 
      WHERE repair_orders.remonline_id = repair_order_items.remonline_order_id 
      AND repair_orders.user_id = auth.uid()
    )
  );

-- Add comment to table
COMMENT ON TABLE repair_order_items IS 'Stores individual services/items for each repair order from RemOnline';
