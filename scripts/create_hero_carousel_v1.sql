-- Create hero_carousel_slides table
CREATE TABLE IF NOT EXISTS hero_carousel_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  link TEXT NOT NULL DEFAULT '/',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create hero_carousel_settings table
CREATE TABLE IF NOT EXISTS hero_carousel_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN DEFAULT false,
  autoplay_interval INTEGER DEFAULT 5000,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for sort order
CREATE INDEX IF NOT EXISTS idx_hero_carousel_slides_sort ON hero_carousel_slides(sort_order);

-- Insert default settings
INSERT INTO hero_carousel_settings (enabled, autoplay_interval)
VALUES (false, 5000)
ON CONFLICT DO NOTHING;
