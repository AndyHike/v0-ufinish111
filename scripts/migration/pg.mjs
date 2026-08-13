/**
 * Виконує SQL на self-hosted Supabase (VPS) через postgres-meta.
 *
 *   node --env-file=.env scripts/migration/pg.mjs <файл.sql>
 *   node --env-file=.env scripts/migration/pg.mjs -e "select 1"
 *
 * Ключ береться з SERVICE_LOCAL_KEY і ніде не друкується.
 */
import { readFileSync } from 'node:fs'

const HOST = process.env.VPS_SUPABASE_URL
if (!process.env.VPS_SUPABASE_URL) { console.error('Немає VPS_SUPABASE_URL у .env'); process.exit(1) }
const KEY = process.env.SERVICE_LOCAL_KEY
if (!KEY) { console.error('Немає SERVICE_LOCAL_KEY у .env'); process.exit(1) }

const args = process.argv.slice(2)
if (!args.length) { console.error('Вкажіть файл або -e "SQL"'); process.exit(1) }

const query = args[0] === '-e' ? args.slice(1).join(' ') : readFileSync(args[0], 'utf8')

export async function run(sql) {
  const res = await fetch(`${HOST}/pg/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: KEY, Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ query: sql }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`HTTP ${res.status}\n${text.slice(0, 800)}`)
  return text
}

try {
  const out = await run(query)
  console.log(out.length > 4000 ? out.slice(0, 4000) + `\n… (${out.length} байт)` : out)
} catch (e) {
  console.error(String(e.message))
  process.exit(1)
}
