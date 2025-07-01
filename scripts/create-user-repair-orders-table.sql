-- Create user_repair_orders table
CREATE TABLE IF NOT EXISTS user_repair_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    remonline_order_id INTEGER UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id VARCHAR(255) NOT NULL,
    creation_date TIMESTAMP WITH TIME ZONE NOT NULL,
    device_serial_number VARCHAR(255),
    device_name VARCHAR(255) NOT NULL,
    device_brand VARCHAR(255),
    device_model VARCHAR(255),
    total_amount DECIMAL(10,2),
    overall_status VARCHAR(100) NOT NULL,
    overall_status_name VARCHAR(255),
    overall_status_color VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_repair_orders_user_id ON user_repair_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_repair_orders_remonline_id ON user_repair_orders(remonline_order_id);
CREATE INDEX IF NOT EXISTS idx_user_repair_orders_creation_date ON user_repair_orders(creation_date);
CREATE INDEX IF NOT EXISTS idx_user_repair_orders_status ON user_repair_orders(overall_status);

-- Add RLS policies
ALTER TABLE user_repair_orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own orders
CREATE POLICY "Users can view their own repair orders" ON user_repair_orders
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own orders (for webhook processing)
CREATE POLICY "System can insert orders" ON user_repair_orders
    FOR INSERT WITH CHECK (true);

-- Policy: System can update orders
CREATE POLICY "System can update orders" ON user_repair_orders
    FOR UPDATE USING (true);

-- Policy: System can delete orders
CREATE POLICY "System can delete orders" ON user_repair_orders
    FOR DELETE USING (true);

-- Policy: Service can insert/update orders
CREATE POLICY "Service can manage repair orders" ON user_repair_orders
    FOR ALL USING (true);
