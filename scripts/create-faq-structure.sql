-- Створюємо таблицю для FAQ
CREATE TABLE IF NOT EXISTS service_faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Створюємо таблицю для перекладів FAQ
CREATE TABLE IF NOT EXISTS service_faq_translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  faq_id UUID REFERENCES service_faqs(id) ON DELETE CASCADE,
  locale VARCHAR(5) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(faq_id, locale)
);

-- Створюємо індекси
CREATE INDEX IF NOT EXISTS idx_service_faqs_service_id ON service_faqs(service_id);
CREATE INDEX IF NOT EXISTS idx_service_faqs_position ON service_faqs(position);
CREATE INDEX IF NOT EXISTS idx_service_faq_translations_faq_id ON service_faq_translations(faq_id);
CREATE INDEX IF NOT EXISTS idx_service_faq_translations_locale ON service_faq_translations(locale);

-- Додаємо тригер для оновлення updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_service_faqs_updated_at BEFORE UPDATE ON service_faqs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_faq_translations_updated_at BEFORE UPDATE ON service_faq_translations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Додаємо приклади FAQ для тестування
INSERT INTO service_faqs (service_id, position) 
SELECT id, 1 FROM services LIMIT 1;

INSERT INTO service_faq_translations (faq_id, locale, question, answer)
SELECT 
  sf.id,
  'uk',
  'Скільки часу займає ремонт?',
  'Зазвичай ремонт займає від 1 до 3 годин, залежно від складності проблеми та наявності запчастин.'
FROM service_faqs sf LIMIT 1;

INSERT INTO service_faq_translations (faq_id, locale, question, answer)
SELECT 
  sf.id,
  'en',
  'How long does the repair take?',
  'Usually repair takes from 1 to 3 hours, depending on the complexity of the problem and availability of parts.'
FROM service_faqs sf LIMIT 1;

INSERT INTO service_faq_translations (faq_id, locale, question, answer)
SELECT 
  sf.id,
  'cs',
  'Jak dlouho trvá oprava?',
  'Obvykle oprava trvá 1 až 3 hodiny, v závislosti na složitosti problému a dostupnosti náhradních dílů.'
FROM service_faqs sf LIMIT 1;

COMMIT;
