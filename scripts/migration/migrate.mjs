/**
 * Перенос Supabase Cloud → self-hosted VPS.
 *
 * Читає прод напряму по Postgres (обмеження egress душить лише API-шлюз,
 * саме з'єднання з базою працює), пише в VPS через postgres-meta /pg/query.
 * Дані не проходять через жоден проміжний файл.
 *
 *   node --env-file=.env scripts/migration/migrate.mjs schema
 *   node --env-file=.env scripts/migration/migrate.mjs data
 *   node --env-file=.env scripts/migration/migrate.mjs verify
 *
 * Потрібен драйвер pg. Якщо його немає в проєкті, вкажіть шлях:
 *   PGDIR=/шлях/до/node_modules node --env-file=.env ...
 */
import { createRequire } from 'node:module'

const require = createRequire((process.env.PGDIR || process.cwd() + '/node_modules') + '/')
const { Client } = require('pg')

const VPS = process.env.VPS_SUPABASE_URL
if (!process.env.VPS_SUPABASE_URL) { console.error('Немає VPS_SUPABASE_URL у .env'); process.exit(1) }
const VPS_KEY = process.env.SERVICE_LOCAL_KEY
const PROD_URL = (process.env.POSTGRES_URL_NON_POOLING || '').split('?')[0]

/** Таблиці, які не переносимо. */
const SKIP = new Set(['page_views', 'page_view_hashes'])

if (!VPS_KEY) { console.error('Немає SERVICE_LOCAL_KEY'); process.exit(1) }
if (!PROD_URL) { console.error('Немає POSTGRES_URL_NON_POOLING'); process.exit(1) }

// ── VPS ───────────────────────────────────────────────────────────────────
async function vps(sql) {
  const res = await fetch(`${VPS}/pg/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: VPS_KEY, Authorization: `Bearer ${VPS_KEY}` },
    body: JSON.stringify({ query: sql }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`VPS HTTP ${res.status}: ${text.slice(0, 500)}`)
  return JSON.parse(text)
}

// ── прод ──────────────────────────────────────────────────────────────────
const prod = new Client({
  connectionString: PROD_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
  statement_timeout: 120000,
})

/** Порядок вставки: батьки раніше за дітей (топологічне сортування по FK). */
async function tableOrder(tables) {
  const { rows } = await prod.query(`
    select c.relname as child, p.relname as parent
    from pg_constraint co
    join pg_class c on c.oid = co.conrelid
    join pg_class p on p.oid = co.confrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and co.contype = 'f' and c.relname <> p.relname`)

  const deps = new Map(tables.map(t => [t, new Set()]))
  for (const { child, parent } of rows) {
    if (deps.has(child) && deps.has(parent)) deps.get(child).add(parent)
  }

  const out = [], done = new Set()
  while (out.length < tables.length) {
    const ready = tables.filter(t => !done.has(t) && [...deps.get(t)].every(d => done.has(d)))
    if (!ready.length) {                       // цикл — доливаємо решту як є
      for (const t of tables) if (!done.has(t)) { out.push(t); done.add(t) }
      break
    }
    for (const t of ready) { out.push(t); done.add(t) }
  }
  return out
}

// ── схема: індекси, функції, тригери, RLS ────────────────────────────────
async function schema() {
  const steps = [
    ['індекси', `
      select coalesce(string_agg(
        regexp_replace(indexdef, '^CREATE (UNIQUE )?INDEX ', 'CREATE \\1INDEX IF NOT EXISTS ') || ';',
        E'\\n' order by indexname), '') as ddl
      from pg_indexes i where schemaname='public'
        and not exists (select 1 from pg_constraint co
          join pg_class ic on ic.oid = co.conindid
          join pg_namespace nn on nn.oid = ic.relnamespace
          where nn.nspname='public' and ic.relname = i.indexname)`],
    ['функції', `
      select coalesce(string_agg(pg_get_functiondef(p.oid) || ';', E'\\n') , '') as ddl
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname='public' and p.prokind = 'f'`],
    ['тригери', `
      select coalesce(string_agg(pg_get_triggerdef(tg.oid) || ';', E'\\n'), '') as ddl
      from pg_trigger tg join pg_class c on c.oid = tg.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname='public' and not tg.tgisinternal`],
    ['RLS', `
      select coalesce(string_agg(stmt, E'\\n'), '') as ddl from (
        select format('alter table public.%I enable row level security;', c.relname) as stmt
        from pg_class c join pg_namespace n on n.oid=c.relnamespace
        where n.nspname='public' and c.relkind='r' and c.relrowsecurity
        union all
        select format('create policy %I on public.%I as %s for %s to %s%s%s;',
          policyname, tablename, permissive, cmd, array_to_string(roles, ', '),
          coalesce(' using (' || qual || ')', ''),
          coalesce(' with check (' || with_check || ')', ''))
        from pg_policies where schemaname='public'
      ) t`],
  ]

  for (const [label, q] of steps) {
    const { rows } = await prod.query(q)
    const ddl = rows[0].ddl
    if (!ddl.trim()) { console.log(`  ${label}: нічого`); continue }
    await vps(ddl)
    console.log(`  ${label}: залито ${(ddl.length / 1024).toFixed(1)} КБ`)
  }
}

// ── дані ──────────────────────────────────────────────────────────────────
async function data() {
  const { rows: tabs } = await prod.query(`
    select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind='r' order by c.relname`)

  const names = tabs.map(r => r.relname).filter(t => !SKIP.has(t))
  const order = await tableOrder(names)

  let totalRows = 0
  for (const t of order) {
    const { rows: cols } = await prod.query(`
      select attname from pg_attribute
      where attrelid = $1::regclass and attnum > 0 and not attisdropped
      order by attnum`, [`public.${t}`])

    const collist = cols.map(c => `"${c.attname}"`).join(',')
    const quoted = cols.map(c => `quote_nullable("${c.attname}")`).join(`,','||`)

    // Постгрес сам будує літерали — жодного ручного екранування на боці JS
    const gen = `select 'insert into public."${t}" (${collist}) values (' || ${
      cols.map(c => `quote_nullable("${c.attname}")`).join(` || ',' || `)
    } || ');' as stmt from public."${t}"`

    const { rows } = await prod.query(gen)
    if (!rows.length) { console.log(`  ${t.padEnd(34)} 0`); continue }

    // батчами, щоб не впертись у ліміт розміру запиту
    let batch = [], sent = 0
    const flush = async () => {
      if (!batch.length) return
      await vps(batch.join('\n'))
      sent += batch.length
      batch = []
    }
    for (const r of rows) {
      batch.push(r.stmt)
      if (batch.join('\n').length > 400_000) await flush()
    }
    await flush()

    totalRows += sent
    console.log(`  ${t.padEnd(34)} ${sent}`)
  }
  console.log(`\n  разом ${totalRows} рядків`)

  console.log('\n  синхронізую послідовності')
  await vps(`
    do $$
    declare s record; tbl text; mx bigint;
    begin
      for s in select sequencename from pg_sequences where schemaname='public' loop
        tbl := regexp_replace(s.sequencename, '_id_seq$', '');
        if to_regclass('public.' || quote_ident(tbl)) is not null then
          execute format('select coalesce(max(id),0) from public.%I', tbl) into mx;
          perform setval('public.' || quote_ident(s.sequencename), greatest(mx, 1), mx > 0);
        end if;
      end loop;
    end $$;`)
}

// ── звірка ────────────────────────────────────────────────────────────────
async function verify() {
  const catalog = `
    select
      (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r') tables,
      (select count(*) from information_schema.columns where table_schema='public') columns,
      (select count(*) from pg_constraint co join pg_namespace n on n.oid=co.connamespace where n.nspname='public') constraints,
      (select count(*) from pg_indexes where schemaname='public') indexes,
      (select count(*) from pg_policies where schemaname='public') policies,
      (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public') functions,
      (select count(*) from pg_trigger tg join pg_class c on c.oid=tg.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not tg.tgisinternal) triggers`

  const a = (await prod.query(catalog)).rows[0]
  const b = (await vps(catalog))[0]

  console.log('\n  об’єкт          прод    VPS')
  let bad = 0
  for (const k of Object.keys(a)) {
    const same = String(a[k]) === String(b[k])
    if (!same) bad++
    console.log(`  ${k.padEnd(14)} ${String(a[k]).padStart(5)}  ${String(b[k]).padStart(5)}  ${same ? '✓' : '✗'}`)
  }

  const cnt = `select relname, n_live_tup from pg_stat_user_tables where schemaname='public' order by relname`
  const pa = new Map((await prod.query(cnt)).rows.map(r => [r.relname, Number(r.n_live_tup)]))
  const pb = new Map((await vps(cnt)).map(r => [r.relname, Number(r.n_live_tup)]))

  console.log('\n  розбіжності по рядках:')
  let diffs = 0
  for (const [t, n] of pa) {
    if (SKIP.has(t)) continue
    const m = pb.get(t) ?? 0
    if (n !== m) { console.log(`  ${t.padEnd(34)} прод ${n}, VPS ${m}`); diffs++ }
  }
  if (!diffs) console.log('  немає — усі таблиці збігаються')
  return bad + diffs
}

// ── ─────────────────────────────────────────────────────────────────────
const cmd = process.argv[2] || 'verify'
await prod.connect()
try {
  if (cmd === 'schema') { console.log('Схема:'); await schema() }
  else if (cmd === 'data') { console.log('Дані:'); await data() }
  else if (cmd === 'verify') { await verify() }
  else if (cmd === 'all') {
    console.log('Схема:'); await schema()
    console.log('\nДані:'); await data()
    console.log('\nЗвірка:'); await verify()
  } else { console.error(`Невідома команда: ${cmd}`); process.exit(1) }
} finally {
  await prod.end()
}
