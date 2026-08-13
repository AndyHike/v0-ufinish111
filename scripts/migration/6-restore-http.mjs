/**
 * Заливає дамп у VPS-Supabase через postgres-meta (/pg/query).
 * Ні psql, ні SSH, ні тунеля не потрібно.
 *
 * Запуск з кореня проєкту (ключ береться з .env, у консоль не друкується):
 *   node --env-file=.env "шлях/до/6-restore-http.mjs"
 *
 * Кроки: schema → data → перевірка.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HOST = process.env.VPS_SUPABASE_URL
if (!process.env.VPS_SUPABASE_URL) { console.error('Немає VPS_SUPABASE_URL у .env'); process.exit(1) }
const KEY = process.env.SERVICE_LOCAL_KEY
if (!KEY) { console.error('Немає SERVICE_LOCAL_KEY (має бути в .env)'); process.exit(1) }

const DUMP = join(dirname(fileURLToPath(import.meta.url)), 'dump')

async function sql(query, label) {
  const res = await fetch(`${HOST}/pg/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
    },
    body: JSON.stringify({ query }),
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`${label}: HTTP ${res.status}\n${text.slice(0, 600)}`)
  }
  return text
}

/** Ріже файл на шматки по межах команд, не розриваючи statement. */
function chunk(sqlText, maxBytes = 300_000) {
  const out = []
  let buf = ''
  for (const line of sqlText.split('\n')) {
    buf += line + '\n'
    // межа команди: рядок закінчується ';' і буфер уже достатньо великий
    if (buf.length >= maxBytes && /;\s*$/.test(line)) { out.push(buf); buf = '' }
  }
  if (buf.trim()) out.push(buf)
  return out
}

console.log('==> чистимо public на цілі')
await sql(
  `drop schema if exists public cascade;
   create schema public;
   grant usage on schema public to anon, authenticated, service_role;
   grant all on schema public to postgres;`,
  'drop/create public',
)

console.log('==> схема')
const schema = readFileSync(join(DUMP, '02_schema.sql'), 'utf8')
await sql(schema, 'schema')
console.log(`    залито ${(schema.length / 1024).toFixed(0)} КБ одним запитом`)

console.log('==> дані')
const data = readFileSync(join(DUMP, '03_data.sql'), 'utf8')
const parts = chunk(data)
console.log(`    ${(data.length / 1024 / 1024).toFixed(1)} МБ у ${parts.length} шматках`)
for (let i = 0; i < parts.length; i++) {
  await sql(parts[i], `data chunk ${i + 1}/${parts.length}`)
  process.stdout.write(`\r    ${i + 1}/${parts.length}`)
}
console.log('\n')

console.log('==> звірка')
const check = await sql(
  `select relname, n_live_tup from pg_stat_user_tables
   where schemaname='public' and n_live_tup > 0
   order by n_live_tup desc limit 30`,
  'verify',
)
console.log(check)
