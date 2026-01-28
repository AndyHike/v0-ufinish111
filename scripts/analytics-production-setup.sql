-- Create page_views table for analytics tracking
CREATE TABLE IF NOT EXISTS page_views (
  id BIGSERIAL PRIMARY KEY,
  page_path TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT page_views_date_check CHECK (created_at <= CURRENT_TIMESTAMP)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_hash ON page_views(visitor_hash);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);

-- Enable Row Level Security
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Allow read for authenticated users
CREATE POLICY "Allow read for authenticated users" ON page_views
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow insert from service role
CREATE POLICY "Allow insert" ON page_views
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create materialized view for daily stats (optional, for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_stats AS
SELECT
  DATE(created_at) as date,
  page_path,
  COUNT(*) as page_views,
  COUNT(DISTINCT visitor_hash) as unique_visitors
FROM page_views
GROUP BY DATE(created_at), page_path;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);

-- Add comment to table
COMMENT ON TABLE page_views IS 'Analytics page view tracking with GDPR-compliant anonymized visitor hashing';
