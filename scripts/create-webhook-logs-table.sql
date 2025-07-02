-- Create webhook_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS webhook_logs (
    id BIGSERIAL PRIMARY KEY,
    event_type TEXT NOT NULL DEFAULT 'unknown',
    status TEXT NOT NULL CHECK (status IN ('received', 'success', 'failed', 'error')),
    message TEXT DEFAULT '',
    processing_time_ms INTEGER DEFAULT 0,
    webhook_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);

-- Add some sample data to test the table
INSERT INTO webhook_logs (event_type, status, message, webhook_data) 
VALUES ('test_event', 'success', 'Test webhook log entry', '{"test": true}')
ON CONFLICT DO NOTHING;

SELECT 'Webhook logs table created successfully' as result;
