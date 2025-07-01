-- Create user_repair_orders table for storing order history
CREATE TABLE IF NOT EXISTS user_repair_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  remonline_order_id BIGINT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL,
  creation_date TIMESTAMPTZ NOT NULL,
  device_serial_number TEXT,
  device_name TEXT NOT NULL,
  device_brand TEXT,
  device_model TEXT,
  total_amount DECIMAL(10,2) DEFAULT 0.00,
  overall_status TEXT NOT NULL,
  overall_status_name TEXT NOT NULL,
  overall_status_color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_repair_orders_user_id ON user_repair_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_repair_orders_remonline_id ON user_repair_orders(remonline_order_id);
CREATE INDEX IF NOT EXISTS idx_user_repair_orders_creation_date ON user_repair_orders(creation_date);
CREATE INDEX IF NOT EXISTS idx_user_repair_orders_status ON user_repair_orders(overall_status);

-- Add RLS (Row Level Security)
ALTER TABLE user_repair_orders ENABLE ROW LEVEL SECURITY;

-- Create policy to ensure users can only see their own orders
CREATE POLICY "Users can only see their own repair orders" ON user_repair_orders
  FOR ALL USING (user_id = auth.uid());

-- Add comment to table
COMMENT ON TABLE user_repair_orders IS 'Stores repair order history for users from RemOnline';
