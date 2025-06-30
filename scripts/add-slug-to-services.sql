-- Перевіряємо чи існує поле slug в таблиці services
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'services' AND column_name = 'slug';

-- Якщо поле slug не існує, додаємо його
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;

-- Створюємо slug для існуючих послуг на основі ID та назви
UPDATE services 
SET slug = LOWER(REGEXP_REPLACE(
  COALESCE(
    (SELECT name FROM services_translations WHERE service_id = services.id AND locale = 'en' LIMIT 1),
    'service-' || services.id::text
  ), 
  '[^a-zA-Z0-9]+', '-', 'g'
))
WHERE slug IS NULL;

-- Створюємо індекс для швидкого пошуку
CREATE INDEX IF NOT EXISTS idx_services_slug ON services(slug);
