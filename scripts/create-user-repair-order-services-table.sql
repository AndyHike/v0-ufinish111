-- Create user_repair_order_services table for storing services within each order
CREATE TABLE IF NOT EXISTS user_repair_order_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES user_repair_orders(id) ON DELETE CASCADE,
  remonline_order_id BIGINT NOT NULL,
  remonline_service_id BIGINT NOT NULL,
  service_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  warranty_period INTEGER,
  warranty_units TEXT, -- 'days', 'weeks', 'months', 'years'
  service_status TEXT NOT NULL,
  service_status_name TEXT NOT NULL,
  service_status_color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_repair_order_services_order_id ON user_repair_order_services(order_id);
CREATE INDEX IF NOT EXISTS idx_user_repair_order_services_remonline_order_id ON user_repair_order_services(remonline_order_id);
CREATE INDEX IF NOT EXISTS idx_user_repair_order_services_remonline_service_id ON user_repair_order_services(remonline_service_id);
CREATE INDEX IF NOT EXISTS idx_user_repair_order_services_status ON user_repair_order_services(service_status);

-- Add unique constraint to prevent duplicate services
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_repair_order_services_unique 
ON user_repair_order_services(order_id, remonline_service_id);

-- Enable RLS
ALTER TABLE user_repair_order_services ENABLE ROW LEVEL SECURITY;

-- Create policy to allow access to services based on the related order's user
CREATE POLICY "Users can access services for their orders" ON user_repair_order_services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_repair_orders 
      WHERE user_repair_orders.id = user_repair_order_services.order_id 
      AND user_repair_orders.user_id = auth.uid()
    )
  );

-- Add comment to table
COMMENT ON TABLE user_repair_order_services IS 'Stores individual services/items for each repair order from RemOnline';
