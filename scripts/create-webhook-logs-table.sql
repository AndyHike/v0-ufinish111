-- Create webhook_logs table for monitoring RemOnline webhooks
CREATE TABLE IF NOT EXISTS webhook_logs (
  id BIGSERIAL PRIMARY KEY,
  event_type VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('received', 'success', 'failed', 'error')),
  message TEXT,
  processing_time_ms INTEGER DEFAULT 0,
  webhook_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);

-- Add RLS policies if needed
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage all webhook logs
CREATE POLICY "Service role can manage webhook logs" ON webhook_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to read webhook logs (for admin panel)
CREATE POLICY "Authenticated users can read webhook logs" ON webhook_logs
  FOR SELECT USING (auth.role() = 'authenticated');
