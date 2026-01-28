-- Create daily_stats table for tracking page views
CREATE TABLE IF NOT EXISTS daily_stats (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  page_path TEXT NOT NULL,
  view_count BIGINT NOT NULL DEFAULT 0,
  unique_visitors BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, page_path)
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_stats_page_path ON daily_stats(page_path);

-- Create page_view_hashes table to track unique visitors per day
CREATE TABLE IF NOT EXISTS page_view_hashes (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  page_path TEXT NOT NULL,
  visitor_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, page_path, visitor_hash)
);

CREATE INDEX IF NOT EXISTS idx_page_view_hashes_date_path ON page_view_hashes(date, page_path);

-- Create RPC function to increment page views
CREATE OR REPLACE FUNCTION increment_page_view(
  p_date DATE,
  p_path TEXT,
  p_visitor_hash VARCHAR(64)
)
RETURNS VOID AS $$
BEGIN
  -- Insert or update daily stats
  INSERT INTO daily_stats (date, page_path, view_count, unique_visitors)
  VALUES (p_date, p_path, 1, 1)
  ON CONFLICT (date, page_path) DO UPDATE SET
    view_count = daily_stats.view_count + 1,
    unique_visitors = (
      SELECT COUNT(DISTINCT visitor_hash)
      FROM page_view_hashes
      WHERE date = p_date AND page_path = p_path
    ),
    updated_at = NOW();

  -- Insert visitor hash (on conflict, do nothing to avoid double counting)
  INSERT INTO page_view_hashes (date, page_path, visitor_hash)
  VALUES (p_date, p_path, p_visitor_hash)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;
