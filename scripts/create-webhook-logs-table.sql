-- Create webhook_logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
  id BIGSERIAL PRIMARY KEY,
  method VARCHAR(10) NOT NULL DEFAULT 'POST',
  url TEXT,
  headers JSONB,
  raw_body TEXT,
  payload JSONB,
  user_agent TEXT,
  content_type VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_method ON webhook_logs(method);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_content_type ON webhook_logs(content_type);

-- Enable RLS (Row Level Security)
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to access all webhook logs
CREATE POLICY "Admin can access webhook logs" ON webhook_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Grant permissions
GRANT ALL ON webhook_logs TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE webhook_logs_id_seq TO authenticated;
