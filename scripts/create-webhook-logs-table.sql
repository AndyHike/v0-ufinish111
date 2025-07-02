-- Create webhook_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS webhook_logs (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL DEFAULT 'unknown',
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'success', 'failed', 'error')),
  message TEXT DEFAULT '',
  processing_time_ms INTEGER DEFAULT 0,
  webhook_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);

-- Add RLS policies if needed
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust as needed)
CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON webhook_logs
  FOR ALL USING (auth.role() = 'authenticated');

-- Allow all operations for service role
CREATE POLICY IF NOT EXISTS "Allow all for service role" ON webhook_logs
  FOR ALL USING (auth.role() = 'service_role');
