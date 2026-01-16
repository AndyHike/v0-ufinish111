# Docker Deployment Guide

Інструкція з розгортання DeviceHelp на вашому сервері за допомогою Docker.

## Передумови

На вашому сервері повинні бути встановлені:
- Docker (версія 20.10+)
- Docker Compose (версія 2.0+)
- Git

## Крок 1: Клонування репозиторію

\`\`\`bash
git clone https://github.com/your-username/devicehelp.git
cd devicehelp
\`\`\`

## Крок 2: Налаштування environment змінних

1. Скопіюйте файл прикладу:
\`\`\`bash
cp .env.example .env
\`\`\`

2. Відредагуйте `.env` файл з вашими даними:
\`\`\`bash
nano .env
\`\`\`

3. Заповніть всі необхідні змінні (база даних, Supabase, email, тощо)

## Крок 3: Підготовка Nginx (опціонально)

Якщо ви хочете використовувати Nginx reverse proxy:

1. Створіть директорію для SSL сертифікатів:
\`\`\`bash
mkdir -p nginx/ssl nginx/logs
\`\`\`

2. Додайте ваші SSL сертифікати в `nginx/ssl/`:
\`\`\`bash
# Для Let's Encrypt:
sudo certbot certonly --standalone -d devicehelp.cz -d www.devicehelp.cz
sudo cp /etc/letsencrypt/live/devicehelp.cz/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/devicehelp.cz/privkey.pem nginx/ssl/
\`\`\`

3. Розкоментуйте SSL налаштування в `nginx/nginx.conf`

## Крок 4: Збірка та запуск

### Варіант A: З Nginx (рекомендовано для production)

\`\`\`bash
docker-compose up -d
\`\`\`

### Варіант B: Без Nginx (тільки Next.js)

Відредагуйте `docker-compose.yml` і закоментуйте секцію `nginx`:

\`\`\`bash
docker-compose up -d nextjs
\`\`\`

## Крок 5: Перевірка стану

\`\`\`bash
# Перевірити запущені контейнери
docker-compose ps

# Переглянути логи
docker-compose logs -f nextjs

# Перевірити health check
curl http://localhost:3000/api/health
\`\`\`

## Оновлення додатку

\`\`\`bash
# Зупинити контейнери
docker-compose down

# Оновити код
git pull origin main

# Пересібрати та запустити
docker-compose up -d --build
\`\`\`

## Корисні команди

### Переглянути логи
\`\`\`bash
docker-compose logs -f nextjs
docker-compose logs -f nginx
\`\`\`

### Перезапустити сервіси
\`\`\`bash
docker-compose restart nextjs
docker-compose restart nginx
\`\`\`

### Зупинити всі сервіси
\`\`\`bash
docker-compose down
\`\`\`

### Очистити всі дані Docker
\`\`\`bash
docker-compose down -v
docker system prune -a
\`\`\`

### Зайти в контейнер
\`\`\`bash
docker exec -it devicehelp-nextjs sh
\`\`\`

## Налаштування автоматичного оновлення SSL

Для Let's Encrypt certbot, додайте cron job:

\`\`\`bash
sudo crontab -e
\`\`\`

Додайте:
\`\`\`
0 0 * * 0 certbot renew --quiet && cp /etc/letsencrypt/live/devicehelp.cz/*.pem /path/to/nginx/ssl/ && docker-compose restart nginx
\`\`\`

## Backup бази даних

Якщо ви використовуєте локальну Postgres:

\`\`\`bash
# Створити backup
docker exec devicehelp-postgres pg_dump -U postgres devicehelp > backup_$(date +%Y%m%d).sql

# Відновити з backup
docker exec -i devicehelp-postgres psql -U postgres devicehelp < backup_20240101.sql
\`\`\`

## Моніторинг

### Використання ресурсів
\`\`\`bash
docker stats
\`\`\`

### Перевірка health
\`\`\`bash
curl https://devicehelp.cz/api/health
\`\`\`

## Troubleshooting

### Контейнер не запускається
\`\`\`bash
docker-compose logs nextjs
\`\`\`

### Порт вже зайнятий
\`\`\`bash
# Знайти процес на порту 3000
sudo lsof -i :3000
# Зупинити процес
sudo kill -9 <PID>
\`\`\`

### Помилки з правами доступу
\`\`\`bash
sudo chown -R $USER:$USER .
\`\`\`

### Очистити кеш Docker
\`\`\`bash
docker builder prune -a
\`\`\`

## Налаштування Firewall

\`\`\`bash
# Відкрити порти
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
\`\`\`

## Продуктивність

Для кращої продуктивності:

1. Встановіть Docker з overlay2 storage driver
2. Налаштуйте swap на сервері (мінімум 2GB)
3. Використовуйте SSD диски
4. Налаштуйте CDN для статичних файлів

## Безпека

1. Регулярно оновлюйте Docker образи:
\`\`\`bash
docker-compose pull
docker-compose up -d
\`\`\`

2. Використовуйте сильні паролі в `.env`
3. Налаштуйте fail2ban для захисту від брутфорсу
4. Регулярно робіть backup бази даних

## Підтримка

Якщо виникають проблеми:
1. Перевірте логи: `docker-compose logs`
2. Перевірте статус: `docker-compose ps`
3. Перевірте environment змінні в `.env`
