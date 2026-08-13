/**
 * Переносить файли Supabase Storage з проду в локальний Supabase.
 * Заливає через Storage API, тому записи в storage.objects створюються самі —
 * дамп схеми storage не потрібен.
 *
 * Запуск з кореня проєкту (щоб підхопився .env з продовими ключами):
 *
 *   LOCAL_URL=http://127.0.0.1:54321 LOCAL_SERVICE_KEY=<локальний service_role> \
 *     node --env-file=.env "шлях/до/4-storage-files.mjs"
 *
 * Для self-hosted docker LOCAL_URL зазвичай http://localhost:8000
 *
 * Прод читається лише на читання. Нічого там не змінюється.
 */
import { createClient } from '@supabase/supabase-js'

const SRC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SRC_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DST_URL = process.env.LOCAL_URL || process.env.VPS_SUPABASE_URL
const DST_KEY = process.env.LOCAL_SERVICE_KEY || process.env.SERVICE_LOCAL_KEY

for (const [k, v] of Object.entries({ SRC_URL, SRC_KEY, DST_URL, DST_KEY })) {
  if (!v) { console.error(`Немає ${k}`); process.exit(1) }
}
if (DST_URL.includes('supabase.co')) {
  console.error('LOCAL_URL вказує на хмару. Зупиняюсь, щоб не залити прод сам у себе.')
  process.exit(1)
}

const src = createClient(SRC_URL, SRC_KEY, { auth: { persistSession: false } })
const dst = createClient(DST_URL, DST_KEY, { auth: { persistSession: false } })

/** Рекурсивний обхід — list() віддає тільки один рівень. */
async function walk(bucket, prefix = '') {
  const out = []
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await src.storage.from(bucket).list(prefix, { limit: 1000, offset })
    if (error) throw new Error(`list ${bucket}/${prefix}: ${error.message}`)
    if (!data?.length) break
    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name
      if (item.id === null) out.push(...await walk(bucket, path))   // тека
      else if (item.name !== '.emptyFolderPlaceholder') out.push(path)
    }
    if (data.length < 1000) break
  }
  return out
}

const { data: buckets, error: bErr } = await src.storage.listBuckets()
if (bErr) throw new Error(`listBuckets: ${bErr.message}`)

let ok = 0, skip = 0, fail = 0, bytes = 0

for (const b of buckets) {
  const { error } = await dst.storage.createBucket(b.name, {
    public: b.public,
    fileSizeLimit: b.file_size_limit,
    allowedMimeTypes: b.allowed_mime_types,
  })
  if (error && !/already exists/i.test(error.message)) {
    console.error(`бакет ${b.name}: ${error.message}`); continue
  }

  const paths = await walk(b.name)
  console.log(`\n[${b.name}] ${paths.length} файлів (public=${b.public})`)

  for (const path of paths) {
    const dl = await src.storage.from(b.name).download(path)
    if (dl.error) { console.error(`  ✗ ${path}: ${dl.error.message}`); fail++; continue }

    const buf = Buffer.from(await dl.data.arrayBuffer())
    const up = await dst.storage.from(b.name).upload(path, buf, {
      contentType: dl.data.type || 'application/octet-stream',
      cacheControl: '31536000',   // рік замість години — на локальній некритично, але хай буде правильно
      upsert: true,
    })
    if (up.error) { console.error(`  ✗ ${path}: ${up.error.message}`); fail++; continue }

    bytes += buf.length
    ok++
    process.stdout.write(`  ✓ ${path} (${(buf.length / 1024).toFixed(0)} КБ)\n`)
  }
}

console.log(`\nПеренесено ${ok}, пропущено ${skip}, помилок ${fail}, ${(bytes / 1024 / 1024).toFixed(1)} МБ`)
console.log('Очікувано: 128 файлів, ~9.6 МБ у 3 бакетах (site-assets, brand-logos, phone-image)')
if (fail) process.exit(1)
