-- Create repair_order_items table to store individual services/items for each order
CREATE TABLE IF NOT EXISTS repair_order_items (
  id BIGSERIAL PRIMARY KEY,
  remonline_order_id BIGINT NOT NULL,
  remonline_item_id BIGINT NOT NULL,
  service_name TEXT NOT NULL,
  quantity DECIMAL(10,3) DEFAULT 1.000,
  price DECIMAL(10,2) DEFAULT 0.00,
  warranty_period INTEGER,
  warranty_units TEXT, -- 'days', 'weeks', 'months', 'years'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_repair_order_items_remonline_order_id ON repair_order_items(remonline_order_id);
CREATE INDEX IF NOT EXISTS idx_repair_order_items_remonline_item_id ON repair_order_items(remonline_item_id);
CREATE INDEX IF NOT EXISTS idx_repair_order_items_created_at ON repair_order_items(created_at);

-- Add unique constraint to prevent duplicate items
CREATE UNIQUE INDEX IF NOT EXISTS idx_repair_order_items_unique 
ON repair_order_items(remonline_order_id, remonline_item_id);

-- Enable RLS
ALTER TABLE repair_order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own order items" ON repair_order_items
  FOR SELECT USING (
    remonline_order_id IN (
      SELECT remonline_id FROM repair_orders 
      WHERE user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT ON repair_order_items TO authenticated;
GRANT INSERT, UPDATE, DELETE ON repair_order_items TO service_role;
GRANT USAGE ON SEQUENCE repair_order_items_id_seq TO service_role;

-- Add comments
COMMENT ON TABLE repair_order_items IS 'Individual services/items for repair orders from RemOnline';
COMMENT ON COLUMN repair_order_items.remonline_order_id IS 'RemOnline order ID this item belongs to';
COMMENT ON COLUMN repair_order_items.remonline_item_id IS 'RemOnline item ID';
COMMENT ON COLUMN repair_order_items.service_name IS 'Name of the service/item';
COMMENT ON COLUMN repair_order_items.quantity IS 'Quantity of the service';
COMMENT ON COLUMN repair_order_items.price IS 'Price per unit';
COMMENT ON COLUMN repair_order_items.warranty_period IS 'Warranty period number';
COMMENT ON COLUMN repair_order_items.warranty_units IS 'Warranty period units (days, weeks, months, years)';
