-- Create webhook_logs table for real-time monitoring
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('received', 'success', 'failed', 'error')),
    message TEXT DEFAULT '',
    processing_time_ms INTEGER DEFAULT 0,
    webhook_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);

-- Enable RLS
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only
CREATE POLICY "Admin can view webhook logs" ON webhook_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );
