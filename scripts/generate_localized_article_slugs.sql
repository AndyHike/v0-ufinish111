-- Script to generate localized slugs for articles based on their titles
-- This should be run after articles have been translated with proper titles in other languages

-- For Czech articles, ensure they have Czech slugs
UPDATE article_translations
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        UNACCENT(title),
        '[^a-z0-9]+', '-', 'g'
      ),
      '^-+|-+$', '', 'g'
    ),
    '-+', '-', 'g'
  )
)
WHERE locale = 'cs' AND title IS NOT NULL;

-- For Ukrainian articles, ensure they have Ukrainian slugs (transliterated to Latin characters)
-- Ukrainian Cyrillic to Latin transliteration mapping for slugs
UPDATE article_translations
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        title,
        '[^a-z0-9\u0430-\u044f]+', '-', 'g'
      ),
      '^-+|-+$', '', 'g'
    ),
    '-+', '-', 'g'
  )
)
WHERE locale = 'uk' AND title IS NOT NULL AND slug = (
  SELECT a.slug FROM articles a WHERE a.id = article_id
);

-- For English articles, ensure they have English slugs
UPDATE article_translations
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        UNACCENT(title),
        '[^a-z0-9]+', '-', 'g'
      ),
      '^-+|-+$', '', 'g'
    ),
    '-+', '-', 'g'
  )
)
WHERE locale = 'en' AND title IS NOT NULL;

-- Alternative approach: If you have a specific mapping or prefer to do this programmatically
-- You can use the next API endpoint to batch update slugs with custom logic
