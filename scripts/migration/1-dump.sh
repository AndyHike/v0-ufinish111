#!/usr/bin/env bash
# Дамп продакшн-проєкту ${PROJECT_REF} у локальні файли.
# Запускати з Git Bash. Docker має бути запущений (CLI піднімає pg_dump у контейнері
# з версією, що збігається з сервером — саме тому не використовуємо локальний pg_dump).
#
#   export SRC="postgresql://postgres.${PROJECT_REF}:ПАРОЛЬ@aws-0-eu-west-2.pooler.supabase.com:5432/postgres"
#   bash 1-dump.sh
#
# SRC беріть у Dashboard → Connect → Session pooler.
# Пряме db.${PROJECT_REF}.supabase.co:5432 на free-тарифі тільки IPv6 — може не резолвитись.

set -euo pipefail
: "${SRC:?Спочатку: export SRC='postgresql://...'}"

OUT="$(dirname "$0")/dump"
mkdir -p "$OUT"

echo "==> 1/3 ролі"
npx --yes supabase db dump --db-url "$SRC" --role-only -f "$OUT/01_roles.sql"

echo "==> 2/3 схема public"
npx --yes supabase db dump --db-url "$SRC" -f "$OUT/02_schema.sql"

echo "==> 3/3 дані public без аналітики (page_views пропускаємо: -28 МБ з 49)"
# Без --use-copy: заливка йде через HTTP /pg/query, а COPY ... FROM stdin
# вимагає живого psql-з'єднання і через HTTP не виконується. Тому INSERT-и.
# Таблиця page_views усе одно створиться зі схеми — просто лишиться порожньою.
npx --yes supabase db dump --db-url "$SRC" --data-only \
  -x public.page_views -f "$OUT/03_data.sql"

# Схему storage навмисно не дампимо: файли поїдуть через Storage API (4-storage-files.mjs),
# і записи в storage.objects створяться самі. Дамп storage конфліктував би зі
# storage.migrations, які в локальній інсталяції вже свої.

echo
ls -lh "$OUT"
echo
echo "Готово. Далі: bash 2-restore.sh"
echo "УВАГА: у дампі є users, sessions, contact_messages, profiles — персональні дані."
echo "Не комітьте каталог dump/ у git."
