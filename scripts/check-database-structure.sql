-- Перевіряємо структуру таблиці models
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'models' 
ORDER BY ordinal_position;

-- Перевіряємо структуру таблиці services
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'services' 
ORDER BY ordinal_position;

-- Перевіряємо структуру таблиці services_translations
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'services_translations' 
ORDER BY ordinal_position;

-- Перевіряємо структуру таблиці model_services
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'model_services' 
ORDER BY ordinal_position;

-- Перевіряємо чи існує таблиця languages
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'languages';

-- Якщо languages існує, дивимось її структуру
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'languages' 
ORDER BY ordinal_position;
