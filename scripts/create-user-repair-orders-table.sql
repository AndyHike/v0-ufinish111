-- Create user_repair_orders table
CREATE TABLE IF NOT EXISTS user_repair_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    remonline_order_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10,2) DEFAULT 0,
    device_name TEXT DEFAULT '',
    device_serial TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, remonline_order_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_repair_orders_user_id ON user_repair_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_repair_orders_remonline_id ON user_repair_orders(remonline_order_id);
CREATE INDEX IF NOT EXISTS idx_user_repair_orders_created_at ON user_repair_orders(created_at DESC);

-- Enable RLS
ALTER TABLE user_repair_orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own orders" ON user_repair_orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all orders" ON user_repair_orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );
