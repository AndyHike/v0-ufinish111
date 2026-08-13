/**
 * Відновлення картинок із кешу оптимізатора Next.
 *
 * Storage проду віддає 402, оригінали звідти вже не забрати. Але Next кешує
 * оптимізовані варіанти в .next/cache/images, іменуючи теку як
 *   base64url(sha256(CACHE_VERSION + href + width + quality + mimeType))
 * — тобто ключ обчислюваний, і кеш можна зіставити з URL у базі.
 *
 *   node --env-file=.env scripts/migration/recover-images.mjs scan     — що знайшлось
 *   node --env-file=.env scripts/migration/recover-images.mjs recover  — залити в R2 + оновити базу
 *
 * Це НЕ оригінали: розмір обмежений тим, у якому вигляді картинку рендерили,
 * формат — avif/webp. Береться найбільша зі знайдених ширин.
 */
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'

const CACHE_VERSION = 4
const CACHE_DIR = '.next/cache/images'
const DEVICE_SIZES = [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
const IMAGE_SIZES = [16, 32, 48, 64, 96, 128, 256, 384]
const WIDTHS = [...new Set([...DEVICE_SIZES, ...IMAGE_SIZES])].sort((a, b) => b - a)
const QUALITIES = [75, 80, 85, 100]
const MIMES = ['image/avif', 'image/webp', '']

const VPS = process.env.VPS_SUPABASE_URL
if (!process.env.VPS_SUPABASE_URL) { console.error('Немає VPS_SUPABASE_URL у .env'); process.exit(1) }
const KEY = process.env.SERVICE_LOCAL_KEY

async function vps(sql) {
  const res = await fetch(`${VPS}/pg/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: KEY, Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ query: sql }),
  })
  const t = await res.text()
  if (!res.ok) throw new Error(`VPS ${res.status}: ${t.slice(0, 300)}`)
  return JSON.parse(t)
}

const hash = (href, width, quality, mime) => {
  const h = createHash('sha256')
  h.update(String(CACHE_VERSION)); h.update(href); h.update(String(width))
  h.update(String(quality)); h.update(mime)
  return h.digest('base64url')
}

/** Найбільший кешований варіант для даного href, або null. */
function findBest(href) {
  for (const w of WIDTHS) {
    for (const q of QUALITIES) {
      for (const m of MIMES) {
        const dir = join(CACHE_DIR, hash(href, w, q, m))
        if (!existsSync(dir)) continue
        const files = readdirSync(dir)
        if (!files.length) continue
        const f = files[0]
        const ext = f.split('.').pop()
        return { dir, file: join(dir, f), width: w, quality: q, mime: m, ext, size: statSync(join(dir, f)).size }
      }
    }
  }
  return null
}

async function targets() {
  return await vps(`
    select 'models' src, id, slug, image_url url from models where image_url like '%supabase.co%'
    union all select 'services', id, slug, image_url from services where image_url like '%supabase.co%'
    union all select 'brands', id, slug, logo_url from brands where logo_url like '%supabase.co%'`)
}

// ── scan ──────────────────────────────────────────────────────────────────
async function scan() {
  if (!existsSync(CACHE_DIR)) { console.error(`Немає ${CACHE_DIR}`); process.exit(1) }
  const total = readdirSync(CACHE_DIR).length
  const rows = await targets()
  console.log(`У кеші ${total} тек. Шукаю ${rows.length} картинок.\n`)

  let found = 0
  const byTable = {}
  for (const r of rows) {
    const hit = findBest(r.url)
    byTable[r.src] ??= { found: 0, total: 0 }
    byTable[r.src].total++
    if (hit) { found++; byTable[r.src].found++ }
  }

  for (const [t, s] of Object.entries(byTable)) {
    console.log(`  ${t.padEnd(10)} ${s.found}/${s.total}`)
  }
  console.log(`\n  разом знайдено ${found} з ${rows.length}`)
  if (found) {
    const sample = rows.map(r => [r, findBest(r.url)]).filter(([, h]) => h).slice(0, 3)
    console.log('\n  приклади:')
    for (const [r, h] of sample) {
      console.log(`  ${(r.slug || r.id).padEnd(28)} ${h.width}px ${h.ext} ${(h.size / 1024).toFixed(0)} КБ  q=${h.quality} ${h.mime || '(без mime)'}`)
    }
  }
}

// ── recover ───────────────────────────────────────────────────────────────
async function recover() {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
  const s3 = new S3Client({
    region: 'auto',
    endpoint: process.env.CLOUDFLARE_ENDPOINT_URL,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
      secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
    },
  })
  const BUCKET = process.env.CLOUDFLARE_BUCKET_NAME
  const PUBLIC = process.env.CLOUDFLARE_PUBLIC_URL
  if (!BUCKET || !PUBLIC) { console.error('Немає CLOUDFLARE_BUCKET_NAME / CLOUDFLARE_PUBLIC_URL'); process.exit(1) }

  const folder = { models: 'models', services: 'services', brands: 'brands' }
  const rows = await targets()
  const updates = []
  let ok = 0, miss = 0

  for (const r of rows) {
    const hit = findBest(r.url)
    if (!hit) { miss++; continue }

    const name = (r.slug || r.id).replace(/[^a-z0-9-]/gi, '-').toLowerCase()
    const key = `${folder[r.src]}/${name}.${hit.ext}`
    const body = readFileSync(hit.file)

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET, Key: key, Body: body,
      ContentType: hit.ext === 'avif' ? 'image/avif' : hit.ext === 'webp' ? 'image/webp' : 'image/png',
      CacheControl: 'public, max-age=31536000, immutable',
    }))

    const col = r.src === 'brands' ? 'logo_url' : 'image_url'
    updates.push(`update public.${r.src} set ${col} = '${PUBLIC}/${key}' where id = '${r.id}';`)
    ok++
    console.log(`  ✓ ${key.padEnd(46)} ${hit.width}px ${(body.length / 1024).toFixed(0)} КБ`)
  }

  if (updates.length) {
    await vps(updates.join('\n'))
    console.log(`\n  оновлено ${updates.length} рядків у базі`)
  }
  console.log(`  залито ${ok}, не знайдено в кеші ${miss}`)
}

const cmd = process.argv[2] || 'scan'
if (cmd === 'scan') await scan()
else if (cmd === 'recover') await recover()
else { console.error('scan | recover'); process.exit(1) }
