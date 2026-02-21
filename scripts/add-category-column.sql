-- Add category column to articles table
ALTER TABLE articles ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';

-- Add category column to article_translations table
ALTER TABLE article_translations ADD COLUMN IF NOT EXISTS category TEXT;
