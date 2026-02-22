-- Fill localized slugs for existing article translations
-- This script generates slugs from titles for articles that don't have a slug yet

UPDATE article_translations
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        TRIM(title),
        '\s+', '-', 'g'  -- Replace spaces with hyphens
      ),
      '[^a-z0-9-]', '', 'g'  -- Remove special characters
    ),
    '-+', '-', 'g'  -- Remove multiple consecutive hyphens
  )
)
WHERE slug IS NULL OR slug = '';
