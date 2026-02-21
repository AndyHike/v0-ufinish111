-- Add missing columns to articles table
ALTER TABLE articles ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS published_at timestamp with time zone;

-- Add index for published_at for better query performance
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
