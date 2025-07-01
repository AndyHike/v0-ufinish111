-- Create repair_orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS repair_orders (
  id BIGSERIAL PRIMARY KEY,
  remonline_order_id BIGINT UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reference_number TEXT,
  device_brand TEXT,
  device_model TEXT,
  service_type TEXT,
  status_id TEXT,
  status_name TEXT,
  status_color TEXT,
  price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_repair_orders_user_id ON repair_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_repair_orders_remonline_id ON repair_orders(remonline_order_id);
CREATE INDEX IF NOT EXISTS idx_repair_orders_created_at ON repair_orders(created_at);

-- Add RLS (Row Level Security)
ALTER TABLE repair_orders ENABLE ROW LEVEL SECURITY;

-- Create policy to ensure users can only see their own orders
CREATE POLICY "Users can only see their own orders" ON repair_orders
  FOR ALL USING (user_id = auth.uid());
