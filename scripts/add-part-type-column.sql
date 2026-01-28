-- Додаємо колонку part_type (тип деталі) до таблиці model_services
ALTER TABLE model_services 
ADD COLUMN IF NOT EXISTS part_type VARCHAR(255);

-- Коментар для пояснення колонки
COMMENT ON COLUMN model_services.part_type IS 'Тип деталі/запчастини (наприклад: оригінал, OLED, тощо). Може містити кілька значень через кому.';

-- Індекс для пошуку за типом деталі
CREATE INDEX IF NOT EXISTS idx_model_services_part_type ON model_services(part_type);
