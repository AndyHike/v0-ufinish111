-- Create user_repair_order_services table
CREATE TABLE IF NOT EXISTS user_repair_order_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES user_repair_orders(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    warranty_period INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_repair_order_services_order_id ON user_repair_order_services(order_id);

-- Enable RLS
ALTER TABLE user_repair_order_services ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view services for own orders" ON user_repair_order_services
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_repair_orders 
            WHERE user_repair_orders.id = order_id 
            AND user_repair_orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Admin can view all services" ON user_repair_order_services
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );
