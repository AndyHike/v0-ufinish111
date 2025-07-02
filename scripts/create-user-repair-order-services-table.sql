-- Create user_repair_order_services table
CREATE TABLE IF NOT EXISTS user_repair_order_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES user_repair_orders(id) ON DELETE CASCADE,
    remonline_order_id INTEGER NOT NULL,
    remonline_service_id INTEGER,
    service_name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    warranty_period INTEGER,
    warranty_units VARCHAR(50),
    service_status VARCHAR(100) DEFAULT 'active',
    service_status_name VARCHAR(255) DEFAULT 'Активна',
    service_status_color VARCHAR(255) DEFAULT 'bg-blue-100 text-blue-800',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_repair_order_services_order_id ON user_repair_order_services(order_id);
CREATE INDEX IF NOT EXISTS idx_user_repair_order_services_remonline_order_id ON user_repair_order_services(remonline_order_id);
CREATE INDEX IF NOT EXISTS idx_user_repair_order_services_remonline_service_id ON user_repair_order_services(remonline_service_id);

-- Add RLS policies
ALTER TABLE user_repair_order_services ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see services for their own orders
CREATE POLICY "Users can view own order services" ON user_repair_order_services
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_repair_orders 
            WHERE user_repair_orders.id = user_repair_order_services.order_id 
            AND user_repair_orders.user_id = auth.uid()
        )
    );

-- Policy: System can insert services
CREATE POLICY "System can insert order services" ON user_repair_order_services
    FOR INSERT WITH CHECK (true);

-- Policy: System can update services
CREATE POLICY "System can update order services" ON user_repair_order_services
    FOR UPDATE USING (true);

-- Policy: System can delete services
CREATE POLICY "System can delete order services" ON user_repair_order_services
    FOR DELETE USING (true);

-- Policy: Service can manage order services
CREATE POLICY "Service can manage order services" ON user_repair_order_services
    FOR ALL USING (true);
