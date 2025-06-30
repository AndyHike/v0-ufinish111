-- Перевіряємо дані в моделях
SELECT id, name, slug FROM models LIMIT 5;

-- Перевіряємо дані в послугах
SELECT id, slug FROM services LIMIT 5;

-- Перевіряємо переклади послуг
SELECT * FROM services_translations LIMIT 5;

-- Перевіряємо зв'язки model_services
SELECT ms.id, ms.model_id, ms.service_id, ms.price, m.name as model_name, s.id as service_id
FROM model_services ms
JOIN models m ON ms.model_id = m.id
JOIN services s ON ms.service_id = s.id
LIMIT 5;

-- Перевіряємо конкретну модель iPhone 15
SELECT * FROM models WHERE slug = 'iphone-15' OR name ILIKE '%iphone%15%';
