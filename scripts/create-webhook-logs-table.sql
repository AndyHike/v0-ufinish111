-- Create webhook_logs table for monitoring webhook activity
CREATE TABLE IF NOT EXISTS webhook_logs (
  id BIGSERIAL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('received', 'success', 'failed', 'error')),
  message TEXT,
  processing_time_ms INTEGER DEFAULT 0,
  webhook_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);

-- Add RLS (Row Level Security) if needed
-- ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
