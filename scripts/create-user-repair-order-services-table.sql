-- Create user_repair_order_services table
CREATE TABLE IF NOT EXISTS user_repair_order_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES user_repair_orders(id) ON DELETE CASCADE,
    remonline_order_id INTEGER NOT NULL,
    remonline_service_id INTEGER,
    service_name TEXT NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    warranty_period INTEGER,
    warranty_units TEXT,
    service_status TEXT NOT NULL DEFAULT 'active',
    service_status_name TEXT NOT NULL DEFAULT 'Активна',
    service_status_color TEXT NOT NULL DEFAULT 'bg-blue-100 text-blue-800',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_repair_order_services_order_id ON user_repair_order_services(order_id);
CREATE INDEX IF NOT EXISTS idx_user_repair_order_services_remonline_order_id ON user_repair_order_services(remonline_order_id);
CREATE INDEX IF NOT EXISTS idx_user_repair_order_services_remonline_service_id ON user_repair_order_services(remonline_service_id);
CREATE INDEX IF NOT EXISTS idx_user_repair_order_services_status ON user_repair_order_services(service_status);

-- Enable Row Level Security
ALTER TABLE user_repair_order_services ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view services for their own orders" ON user_repair_order_services
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_repair_orders 
            WHERE user_repair_orders.id = user_repair_order_services.order_id 
            AND user_repair_orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert services for their own orders" ON user_repair_order_services
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_repair_orders 
            WHERE user_repair_orders.id = user_repair_order_services.order_id 
            AND user_repair_orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update services for their own orders" ON user_repair_order_services
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_repair_orders 
            WHERE user_repair_orders.id = user_repair_order_services.order_id 
            AND user_repair_orders.user_id = auth.uid()
        )
    );

-- Allow service role to manage all services (for webhooks)
CREATE POLICY "Service role can manage all order services" ON user_repair_order_services
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Add comments
COMMENT ON TABLE user_repair_order_services IS 'Stores services/items for repair orders from RemOnline';
COMMENT ON COLUMN user_repair_order_services.order_id IS 'Reference to the parent repair order';
COMMENT ON COLUMN user_repair_order_services.remonline_order_id IS 'RemOnline order ID for easier lookup';
COMMENT ON COLUMN user_repair_order_services.remonline_service_id IS 'Service ID from RemOnline system';
COMMENT ON COLUMN user_repair_order_services.service_name IS 'Name of the service performed';
COMMENT ON COLUMN user_repair_order_services.price IS 'Price of the individual service';
COMMENT ON COLUMN user_repair_order_services.warranty_period IS 'Warranty period number';
COMMENT ON COLUMN user_repair_order_services.warranty_units IS 'Warranty period units (days, months, etc.)';
COMMENT ON COLUMN user_repair_order_services.service_status IS 'Current status of the service';
COMMENT ON COLUMN user_repair_order_services.service_status_name IS 'Human-readable service status name';
COMMENT ON COLUMN user_repair_order_services.service_status_color IS 'CSS classes for service status badge color';
