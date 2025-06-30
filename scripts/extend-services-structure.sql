-- Додаємо нові поля до таблиці services
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS warranty_months INTEGER DEFAULT 12,
ADD COLUMN IF NOT EXISTS duration_hours DECIMAL(3,1) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Додаємо нові поля до таблиці services_translations для детального опису
ALTER TABLE services_translations 
ADD COLUMN IF NOT EXISTS detailed_description TEXT,
ADD COLUMN IF NOT EXISTS what_included TEXT,
ADD COLUMN IF NOT EXISTS benefits TEXT;

-- Створюємо індекси для покращення продуктивності
CREATE INDEX IF NOT EXISTS idx_services_slug ON services(slug);
CREATE INDEX IF NOT EXISTS idx_services_translations_locale ON services_translations(locale);

-- Генеруємо slug для існуючих послуг (якщо потрібно)
UPDATE services 
SET slug = LOWER(REPLACE(REPLACE(id::text, ' ', '-'), '_', '-'))
WHERE slug IS NULL;

-- Додаємо приклади детального опису для тестування
UPDATE services_translations 
SET 
  detailed_description = CASE 
    WHEN locale = 'uk' THEN 'Детальний опис послуги українською мовою. Тут буде повна інформація про те, що включає в себе ця послуга.'
    WHEN locale = 'en' THEN 'Detailed service description in English. Here will be complete information about what this service includes.'
    WHEN locale = 'cs' THEN 'Podrobný popis služby v češtině. Zde budou úplné informace o tom, co tato služba zahrnuje.'
  END,
  what_included = CASE 
    WHEN locale = 'uk' THEN 'Діагностика пристрою\nВиконання ремонтних робіт\nТестування після ремонту\nГарантія на роботу'
    WHEN locale = 'en' THEN 'Device diagnostics\nRepair work execution\nPost-repair testing\nWork warranty'
    WHEN locale = 'cs' THEN 'Diagnostika zařízení\nProvedení opravných prací\nTestování po opravě\nZáruka na práci'
  END,
  benefits = CASE 
    WHEN locale = 'uk' THEN 'Швидке виконання\nОригінальні запчастини\nДосвідчені майстри\nГарантія якості'
    WHEN locale = 'en' THEN 'Fast execution\nOriginal parts\nExperienced masters\nQuality guarantee'
    WHEN locale = 'cs' THEN 'Rychlé provedení\nOriginální díly\nZkušení mistři\nZáruka kvality'
  END
WHERE detailed_description IS NULL;
