-- Створення таблиці для FAQ послуг
CREATE TABLE IF NOT EXISTS service_faqs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Створення таблиці для перекладів FAQ
CREATE TABLE IF NOT EXISTS service_faq_translations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    faq_id UUID NOT NULL REFERENCES service_faqs(id) ON DELETE CASCADE,
    locale VARCHAR(5) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(faq_id, locale)
);

-- Індекси для оптимізації
CREATE INDEX IF NOT EXISTS idx_service_faqs_service_id ON service_faqs(service_id);
CREATE INDEX IF NOT EXISTS idx_service_faqs_position ON service_faqs(position);
CREATE INDEX IF NOT EXISTS idx_service_faq_translations_faq_id ON service_faq_translations(faq_id);
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

-- Приклади FAQ для тестування
DO $$
DECLARE
    service_record RECORD;
    faq_id_1 UUID;
    faq_id_2 UUID;
    faq_id_3 UUID;
BEGIN
    -- Отримуємо перший сервіс для прикладу
    SELECT id INTO service_record FROM services LIMIT 1;
    
    IF service_record.id IS NOT NULL THEN
        -- Створюємо FAQ записи
        INSERT INTO service_faqs (service_id, position) VALUES (service_record.id, 1) RETURNING id INTO faq_id_1;
        INSERT INTO service_faqs (service_id, position) VALUES (service_record.id, 2) RETURNING id INTO faq_id_2;
        INSERT INTO service_faqs (service_id, position) VALUES (service_record.id, 3) RETURNING id INTO faq_id_3;
        
        -- Створюємо переклади для першого FAQ
        INSERT INTO service_faq_translations (faq_id, locale, question, answer) VALUES 
        (faq_id_1, 'uk', 'Скільки часу займає ремонт?', 'Зазвичай ремонт займає від 1 до 2 годин, залежно від складності проблеми та наявності запчастин.'),
        (faq_id_1, 'en', 'How long does the repair take?', 'Usually repair takes 1 to 2 hours, depending on the complexity of the problem and availability of parts.'),
        (faq_id_1, 'cs', 'Jak dlouho trvá oprava?', 'Obvykle oprava trvá 1 až 2 hodiny, v závislosti na složitosti problému a dostupnosti náhradních dílů.');
        
        -- Створюємо переклади для другого FAQ
        INSERT INTO service_faq_translations (faq_id, locale, question, answer) VALUES 
        (faq_id_2, 'uk', 'Яка гарантія на ремонт?', 'Ми надаємо гарантію 6 місяців на всі види ремонту та використані запчастини.'),
        (faq_id_2, 'en', 'What warranty do you provide?', 'We provide 6 months warranty on all types of repairs and used parts.'),
        (faq_id_2, 'cs', 'Jakou záruku poskytujete?', 'Poskytujeme 6měsíční záruku na všechny typy oprav a použité náhradní díly.');
        
        -- Створюємо переклади для третього FAQ
        INSERT INTO service_faq_translations (faq_id, locale, question, answer) VALUES 
        (faq_id_3, 'uk', 'Чи використовуете оригінальні запчастини?', 'Так, ми використовуємо тільки оригінальні або сертифіковані запчастини високої якості.'),
        (faq_id_3, 'en', 'Do you use original parts?', 'Yes, we use only original or certified high-quality parts.'),
        (faq_id_3, 'cs', 'Používáte originální náhradní díly?', 'Ano, používáme pouze originální nebo certifikované vysoce kvalitní náhradní díly.');
    END IF;
END $$;
