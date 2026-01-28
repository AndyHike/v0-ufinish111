-- Create daily_stats table for analytics
CREATE TABLE IF NOT EXISTS daily_stats (
  date DATE NOT NULL,
  page_path TEXT NOT NULL,
  view_count INTEGER NOT NULL DEFAULT 0,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (date, page_path)
);

-- Create page_view_hashes table to track unique visitors without storing PII
CREATE TABLE IF NOT EXISTS page_view_hashes (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  page_path TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, page_path, visitor_hash)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);
CREATE INDEX IF NOT EXISTS idx_daily_stats_path ON daily_stats(page_path);
CREATE INDEX IF NOT EXISTS idx_page_view_hashes_date_path ON page_view_hashes(date, page_path);

-- Enable RLS
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_view_hashes ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to read stats (for admin dashboard)
CREATE POLICY "Allow read access to daily_stats" ON daily_stats FOR SELECT USING (true);
CREATE POLICY "Allow read access to page_view_hashes" ON page_view_hashes FOR SELECT USING (true);

-- Function to increment page view and track unique visitors atomically
CREATE OR REPLACE FUNCTION increment_page_view(
  p_date DATE,
  p_path TEXT,
  p_visitor_hash TEXT
)
RETURNS VOID AS $$
DECLARE
  v_is_new_visitor BOOLEAN;
BEGIN
  -- Insert visitor hash and check if it's new
  INSERT INTO page_view_hashes (date, page_path, visitor_hash)
  VALUES (p_date, p_path, p_visitor_hash)
  ON CONFLICT DO NOTHING;
  
  -- Check if this visitor was new
  v_is_new_visitor := (SELECT COUNT(*) = 1 FROM page_view_hashes 
    WHERE date = p_date AND page_path = p_path AND visitor_hash = p_visitor_hash);
  
  -- Upsert into daily_stats
  INSERT INTO daily_stats (date, page_path, view_count, unique_visitors)
  VALUES (p_date, p_path, 1, CASE WHEN v_is_new_visitor THEN 1 ELSE 0 END)
  ON CONFLICT (date, page_path) DO UPDATE SET
    view_count = daily_stats.view_count + 1,
    unique_visitors = daily_stats.unique_visitors + (CASE WHEN v_is_new_visitor THEN 1 ELSE 0 END),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
