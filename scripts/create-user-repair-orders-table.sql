-- Create user_repair_orders table
CREATE TABLE IF NOT EXISTS user_repair_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    remonline_order_id INTEGER NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id TEXT NOT NULL,
    creation_date TIMESTAMP WITH TIME ZONE NOT NULL,
    device_serial_number TEXT,
    device_name TEXT NOT NULL,
    device_brand TEXT,
    device_model TEXT,
    total_amount DECIMAL(10,2) DEFAULT 0,
    overall_status TEXT NOT NULL DEFAULT 'unknown',
    overall_status_name TEXT NOT NULL DEFAULT 'Невідомо',
    overall_status_color TEXT NOT NULL DEFAULT 'bg-gray-100 text-gray-800',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_repair_orders_user_id ON user_repair_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_repair_orders_remonline_id ON user_repair_orders(remonline_order_id);
CREATE INDEX IF NOT EXISTS idx_user_repair_orders_creation_date ON user_repair_orders(creation_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_repair_orders_status ON user_repair_orders(overall_status);

-- Enable Row Level Security
ALTER TABLE user_repair_orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own repair orders" ON user_repair_orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own repair orders" ON user_repair_orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own repair orders" ON user_repair_orders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all repair orders" ON user_repair_orders
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Add comments
COMMENT ON TABLE user_repair_orders IS 'Stores repair orders for users from RemOnline';
COMMENT ON COLUMN user_repair_orders.remonline_order_id IS 'Unique order ID from RemOnline system';
COMMENT ON COLUMN user_repair_orders.document_id IS 'Human-readable order document ID';
COMMENT ON COLUMN user_repair_orders.device_serial_number IS 'Serial number of the device being repaired';
COMMENT ON COLUMN user_repair_orders.total_amount IS 'Total amount for all services in the order';
COMMENT ON COLUMN user_repair_orders.overall_status IS 'Current status of the order';
COMMENT ON COLUMN user_repair_orders.overall_status_name IS 'Human-readable status name';
COMMENT ON COLUMN user_repair_orders.overall_status_color IS 'CSS classes for status badge color';
