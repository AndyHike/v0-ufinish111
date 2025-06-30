-- Створення таблиці для FAQ послуг
CREATE TABLE IF NOT EXISTS service_faqs (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Створення таблиці для перекладів FAQ
CREATE TABLE IF NOT EXISTS service_faq_translations (
    id SERIAL PRIMARY KEY,
    service_faq_id INTEGER NOT NULL REFERENCES service_faqs(id) ON DELETE CASCADE,
    locale VARCHAR(10) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(service_faq_id, locale)
);

-- Індекси для оптимізації
CREATE INDEX IF NOT EXISTS idx_service_faqs_service_id ON service_faqs(service_id);
CREATE INDEX IF NOT EXISTS idx_service_faqs_position ON service_faqs(position);
CREATE INDEX IF NOT EXISTS idx_service_faq_translations_faq_id ON service_faq_translations(service_faq_id);
CREATE INDEX IF NOT EXISTS idx_service_faq_translations_locale ON service_faq_translations(locale);

-- Функція для оновлення updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Тригери для автоматичного оновлення updated_at
CREATE TRIGGER update_service_faqs_updated_at BEFORE UPDATE ON service_faqs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_faq_translations_updated_at BEFORE UPDATE ON service_faq_translations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
