-- Migration: Add slug column to article_translations for localized URLs
-- This allows different slugs for each language (better for SEO)

-- Add slug column to article_translations
ALTER TABLE article_translations 
ADD COLUMN slug VARCHAR(255) NULL;

-- Copy existing article slugs to article_translations as default values
UPDATE article_translations at
SET slug = (
  SELECT a.slug FROM articles a WHERE a.id = at.article_id
);

-- Make slug column NOT NULL after populating
ALTER TABLE article_translations 
ALTER COLUMN slug SET NOT NULL;

-- Create unique index for (article_id, locale) to prevent duplicate slugs per language
CREATE UNIQUE INDEX idx_article_translations_slug_locale 
ON article_translations(article_id, locale);

-- Create index for faster slug lookups
CREATE INDEX idx_article_translations_slug 
ON article_translations(slug);
