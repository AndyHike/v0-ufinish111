-- Drop existing table if it exists to recreate with proper structure
DROP TABLE IF EXISTS webhook_logs CASCADE;

-- Create webhook_logs table for monitoring ALL incoming webhooks
CREATE TABLE webhook_logs (
  id BIGSERIAL PRIMARY KEY,
  event_type VARCHAR(255) NOT NULL DEFAULT 'unknown',
  status VARCHAR(50) NOT NULL CHECK (status IN ('received', 'success', 'failed', 'error')),
  message TEXT DEFAULT '',
  processing_time_ms INTEGER DEFAULT 0,
  webhook_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX idx_webhook_logs_webhook_data ON webhook_logs USING GIN(webhook_data);

-- Insert a test record to verify table works
INSERT INTO webhook_logs (event_type, status, message, webhook_data) 
VALUES ('test_event', 'success', 'Test webhook log entry', '{"test": true, "created_at": "' || NOW() || '"}');

-- Verify the table was created and test record inserted
SELECT 'webhook_logs table created successfully' as status, COUNT(*) as test_records FROM webhook_logs;
