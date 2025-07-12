-- Додаємо нові колонки до таблиці model_services
ALTER TABLE model_services 
ADD COLUMN IF NOT EXISTS warranty_months INTEGER,
ADD COLUMN IF NOT EXISTS duration_hours DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS warranty_period VARCHAR(20) DEFAULT 'months',
ADD COLUMN IF NOT EXISTS detailed_description TEXT,
ADD COLUMN IF NOT EXISTS what_included TEXT,
ADD COLUMN IF NOT EXISTS benefits TEXT;

-- Додаємо коментарі для пояснення колонок
COMMENT ON COLUMN model_services.warranty_months IS 'Період гарантії в місяцях (або днях, залежно від warranty_period)';
COMMENT ON COLUMN model_services.duration_hours IS 'Тривалість виконання роботи в годинах';
COMMENT ON COLUMN model_services.warranty_period IS 'Тип періоду гарантії: months або days';
COMMENT ON COLUMN model_services.detailed_description IS 'Детальний опис послуги для конкретної моделі';
COMMENT ON COLUMN model_services.what_included IS 'Що входить у послугу для конкретної моделі';
COMMENT ON COLUMN model_services.benefits IS 'Переваги послуги для конкретної моделі';

-- Створюємо індекси для кращої продуктивності
CREATE INDEX IF NOT EXISTS idx_model_services_warranty ON model_services(warranty_months);
CREATE INDEX IF NOT EXISTS idx_model_services_duration ON model_services(duration_hours);

-- Оновлюємо існуючі записи з дефолтними значеннями (якщо потрібно)
UPDATE model_services 
SET warranty_period = 'months' 
WHERE warranty_period IS NULL;
