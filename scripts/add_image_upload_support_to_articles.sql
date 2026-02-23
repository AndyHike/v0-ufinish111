-- Add featured_image_type column to articles table for tracking image source (url or s3)
ALTER TABLE articles ADD COLUMN IF NOT EXISTS featured_image_type TEXT DEFAULT 'url' CHECK (featured_image_type IN ('url', 's3'));

-- Add published_at column if it doesn't exist
ALTER TABLE articles ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

-- Create index on featured_image_type for faster queries
CREATE INDEX IF NOT EXISTS idx_articles_featured_image_type ON articles(featured_image_type);

-- Create index on published_at for faster queries
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at);
