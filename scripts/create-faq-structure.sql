-- Створення таблиці для FAQ послуг
CREATE TABLE IF NOT EXISTS service_faqs (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Створення таблиці для перекладів FAQ
CREATE TABLE IF NOT EXISTS service_faq_translations (
    id SERIAL PRIMARY KEY,
    service_faq_id INTEGER NOT NULL REFERENCES service_faqs(id) ON DELETE CASCADE,
    locale VARCHAR(5) NOT NULL,
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

-- Тригер для оновлення updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_service_faqs_updated_at BEFORE UPDATE ON service_faqs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_faq_translations_updated_at BEFORE UPDATE ON service_faq_translations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Приклад даних для тестування
INSERT INTO service_faqs (service_id, position) VALUES 
(1, 1),
(1, 2),
(1, 3);

INSERT INTO service_faq_translations (service_faq_id, locale, question, answer) VALUES 
(1, 'uk', 'Скільки часу займає ремонт?', 'Зазвичай ремонт займає від 1 до 2 годин, залежно від складності проблеми та наявності запчастин.'),
(1, 'en', 'How long does the repair take?', 'Usually repair takes 1 to 2 hours, depending on the complexity of the problem and availability of parts.'),
(1, 'cs', 'Jak dlouho trvá oprava?', 'Obvykle oprava trvá 1 až 2 hodiny, v závislosti na složitosti problému a dostupnosti náhradních dílů.'),

(2, 'uk', 'Яка гарантія на ремонт?', 'Ми надаємо гарантію 6 місяців на всі види ремонту та використані запчастини.'),
(2, 'en', 'What warranty do you provide?', 'We provide 6 months warranty on all types of repairs and used parts.'),
(2, 'cs', 'Jakou záruku poskytujete?', 'Poskytujeme 6měsíční záruku na všechny typy oprav a použité náhradní díly.'),

(3, 'uk', 'Чи використовуете оригінальні запчастини?', 'Так, ми використовуємо тільки оригінальні або сертифіковані запчастини високої якості.'),
(3, 'en', 'Do you use original parts?', 'Yes, we use only original or certified high-quality parts.'),
(3, 'cs', 'Používáte originální náhradní díly?', 'Ano, používáme pouze originální nebo certifikované vysoce kvalitní náhradní díly.');
