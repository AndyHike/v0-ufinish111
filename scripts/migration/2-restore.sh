#!/usr/bin/env bash
# Заливка дампу в локальний Supabase.
#
# DST залежить від того, як ви його підняли:
#   supabase CLI (supabase start):  postgresql://postgres:postgres@127.0.0.1:54322/postgres
#   self-hosted docker compose:     postgresql://postgres:ВАШ_POSTGRES_PASSWORD@localhost:5432/postgres
#
#   export DST="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
#   bash 2-restore.sh

set -euo pipefail
: "${DST:?Спочатку: export DST='postgresql://...'}"

IN="$(dirname "$0")/dump"
[ -f "$IN/02_schema.sql" ] || { echo "Немає $IN/02_schema.sql — спочатку 1-dump.sh"; exit 1; }

PSQL="psql --dbname=$DST -v ON_ERROR_STOP=1 --no-psqlrc"

echo "==> чистимо public на локальній (schema public буде перестворена з нуля)"
$PSQL -c 'drop schema if exists public cascade; create schema public;
          grant usage on schema public to anon, authenticated, service_role;
          grant all on schema public to postgres;'

echo "==> ролі (помилки 'already exists' тут нормальні — локальний Supabase уже має anon/service_role)"
$PSQL -f "$IN/01_roles.sql" || echo "   ...пропущено, ролі вже є"

echo "==> схема public"
$PSQL -f "$IN/02_schema.sql"

echo "==> дані public"
$PSQL -f "$IN/03_data.sql"

echo
echo "==> перевірка"
$PSQL -f "$(dirname "$0")/3-verify.sql"
echo
echo "Далі: node 4-storage-files.mjs — перетягнути самі файли (129 шт, ~9.6 МБ)"
