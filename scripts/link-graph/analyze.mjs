#!/usr/bin/env node
/**
 * Internal link-graph analyzer for the main devicehelp.cz site.
 *
 * Reconstructs the full internal-link graph from the linking rules encoded in
 * the page templates (app/[locale]/...) plus live catalog data (Supabase),
 * WITHOUT crawling the site. Computes per-page SEO metrics (unique in/outlinks,
 * click depth from home, PageRank) and prints a weak-spot report.
 *
 * Read-only: touches nothing in the app. See scripts/link-graph/README.md.
 *
 * Usage:
 *   node scripts/link-graph/analyze.mjs                       # live data, full report
 *   node scripts/link-graph/analyze.mjs --label before        # name the snapshot
 *   node scripts/link-graph/analyze.mjs --export-data d.json  # dump raw entities
 *   node scripts/link-graph/analyze.mjs --data d.json         # offline, from a dump
 *   node scripts/link-graph/analyze.mjs --compare a.json b.json  # diff two snapshots
 *
 * The linking rules mirrored here were confirmed against the templates on the
 * `baner` branch (2026-07). If a template's links change, update the matching
 * build*Edges function AND bump RULES_REVISION.
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"
import Graph from "graphology"
import pagerank from "graphology-metrics/centrality/pagerank.js"

const RULES_REVISION = "2026-07-09c" // + home popular repairs anchored on the iPhone series (profitability, not catalog position)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, "..", "..")
const DEFAULT_OUT_DIR = path.join(__dirname, "output")

const POS_MAX = 999999
const DAMPING = 0.85

// How many <a> tags per page each sitewide layout block contributes to a target.
// Only affects the "total links" counter; unique links / PageRank / depth use
// the deduplicated graph.
const LAYOUT_MULT = {
  home: 3, // header logo + sheet-menu Home + mobile bottom-nav Home
  brandsIndex: 4, // header nav + sheet + mobile nav + footer
  articlesIndex: 4, // header nav + sheet + mobile nav + footer
  contact: 5, // header nav + sheet + mobile nav + footer x2
  footerHub: 1, // footer "popular repairs" column -> brand x service hubs
  legal: 1, // footer company column
}

// Featured "money" services (lib/seo/featured-repairs.ts): footer hub links
// (featured x brands, max 6) and the home popular-repairs block (featured x
// top-6 models). Fallback fills by position with a minimum pair coverage.
const FEATURED_SERVICE_SLUGS = ["screen-replacement", "battery-replacement"]
const FEATURED_COUNT = 2
const FEATURED_MIN_PAIRS = 50
const FOOTER_HUB_LINKS_MAX = 6
const POPULAR_REPAIRS_MODELS = 6
// Home popular-repairs block anchors on these series first (owner's most
// profitable devices); catalog position only breaks ties within/after them.
const FEATURED_SERIES_SLUGS = ["iphone"]

// Segmented sitemap (lib/seo/main-sitemap.ts): the services segment carries
// only the top-N service-model pages by internal PageRank.
const SERVICE_MODEL_SITEMAP_LIMIT = 1200

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {
    locale: "cs",
    out: DEFAULT_OUT_DIR,
    label: null,
    data: null,
    exportData: null,
    emitRanking: null,
    compare: null,
    topN: 20,
  }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    switch (a) {
      case "--locale":
        args.locale = argv[++i]
        break
      case "--out":
        args.out = path.resolve(argv[++i])
        break
      case "--label":
        args.label = argv[++i]
        break
      case "--data":
        args.data = path.resolve(argv[++i])
        break
      case "--export-data":
        args.exportData = path.resolve(argv[++i])
        break
      case "--emit-ranking":
        args.emitRanking = path.resolve(argv[++i])
        break
      case "--top":
        args.topN = Number(argv[++i]) || 20
        break
      case "--compare":
        args.compare = [path.resolve(argv[++i]), path.resolve(argv[++i])]
        break
      case "--help":
      case "-h":
        printHelp()
        process.exit(0)
        break
      default:
        console.error(`Unknown argument: ${a}`)
        printHelp()
        process.exit(1)
    }
  }
  return args
}

function printHelp() {
  console.log(`Internal link-graph analyzer (no crawling; templates + data).

Usage:
  node scripts/link-graph/analyze.mjs [options]         analyze & report
  node scripts/link-graph/analyze.mjs --compare A B     diff two snapshot JSONs

Options:
  --locale <cs|uk|en>   locale to model (default cs; structure is identical)
  --label <name>        snapshot label (default: timestamp)
  --out <dir>           output dir (default scripts/link-graph/output)
  --data <file.json>    use a raw-data dump instead of live Supabase
  --export-data <file>  also dump the fetched raw entities to JSON
  --emit-ranking <file> write service-model pages ranked by PageRank (consumed
                        by lib/seo/main-sitemap.ts, commit the file)
  --top <n>             size of top/anti-top lists (default 20)

Outputs: console report, pages-<label>.csv, snapshot-<label>.json`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Env + data loading
// ─────────────────────────────────────────────────────────────────────────────

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return {}
  const out = {}
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!m) continue
    let v = m[2]
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    out[m[1]] = v
  }
  return out
}

function getSupabase() {
  const env = { ...loadEnvFile(path.join(REPO_ROOT, ".env")), ...loadEnvFile(path.join(REPO_ROOT, ".env.local")), ...process.env }
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key || url.includes("placeholder")) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (checked .env, .env.local, process.env).")
    console.error("Alternatively run with --data <dump.json> produced earlier via --export-data.")
    process.exit(1)
  }
  return createClient(url, key, { auth: { persistSession: false } })
}

/** Page through a table; supabase caps a single select at ~1000 rows. */
async function fetchAll(supabase, table, columns, modify) {
  const PAGE = 1000
  const rows = []
  for (let from = 0; ; from += PAGE) {
    let q = supabase.from(table).select(columns).range(from, from + PAGE - 1)
    if (modify) q = modify(q)
    const { data, error } = await q
    if (error) throw new Error(`fetch ${table}: ${error.message}`)
    rows.push(...(data || []))
    if (!data || data.length < PAGE) break
  }
  return rows
}

async function loadLiveData() {
  const supabase = getSupabase()
  process.stderr.write("Fetching catalog data from Supabase")
  const tick = () => process.stderr.write(".")

  const brands = await fetchAll(supabase, "brands", "id, name, slug, position", (q) => q.order("id"))
  tick()
  const series = await fetchAll(supabase, "series", "id, name, slug, brand_id, position", (q) => q.order("id"))
  tick()
  const models = await fetchAll(supabase, "models", "id, name, slug, brand_id, series_id, position", (q) => q.order("id"))
  tick()
  const services = await fetchAll(supabase, "services", "id, slug, position", (q) => q.order("id"))
  tick()
  const modelServices = await fetchAll(supabase, "model_services", "model_id, service_id", (q) =>
    q.order("model_id").order("service_id"),
  )
  tick()
  const articles = await fetchAll(supabase, "articles", "id, slug, published, published_at", (q) => q.order("id"))
  tick()
  const articleTranslations = await fetchAll(supabase, "article_translations", "article_id, locale, slug", (q) =>
    q.order("article_id"),
  )
  tick()
  let articleServiceLinks = []
  try {
    articleServiceLinks = await fetchAll(supabase, "article_service_links", "article_id, service_id, position", (q) =>
      q.order("article_id"),
    )
  } catch {
    try {
      articleServiceLinks = await fetchAll(supabase, "article_service_links", "article_id, service_id", (q) =>
        q.order("article_id"),
      )
    } catch {
      // table may not be readable with anon key; treated as "no recommendations"
    }
  }
  tick()
  let legalDocuments = []
  try {
    legalDocuments = await fetchAll(supabase, "legal_documents", "slug, is_active, sort_order", (q) => q.order("sort_order"))
  } catch {
    // same: absence just removes legal nodes
  }
  process.stderr.write(" done\n")

  return {
    fetchedAt: new Date().toISOString(),
    brands,
    series,
    models,
    services,
    modelServices,
    articles,
    articleTranslations,
    articleServiceLinks,
    legalDocuments,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Graph construction
// ─────────────────────────────────────────────────────────────────────────────

const byPosition = (a, b) =>
  (a.position ?? POS_MAX) - (b.position ?? POS_MAX) || String(a.name ?? a.slug ?? "").localeCompare(String(b.name ?? b.slug ?? ""))

const lower = (s) => String(s).toLowerCase()
const hasSlug = (e) => typeof e.slug === "string" && e.slug.trim() !== ""

/**
 * Builds the node universe, the edge multiset and the alias map for one locale.
 * Node id = canonical path WITHOUT the locale prefix ("/" = home).
 */
function buildGraphModel(data, locale) {
  const notes = [] // dynamic assumption notes surfaced in the report/snapshot

  const brands = data.brands.filter(hasSlug)
  const series = data.series.filter(hasSlug)
  const models = data.models.filter(hasSlug)
  const services = data.services.filter(hasSlug)

  const skippedNoSlug = {
    brands: data.brands.length - brands.length,
    series: data.series.length - series.length,
    models: data.models.length - models.length,
    services: data.services.length - services.length,
  }
  for (const [k, v] of Object.entries(skippedNoSlug)) {
    if (v > 0) notes.push(`${v} ${k} without a slug excluded (no canonical URL, matches sitemap behavior)`)
  }

  const brandById = new Map(brands.map((b) => [b.id, b]))
  const seriesById = new Map(series.map((s) => [s.id, s]))
  const modelById = new Map(models.map((m) => [m.id, m]))
  const serviceById = new Map(services.map((s) => [s.id, s]))

  // model_services pairs restricted to entities that actually have slugs
  const pairs = data.modelServices.filter((ms) => modelById.has(ms.model_id) && serviceById.has(ms.service_id))
  // dedupe (defensive: the table should be unique per pair already)
  const pairKeys = new Set()
  const uniquePairs = []
  for (const p of pairs) {
    const k = `${p.model_id}|${p.service_id}`
    if (pairKeys.has(k)) continue
    pairKeys.add(k)
    uniquePairs.push(p)
  }

  const servicesByModel = new Map() // model_id -> service[]
  const modelsByService = new Map() // service_id -> model[]
  for (const p of uniquePairs) {
    if (!servicesByModel.has(p.model_id)) servicesByModel.set(p.model_id, [])
    servicesByModel.get(p.model_id).push(serviceById.get(p.service_id))
    if (!modelsByService.has(p.service_id)) modelsByService.set(p.service_id, [])
    modelsByService.get(p.service_id).push(modelById.get(p.model_id))
  }
  for (const list of servicesByModel.values()) list.sort(byPosition)

  // Articles: canonical URL per locale uses the translation slug (sitemap rule);
  // templates link by the BASE articles.slug -> alias map resolves those.
  const published = data.articles
    .filter((a) => a.published)
    .sort((a, b) => String(b.published_at ?? "").localeCompare(String(a.published_at ?? "")) || String(a.id).localeCompare(String(b.id)))
  const translationByArticle = new Map()
  for (const t of data.articleTranslations) {
    if (t.locale === locale && typeof t.slug === "string" && t.slug.trim() !== "") {
      translationByArticle.set(t.article_id, t.slug)
    }
  }
  const articleCanonicalSlug = (a) => translationByArticle.get(a.id) ?? null

  const activeLegal = (data.legalDocuments || []).filter((d) => d.is_active && hasSlug(d))
  const legalPath = (slug) => (slug === "privacy" ? "/privacy" : slug === "terms" ? "/terms" : `/legal/${slug}`)

  // ── paths ──
  const brandPath = (b) => `/brands/${lower(b.slug)}`
  const seriesPath = (s) => `/series/${lower(s.slug)}`
  const modelPath = (m) => `/models/${m.slug}`
  const servicePath = (s) => `/services/${s.slug}`
  const serviceModelPath = (svc, m) => `/services/${svc.slug}/${m.slug}`
  const brandHubPath = (svc, b) => `/services/${svc.slug}/brand/${lower(b.slug)}`
  const seriesHubPath = (svc, s) => `/services/${svc.slug}/series/${lower(s.slug)}`

  // ── nodes ──
  const nodes = new Map() // path -> { type }
  const addNode = (p, type) => {
    if (!nodes.has(p)) nodes.set(p, { type })
  }

  addNode("/", "home")
  addNode("/brands", "brands-index")
  addNode("/articles", "articles-index")
  addNode("/contact", "contact")
  for (const b of brands) addNode(brandPath(b), "brand")
  for (const s of series) addNode(seriesPath(s), "series")
  for (const m of models) addNode(modelPath(m), "model")
  for (const s of services) addNode(servicePath(s), "service")
  for (const p of uniquePairs) addNode(serviceModelPath(serviceById.get(p.service_id), modelById.get(p.model_id)), "service-model")

  const brandHubSet = new Map() // path -> {svc, brand}
  const seriesHubSet = new Map() // path -> {svc, series}
  for (const p of uniquePairs) {
    const m = modelById.get(p.model_id)
    const svc = serviceById.get(p.service_id)
    const b = brandById.get(m.brand_id)
    if (b) {
      const hp = brandHubPath(svc, b)
      addNode(hp, "service-brand-hub")
      brandHubSet.set(hp, { svc, brand: b })
    }
    const s = m.series_id ? seriesById.get(m.series_id) : null
    if (s) {
      const hp = seriesHubPath(svc, s)
      addNode(hp, "service-series-hub")
      seriesHubSet.set(hp, { svc, series: s })
    }
  }

  const articleNodesById = new Map()
  for (const a of published) {
    const slug = articleCanonicalSlug(a)
    if (!slug) continue
    const p = `/articles/${slug}`
    addNode(p, "article")
    articleNodesById.set(a.id, p)
  }
  const articlesWithoutLocaleSlug = published.length - articleNodesById.size
  if (articlesWithoutLocaleSlug > 0) {
    notes.push(`${articlesWithoutLocaleSlug} published articles have no '${locale}' translation slug -> no canonical page in this locale`)
  }

  for (const d of activeLegal) addNode(legalPath(d.slug), "legal")

  // Alias map: base article slug URL -> canonical translation URL. Templates
  // (articles listing + RelatedArticlesList) link `/articles/{articles.slug}`.
  const aliases = new Map()
  for (const a of published) {
    const canonical = articleNodesById.get(a.id)
    if (!canonical || !hasSlug(a)) continue
    const basePath = `/articles/${a.slug}`
    if (basePath !== canonical && !nodes.has(basePath)) aliases.set(basePath, canonical)
  }

  // ── edges ──
  const edges = new Map() // from -> Map(to -> totalCount)
  let aliasResolved = 0
  const unresolved = new Map() // wanted target -> count (links whose target page doesn't exist)

  const addLink = (from, to, mult = 1) => {
    if (to == null) return
    let target = to
    if (!nodes.has(target)) {
      if (aliases.has(target)) {
        target = aliases.get(target)
        aliasResolved += mult
      } else {
        unresolved.set(to, (unresolved.get(to) || 0) + mult)
        return
      }
    }
    if (from === target) return // self-links don't count
    let m = edges.get(from)
    if (!m) edges.set(from, (m = new Map()))
    m.set(target, (m.get(target) || 0) + mult)
  }

  // Featured "money" services (mirrors lib/seo/featured-repairs.ts).
  const pairCountByService = new Map()
  for (const p of uniquePairs) pairCountByService.set(p.service_id, (pairCountByService.get(p.service_id) || 0) + 1)
  const svcBySlug = new Map(services.map((s) => [s.slug, s]))
  const featuredServices = []
  for (const slug of FEATURED_SERVICE_SLUGS) {
    const s = svcBySlug.get(slug)
    if (s && (pairCountByService.get(s.id) || 0) > 0) featuredServices.push(s)
  }
  for (const s of [...services].sort(byPosition)) {
    if (featuredServices.length >= FEATURED_COUNT) break
    if (!featuredServices.includes(s) && (pairCountByService.get(s.id) || 0) >= FEATURED_MIN_PAIRS) featuredServices.push(s)
  }
  notes.push(`featured services for footer/home blocks: ${featuredServices.map((s) => s.slug).join(", ") || "(none)"}`)

  // Rule A: sitewide layout (header + mobile nav + footer) from EVERY page.
  // Footer "popular repairs" column: featured services x brands with offers ->
  // brand x service hubs (replaced the old hardcoded brand links).
  const footerHubPaths = []
  for (const svc of featuredServices) {
    const brandIds = new Set((modelsByService.get(svc.id) || []).map((m) => m.brand_id))
    for (const b of [...brands].sort(byPosition)) {
      if (footerHubPaths.length >= FOOTER_HUB_LINKS_MAX) break
      if (brandIds.has(b.id)) footerHubPaths.push(brandHubPath(svc, b))
    }
    if (footerHubPaths.length >= FOOTER_HUB_LINKS_MAX) break
  }
  const legalPaths = activeLegal.map((d) => legalPath(d.slug))

  const BREADCRUMB_TYPES = new Set([
    "brands-index",
    "brand",
    "series",
    "model",
    "service",
    "service-brand-hub",
    "service-series-hub",
    "service-model",
  ])

  for (const [p, info] of nodes) {
    addLink(p, "/", LAYOUT_MULT.home + (BREADCRUMB_TYPES.has(info.type) ? 1 : 0)) // + breadcrumb home icon
    addLink(p, "/brands", LAYOUT_MULT.brandsIndex)
    addLink(p, "/articles", LAYOUT_MULT.articlesIndex)
    addLink(p, "/contact", LAYOUT_MULT.contact)
    for (const fh of footerHubPaths) addLink(p, fh, LAYOUT_MULT.footerHub)
    for (const lp of legalPaths) addLink(p, lp, LAYOUT_MULT.legal)
  }

  // Rule B: home -> top-12 brands (getBrands limit 12, position then name) + hero.
  const sortedBrands = [...brands].sort(byPosition)
  for (const b of sortedBrands.slice(0, 12)) addLink("/", brandPath(b))
  // hero buttons (/brands, /articles, /contact) + BrandsSection "all brands" already merge into layout edges
  addLink("/", "/brands")
  addLink("/", "/articles")
  addLink("/", "/contact")
  // Popular repairs block (components/popular-repairs.tsx): featured services x
  // 6 models, anchored on the featured series (iPhone) first — in-series
  // position (newest first), catalog-wide position only fills a shortfall.
  const featuredSeriesIds = FEATURED_SERIES_SLUGS.map((sl) => series.find((s) => lower(s.slug) === sl)?.id).filter(Boolean)
  const seriesRankOf = (m) => {
    const i = featuredSeriesIds.indexOf(m.series_id)
    return i === -1 ? featuredSeriesIds.length : i
  }
  for (const svc of featuredServices) {
    const svcTop = [...(modelsByService.get(svc.id) || [])]
      .sort((a, b) => seriesRankOf(a) - seriesRankOf(b) || byPosition(a, b))
      .slice(0, POPULAR_REPAIRS_MODELS)
    for (const m of svcTop) addLink("/", serviceModelPath(svc, m))
  }

  // Top-6 services block (BrandSeoSections) reused on several page types.
  const top6 = [...services].sort(byPosition).slice(0, 6)
  const addSeoServicesBlock = (from) => {
    for (const s of top6) addLink(from, servicePath(s))
  }

  // Rule C: /brands -> all brands + seo services.
  for (const b of brands) addLink("/brands", brandPath(b))
  addSeoServicesBlock("/brands")

  // Group entities for prev/next chains and per-brand/series listings.
  const seriesByBrand = new Map()
  for (const s of series) {
    if (!seriesByBrand.has(s.brand_id)) seriesByBrand.set(s.brand_id, [])
    seriesByBrand.get(s.brand_id).push(s)
  }
  for (const list of seriesByBrand.values()) list.sort(byPosition)

  const modelsByBrand = new Map()
  const modelsBySeries = new Map()
  for (const m of models) {
    if (!modelsByBrand.has(m.brand_id)) modelsByBrand.set(m.brand_id, [])
    modelsByBrand.get(m.brand_id).push(m)
    if (m.series_id) {
      if (!modelsBySeries.has(m.series_id)) modelsBySeries.set(m.series_id, [])
      modelsBySeries.get(m.series_id).push(m)
    }
  }
  for (const list of modelsByBrand.values()) list.sort(byPosition)
  for (const list of modelsBySeries.values()) list.sort(byPosition)

  // Rule D: brand pages.
  for (let i = 0; i < sortedBrands.length; i++) {
    const b = sortedBrands[i]
    const from = brandPath(b)
    for (const s of seriesByBrand.get(b.id) || []) addLink(from, seriesPath(s))
    for (const m of modelsByBrand.get(b.id) || []) {
      if (!m.series_id) addLink(from, modelPath(m)) // ONLY series-less models are linked directly
    }
    // Fix 3: service chips -> brand x service hubs (all services available for
    // this brand's models), mirrors the series page's chips.
    const seenSvc = new Set()
    for (const m of modelsByBrand.get(b.id) || []) {
      for (const svc of servicesByModel.get(m.id) || []) {
        if (seenSvc.has(svc.id)) continue
        seenSvc.add(svc.id)
        addLink(from, brandHubPath(svc, b))
      }
    }
    addSeoServicesBlock(from)
    if (i > 0) addLink(from, brandPath(sortedBrands[i - 1])) // PrevNextNav
    if (i < sortedBrands.length - 1) addLink(from, brandPath(sortedBrands[i + 1]))
    // breadcrumb (/brands) is already a layout edge
  }

  // RelatedArticlesList: latest-3 published articles on model pages; on
  // service-model pages articles LINKED to the service (article_service_links,
  // position order) come first, filled to 3 with the latest.
  const latest3 = published.slice(0, 3)
  const latest3Paths = latest3.map((a) => (hasSlug(a) ? `/articles/${a.slug}` : null)).filter(Boolean)
  const addRelatedArticles = (from) => {
    for (const ap of latest3Paths) addLink(from, ap) // base slug; resolves via alias if it differs
  }
  const publishedById = new Map(published.map((a) => [a.id, a]))
  const linkedArticlesByService = new Map() // service_id -> published article[] in link order
  for (const l of [...(data.articleServiceLinks || [])].sort(
    (a, b) => (a.position ?? 999) - (b.position ?? 999) || String(a.article_id).localeCompare(String(b.article_id)),
  )) {
    const a = publishedById.get(l.article_id)
    if (!a) continue
    if (!linkedArticlesByService.has(l.service_id)) linkedArticlesByService.set(l.service_id, [])
    linkedArticlesByService.get(l.service_id).push(a)
  }
  const addRelatedArticlesForService = (from, serviceId) => {
    const picked = []
    const seenIds = new Set()
    for (const a of linkedArticlesByService.get(serviceId) || []) {
      if (picked.length >= 3) break
      if (hasSlug(a) && !seenIds.has(a.id)) {
        seenIds.add(a.id)
        picked.push(a)
      }
    }
    for (const a of latest3) {
      if (picked.length >= 3) break
      if (hasSlug(a) && !seenIds.has(a.id)) {
        seenIds.add(a.id)
        picked.push(a)
      }
    }
    for (const a of picked) addLink(from, `/articles/${a.slug}`)
  }

  // Rule E: series pages.
  for (const [brandId, list] of seriesByBrand) {
    const b = brandById.get(brandId)
    for (let i = 0; i < list.length; i++) {
      const s = list[i]
      const from = seriesPath(s)
      // service chips -> series x service hubs (all services available in this line)
      const seenSvc = new Set()
      for (const m of modelsBySeries.get(s.id) || []) {
        for (const svc of servicesByModel.get(m.id) || []) {
          if (seenSvc.has(svc.id)) continue
          seenSvc.add(svc.id)
          addLink(from, seriesHubPath(svc, s))
        }
      }
      for (const m of modelsBySeries.get(s.id) || []) addLink(from, modelPath(m))
      addSeoServicesBlock(from)
      if (b) addLink(from, brandPath(b)) // breadcrumb
      if (i > 0) addLink(from, seriesPath(list[i - 1])) // PrevNextNav within brand
      if (i < list.length - 1) addLink(from, seriesPath(list[i + 1]))
    }
  }

  // Rule F: model pages.
  for (const [brandId, list] of modelsByBrand) {
    const b = brandById.get(brandId)
    for (let i = 0; i < list.length; i++) {
      const m = list[i]
      const from = modelPath(m)
      for (const svc of servicesByModel.get(m.id) || []) addLink(from, serviceModelPath(svc, m)) // service cards
      const s = m.series_id ? seriesById.get(m.series_id) : null
      if (s) {
        addLink(from, seriesPath(s), 2) // up-link + breadcrumb
      }
      if (b) addLink(from, brandPath(b)) // breadcrumb
      addRelatedArticles(from)
      if (i > 0) addLink(from, modelPath(list[i - 1])) // PrevNextNav within brand (across series!)
      if (i < list.length - 1) addLink(from, modelPath(list[i + 1]))
    }
  }

  // Rule G: generic service pages. Device picker is <button>+router.push -> NOT
  // crawlable, but since Fix 1 a server-rendered catalog grid links the
  // service's brand hubs, series hubs and top-12 models directly.
  for (const svc of services) {
    const from = servicePath(svc)
    addSeoServicesBlock(from)
    const svcModels = modelsByService.get(svc.id) || []
    const seenB = new Set()
    const seenS = new Set()
    for (const m of svcModels) {
      const b = brandById.get(m.brand_id)
      if (b && !seenB.has(b.id)) {
        seenB.add(b.id)
        addLink(from, brandHubPath(svc, b))
      }
      const s = m.series_id ? seriesById.get(m.series_id) : null
      if (s && !seenS.has(s.id)) {
        seenS.add(s.id)
        addLink(from, seriesHubPath(svc, s))
      }
    }
    for (const m of [...svcModels].sort(byPosition).slice(0, 12)) addLink(from, serviceModelPath(svc, m))
  }

  // Rule H: brand x service hubs -> all brand models having the service.
  for (const [hubPath, { svc, brand: b }] of brandHubSet) {
    for (const m of modelsByService.get(svc.id) || []) {
      if (m.brand_id === b.id) addLink(hubPath, serviceModelPath(svc, m))
    }
    addLink(hubPath, brandPath(b)) // breadcrumb
  }

  // Rule I: series x service hubs.
  for (const [hubPath, { svc, series: s }] of seriesHubSet) {
    for (const m of modelsByService.get(svc.id) || []) {
      if (m.series_id === s.id) addLink(hubPath, serviceModelPath(svc, m))
    }
    const b = brandById.get(s.brand_id)
    if (b) addLink(hubPath, brandPath(b)) // breadcrumb
    addLink(hubPath, seriesPath(s), 2) // breadcrumb + up-link
    addLink(hubPath, servicePath(svc)) // up-link "all devices"
  }

  // Rule J: service x model money pages.
  for (const p of uniquePairs) {
    const m = modelById.get(p.model_id)
    const svc = serviceById.get(p.service_id)
    const from = serviceModelPath(svc, m)
    const b = brandById.get(m.brand_id)
    const s = m.series_id ? seriesById.get(m.series_id) : null

    if (b) addLink(from, brandPath(b)) // breadcrumb
    if (s) addLink(from, seriesPath(s), 2) // breadcrumb + up-link "all X models"
    addLink(from, modelPath(m)) // breadcrumb
    if (s) addLink(from, seriesHubPath(svc, s)) // up-link
    if (b) addLink(from, brandHubPath(svc, b)) // up-link
    addLink(from, servicePath(svc)) // up-link "all devices"

    // PrevNextNav: adjacent services of the same model
    const svcList = servicesByModel.get(m.id) || []
    const idx = svcList.findIndex((x) => x.id === svc.id)
    if (idx > 0) addLink(from, serviceModelPath(svcList[idx - 1], m))
    if (idx >= 0 && idx < svcList.length - 1) addLink(from, serviceModelPath(svcList[idx + 1], m))

    // Fix 2: sideways cluster — the same service on the ~12 closest-by-position
    // models of the same series (fallback: same brand). Mirrors nearby-models.tsx.
    const svcModels = modelsByService.get(svc.id) || []
    const pool = (s ? svcModels.filter((x) => x.series_id === s.id) : b ? svcModels.filter((x) => x.brand_id === b.id) : []).filter(
      (x) => x.id !== m.id,
    )
    const pos = m.position ?? POS_MAX
    const nearest = [...pool]
      .sort(
        (a, c) =>
          Math.abs((a.position ?? POS_MAX) - pos) - Math.abs((c.position ?? POS_MAX) - pos) ||
          (a.position ?? POS_MAX) - (c.position ?? POS_MAX) ||
          String(a.name).localeCompare(String(c.name)),
      )
      .slice(0, 12)
    for (const nm of nearest) addLink(from, serviceModelPath(svc, nm))

    addRelatedArticlesForService(from, svc.id)
    // CTA -> /contact and /book/confirm: contact is already a layout edge; /book* excluded by scope
  }

  // Rule K: articles.
  // /articles listing: latest 100 published, linked by BASE slug (alias-resolved).
  for (const a of published.slice(0, 100)) {
    if (hasSlug(a)) addLink("/articles", `/articles/${a.slug}`)
  }
  // Article detail pages: related articles (latest 3 excluding self) and
  // service recommendations (article_service_links). Both are client-rendered
  // after hydration -> flagged as an assumption.
  const linksByArticle = new Map()
  for (const l of data.articleServiceLinks || []) {
    if (!linksByArticle.has(l.article_id)) linksByArticle.set(l.article_id, [])
    linksByArticle.get(l.article_id).push(l.service_id)
  }
  for (const a of published) {
    const from = articleNodesById.get(a.id)
    if (!from) continue
    let added = 0
    for (const other of published) {
      if (other.id === a.id || !hasSlug(other)) continue
      addLink(from, `/articles/${other.slug}`)
      if (++added >= 3) break
    }
    for (const svcId of linksByArticle.get(a.id) || []) {
      const svc = serviceById.get(svcId)
      if (svc) addLink(from, servicePath(svc)) // note: template emits locale-less href; middleware 301s to locale
    }
  }

  // ── sitemap universe (mirrors the SEGMENTED lib/seo/main-sitemap.ts) ──
  // Base = core + hubs + articles segments. The services segment (top-N
  // service-model by PageRank) is appended in the main flow once PageRank is
  // computed — see assembleSitemap().
  const sitemapBase = new Set(["/", "/contact", "/brands", "/articles"])
  for (const b of brands) sitemapBase.add(brandPath(b))
  for (const s of series) sitemapBase.add(`/series/${s.slug}`) // sitemap does NOT lowercase series here
  for (const m of models) sitemapBase.add(modelPath(m))
  const servicesWithPairs = new Set(uniquePairs.map((p) => p.service_id))
  for (const s of services) {
    if (servicesWithPairs.has(s.id)) sitemapBase.add(servicePath(s)) // zero-pair services stay out (thin dead-ends)
  }
  for (const p of uniquePairs) {
    const m = modelById.get(p.model_id)
    const svc = serviceById.get(p.service_id)
    const b = brandById.get(m.brand_id)
    if (b) sitemapBase.add(brandHubPath(svc, b))
    const s = m.series_id ? seriesById.get(m.series_id) : null
    if (s) sitemapBase.add(seriesHubPath(svc, s))
  }
  for (const a of published) {
    const slug = articleCanonicalSlug(a)
    if (slug) sitemapBase.add(`/articles/${slug}`)
  }

  return {
    nodes,
    edges,
    aliases,
    aliasResolved,
    unresolved,
    sitemapBase,
    notes,
    latest3Slugs: latest3.map((a) => a.slug),
    counts: {
      brands: brands.length,
      series: series.length,
      models: models.length,
      services: services.length,
      modelServicePairs: uniquePairs.length,
      publishedArticles: published.length,
      legalDocuments: activeLegal.length,
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Metrics
// ─────────────────────────────────────────────────────────────────────────────

function computeMetrics(model) {
  const { nodes, edges } = model

  const graph = new Graph({ type: "directed", multi: false, allowSelfLoops: false })
  for (const [p, info] of nodes) graph.addNode(p, { type: info.type })
  for (const [from, targets] of edges) {
    for (const [to, count] of targets) {
      graph.addEdge(from, to, { count })
    }
  }

  // BFS depth from home over unique links.
  const depth = new Map([["/", 0]])
  const queue = ["/"]
  for (let qi = 0; qi < queue.length; qi++) {
    const cur = queue[qi]
    const d = depth.get(cur)
    const targets = edges.get(cur)
    if (!targets) continue
    for (const to of targets.keys()) {
      if (!depth.has(to)) {
        depth.set(to, d + 1)
        queue.push(to)
      }
    }
  }

  const pr = pagerank(graph, { alpha: DAMPING, maxIterations: 200, tolerance: 1e-9 })

  // Per-node stats
  const stats = new Map()
  for (const [p, info] of nodes) {
    stats.set(p, {
      type: info.type,
      inUnique: 0,
      outUnique: 0,
      inTotal: 0,
      outTotal: 0,
      depth: depth.has(p) ? depth.get(p) : null,
      pagerank: pr[p] ?? 0,
      inBySourceType: {},
    })
  }
  for (const [from, targets] of edges) {
    const fromType = nodes.get(from).type
    const fromStat = stats.get(from)
    for (const [to, count] of targets) {
      const toStat = stats.get(to)
      fromStat.outUnique++
      fromStat.outTotal += count
      toStat.inUnique++
      toStat.inTotal += count
      toStat.inBySourceType[fromType] = (toStat.inBySourceType[fromType] || 0) + 1
    }
  }

  return { graph, stats }
}

/**
 * Final sitemap set = base (core+hubs+articles segments) + top-N service-model
 * pages by PageRank (the services segment). Mirrors lib/seo/main-sitemap.ts.
 */
function assembleSitemap(model, stats) {
  const moneyRanked = [...stats.entries()]
    .filter(([, s]) => s.type === "service-model")
    .sort((a, b) => b[1].pagerank - a[1].pagerank || a[0].localeCompare(b[0]))
    .map(([p]) => p)
  const inSitemap = moneyRanked.slice(0, SERVICE_MODEL_SITEMAP_LIMIT)
  model.sitemap = new Set([...model.sitemapBase, ...inSitemap])
  model.serviceModelRanked = moneyRanked
  model.sitemapTailCount = Math.max(0, moneyRanked.length - inSitemap.length)
}

const depthBucket = (d) => (d === null ? "unreachable" : d <= 4 ? String(d) : "5+")
const inlinksBucket = (n) => (n === 0 ? "0" : n === 1 ? "1" : n <= 5 ? "2-5" : n <= 20 ? "6-20" : "21+")
const DEPTH_BUCKETS = ["0", "1", "2", "3", "4", "5+", "unreachable"]
const INLINK_BUCKETS = ["0", "1", "2-5", "6-20", "21+"]

function distributions(stats) {
  const depthDist = Object.fromEntries(DEPTH_BUCKETS.map((b) => [b, 0]))
  const inDist = Object.fromEntries(INLINK_BUCKETS.map((b) => [b, 0]))
  const byType = {}
  for (const [, s] of stats) {
    depthDist[depthBucket(s.depth)]++
    inDist[inlinksBucket(s.inUnique)]++
    const t = (byType[s.type] ||= { count: 0, inSum: 0, outSum: 0, depthSum: 0, depthN: 0, prSum: 0 })
    t.count++
    t.inSum += s.inUnique
    t.outSum += s.outUnique
    t.prSum += s.pagerank
    if (s.depth !== null) {
      t.depthSum += s.depth
      t.depthN++
    }
  }
  for (const t of Object.values(byType)) {
    t.avgInlinks = t.inSum / t.count
    t.avgOutlinks = t.outSum / t.count
    t.avgDepth = t.depthN ? t.depthSum / t.depthN : null
    t.avgPagerank = t.prSum / t.count
    delete t.inSum
    delete t.outSum
    delete t.depthSum
    delete t.depthN
    delete t.prSum
  }
  return { depthDist, inDist, byType }
}

// ─────────────────────────────────────────────────────────────────────────────
// Report
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (n, d = 2) => (n === null || n === undefined ? "—" : typeof n === "number" ? n.toFixed(d) : String(n))
const pct = (a, b) => (b ? ((100 * a) / b).toFixed(1) + "%" : "—")

function table(rows, header) {
  const all = [header, ...rows.map((r) => r.map((c) => String(c)))]
  const widths = header.map((_, i) => Math.max(...all.map((r) => r[i].length)))
  const line = (r) => "  " + r.map((c, i) => c.padEnd(widths[i])).join("  ")
  const out = [line(header), "  " + widths.map((w) => "-".repeat(w)).join("  ")]
  for (const r of rows) out.push(line(r.map((c) => String(c))))
  return out.join("\n")
}

function section(title) {
  console.log(`\n${"═".repeat(78)}\n  ${title}\n${"═".repeat(78)}`)
}

function printReport({ model, stats, args, dists }) {
  const { nodes } = model
  const totalNodes = nodes.size
  let totalUniqueEdges = 0
  let totalLinks = 0
  for (const targets of model.edges.values()) {
    totalUniqueEdges += targets.size
    for (const c of targets.values()) totalLinks += c
  }

  section(`LINK GRAPH — locale=${args.locale}, ${totalNodes} pages, ${totalUniqueEdges} unique links (${totalLinks} total)`)
  console.log(
    table(
      Object.entries(dists.byType)
        .sort((a, b) => b[1].count - a[1].count)
        .map(([t, v]) => [t, v.count]),
      ["page type", "pages"],
    ),
  )

  section("1. Click depth distribution (BFS from home)")
  console.log(
    table(
      DEPTH_BUCKETS.filter((b) => dists.depthDist[b] > 0 || b === "unreachable").map((b) => [
        b,
        dists.depthDist[b],
        pct(dists.depthDist[b], totalNodes),
      ]),
      ["depth", "pages", "share"],
    ),
  )

  section("2. Unique inlinks distribution")
  console.log(
    table(
      INLINK_BUCKETS.map((b) => [b, dists.inDist[b], pct(dists.inDist[b], totalNodes)]),
      ["inlinks", "pages", "share"],
    ),
  )

  const sorted = [...stats.entries()].sort((a, b) => b[1].pagerank - a[1].pagerank)

  section(`3a. Top-${args.topN} pages by PageRank (damping ${DAMPING})`)
  console.log(
    table(
      sorted.slice(0, args.topN).map(([p, s], i) => [i + 1, p, s.type, (s.pagerank * 100).toFixed(3) + "%", s.inUnique, s.depth ?? "—"]),
      ["#", "url", "type", "PR", "in", "depth"],
    ),
  )

  const moneyPages = sorted.filter(([, s]) => s.type === "service-model")
  section(`3b. Anti-top-${args.topN}: weakest service-model (money) pages by PageRank`)
  console.log(
    table(
      moneyPages
        .slice(-args.topN)
        .reverse()
        .map(([p, s], i) => [i + 1, p, (s.pagerank * 100).toFixed(4) + "%", s.inUnique, s.depth ?? "—"]),
      ["#", "url", "PR", "in", "depth"],
    ),
  )

  section("4. Orphan pages (0 unique inlinks)")
  const orphans = [...stats.entries()].filter(([, s]) => s.inUnique === 0)
  if (orphans.length === 0) console.log("  none 🎉")
  else {
    console.log(`  ${orphans.length} pages:`)
    console.log(table(orphans.slice(0, 50).map(([p, s]) => [p, s.type]), ["url", "type"]))
    if (orphans.length > 50) console.log(`  … and ${orphans.length - 50} more (see CSV)`)
  }

  section("5. Averages by page type")
  console.log(
    table(
      Object.entries(dists.byType)
        .sort((a, b) => b[1].count - a[1].count)
        .map(([t, v]) => [t, v.count, fmt(v.avgInlinks), fmt(v.avgOutlinks), fmt(v.avgDepth), (v.avgPagerank * 100).toFixed(4) + "%"]),
      ["type", "pages", "avg in", "avg out", "avg depth", "avg PR"],
    ),
  )

  section("6. Where do inlinks come from (avg per page, by source type)")
  for (const targetType of ["model", "service-model"]) {
    const pages = [...stats.values()].filter((s) => s.type === targetType)
    const agg = {}
    for (const s of pages) for (const [st, c] of Object.entries(s.inBySourceType)) agg[st] = (agg[st] || 0) + c
    const totalIn = Object.values(agg).reduce((a, b) => a + b, 0)
    console.log(`\n  → ${targetType} pages (${pages.length}):`)
    console.log(
      table(
        Object.entries(agg)
          .sort((a, b) => b[1] - a[1])
          .map(([st, c]) => [st, fmt(c / pages.length), pct(c, totalIn)]),
        ["source type", "avg inlinks/page", "share"],
      ),
    )
  }

  section("7. Sitemap cross-check (vs segmented lib/seo/main-sitemap.ts)")
  const inSitemapZeroIn = []
  const inSitemapNotInGraph = []
  for (const u of model.sitemap) {
    const s = stats.get(u)
    if (!s) inSitemapNotInGraph.push(u)
    else if (s.inUnique === 0) inSitemapZeroIn.push(u)
  }
  const reachableNotInSitemap = [...stats.entries()].filter(([p, s]) => s.depth !== null && !model.sitemap.has(p))
  // The service-model tail beyond the top-N is out of the sitemap BY DESIGN
  // (still reachable + indexable, just not requested) — report it as a count,
  // list only the unexpected leftovers.
  const expectedTail = reachableNotInSitemap.filter(([, s]) => s.type === "service-model")
  const unexpectedMissing = reachableNotInSitemap.filter(([, s]) => s.type !== "service-model")
  console.log(
    `  sitemap URLs (this locale): ${model.sitemap.size}   graph nodes: ${totalNodes}   services segment: top ${SERVICE_MODEL_SITEMAP_LIMIT} of ${model.serviceModelRanked.length} by PageRank`,
  )
  console.log(`\n  a) in sitemap but 0 inlinks in graph: ${inSitemapZeroIn.length}`)
  for (const u of inSitemapZeroIn.slice(0, 30)) console.log(`     ${u}`)
  if (inSitemapZeroIn.length > 30) console.log(`     … and ${inSitemapZeroIn.length - 30} more`)
  console.log(`\n  b) reachable but not in sitemap — expected service-model tail: ${expectedTail.length} (by design), other: ${unexpectedMissing.length}`)
  for (const [u, s] of unexpectedMissing.slice(0, 30)) console.log(`     ${u}  (${s.type})`)
  if (unexpectedMissing.length > 30) console.log(`     … and ${unexpectedMissing.length - 30} more`)
  console.log(`\n  c) in sitemap but not a node in the graph universe: ${inSitemapNotInGraph.length}`)
  for (const u of inSitemapNotInGraph.slice(0, 30)) console.log(`     ${u}`)
  if (inSitemapNotInGraph.length > 30) console.log(`     … and ${inSitemapNotInGraph.length - 30} more`)

  section("8. Assumptions & data notes")
  const staticAssumptions = [
    `Device picker on /services/{slug} is buttons + router.push (not crawlable); the SSR catalog grid below it (Fix 1) provides the crawlable hub/model links.`,
    `RelatedArticlesList = 3 newest published articles at render time; this run used: ${model.latest3Slugs.join(", ") || "(none)"}.`,
    `Article-page blocks (related articles, service recommendations) are client-rendered after hydration — counted, but invisible without JS.`,
    `Article links in templates use the BASE articles.slug; canonical pages use the '${args.locale}' translation slug. ${model.aliasResolved} link occurrences resolved via that alias (each is a 404-or-redirect risk if slugs diverge).`,
    `PrevNext ordering ties broken by name (templates rely on DB return order for equal positions).`,
    `Links inside article HTML bodies are NOT parsed (v1).`,
    `/book*, /auth*, /profile, /faq excluded by scope. Multiplicities of layout links are estimates (unique-link metrics unaffected).`,
  ]
  for (const n of [...staticAssumptions, ...model.notes]) console.log(`  • ${n}`)
  if (model.unresolved.size > 0) {
    const totalSkipped = [...model.unresolved.values()].reduce((a, b) => a + b, 0)
    console.log(`  • ${totalSkipped} link occurrences point to non-existent pages (skipped):`)
    for (const [u, c] of [...model.unresolved.entries()].slice(0, 15)) console.log(`      ${u}  ×${c}`)
    if (model.unresolved.size > 15) console.log(`      … and ${model.unresolved.size - 15} more targets`)
  }

  return {
    inSitemapZeroIn,
    expectedServiceModelTail: expectedTail.length,
    reachableNotInSitemap: unexpectedMissing.map(([p]) => p),
    inSitemapNotInGraph,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Outputs
// ─────────────────────────────────────────────────────────────────────────────

function csvEscape(v) {
  const s = String(v ?? "")
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function writeCsv(file, stats) {
  const rows = [["url", "type", "inlinks_unique", "outlinks_unique", "inlinks_total", "depth", "pagerank"]]
  const sorted = [...stats.entries()].sort((a, b) => b[1].pagerank - a[1].pagerank)
  for (const [p, s] of sorted) {
    rows.push([p, s.type, s.inUnique, s.outUnique, s.inTotal, s.depth ?? "", s.pagerank.toExponential(6)])
  }
  fs.writeFileSync(file, rows.map((r) => r.map(csvEscape).join(",")).join("\n") + "\n", "utf8")
}

function writeSnapshot(file, { args, model, stats, dists, crossCheck }) {
  const nodesOut = {}
  for (const [p, s] of [...stats.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    nodesOut[p] = { t: s.type, in: s.inUnique, out: s.outUnique, tot: s.inTotal, d: s.depth, pr: s.pagerank }
  }
  const snapshot = {
    meta: {
      createdAt: new Date().toISOString(),
      label: args.label,
      locale: args.locale,
      rulesRevision: RULES_REVISION,
      damping: DAMPING,
      counts: model.counts,
      serviceModelSitemapLimit: SERVICE_MODEL_SITEMAP_LIMIT,
      latestArticlesUsed: model.latest3Slugs,
      aliasResolvedLinks: model.aliasResolved,
      skippedLinkTargets: Object.fromEntries(model.unresolved),
      notes: model.notes,
    },
    depthDistribution: dists.depthDist,
    inlinksDistribution: dists.inDist,
    byType: dists.byType,
    sitemapCrossCheck: crossCheck,
    nodes: nodesOut,
  }
  fs.writeFileSync(file, JSON.stringify(snapshot, null, 1), "utf8")
}

// ─────────────────────────────────────────────────────────────────────────────
// Compare mode
// ─────────────────────────────────────────────────────────────────────────────

function compareSnapshots(fileA, fileB) {
  const A = JSON.parse(fs.readFileSync(fileA, "utf8"))
  const B = JSON.parse(fs.readFileSync(fileB, "utf8"))
  const nameA = A.meta.label || path.basename(fileA)
  const nameB = B.meta.label || path.basename(fileB)
  const delta = (a, b) => {
    const d = (b ?? 0) - (a ?? 0)
    return d === 0 ? "0" : d > 0 ? `+${d}` : String(d)
  }

  section(`COMPARE  ${nameA} (${A.meta.createdAt})  →  ${nameB} (${B.meta.createdAt})`)
  if (A.meta.locale !== B.meta.locale) console.log(`  ⚠ different locales: ${A.meta.locale} vs ${B.meta.locale}`)
  if (A.meta.rulesRevision !== B.meta.rulesRevision)
    console.log(`  ⚠ different rules revisions: ${A.meta.rulesRevision} vs ${B.meta.rulesRevision}`)
  if (JSON.stringify(A.meta.latestArticlesUsed) !== JSON.stringify(B.meta.latestArticlesUsed))
    console.log(
      `  ⚠ latest-3 articles differ (affects model/service-model outlinks): [${A.meta.latestArticlesUsed}] vs [${B.meta.latestArticlesUsed}]`,
    )

  section("Click depth distribution — delta")
  console.log(
    table(
      DEPTH_BUCKETS.map((b) => [b, A.depthDistribution[b] ?? 0, B.depthDistribution[b] ?? 0, delta(A.depthDistribution[b], B.depthDistribution[b])]),
      ["depth", nameA, nameB, "Δ"],
    ),
  )

  section("Unique inlinks distribution — delta")
  console.log(
    table(
      INLINK_BUCKETS.map((b) => [b, A.inlinksDistribution[b] ?? 0, B.inlinksDistribution[b] ?? 0, delta(A.inlinksDistribution[b], B.inlinksDistribution[b])]),
      ["inlinks", nameA, nameB, "Δ"],
    ),
  )

  section("Averages by page type — delta")
  const types = [...new Set([...Object.keys(A.byType), ...Object.keys(B.byType)])].sort(
    (a, b) => (B.byType[b]?.count ?? 0) - (B.byType[a]?.count ?? 0),
  )
  const fd = (a, b, digits = 2) =>
    a == null || b == null ? "—" : `${b.toFixed(digits)} (${b - a >= 0 ? "+" : ""}${(b - a).toFixed(digits)})`
  console.log(
    table(
      types.map((t) => {
        const a = A.byType[t] || {}
        const b = B.byType[t] || {}
        return [t, `${b.count ?? 0} (${delta(a.count, b.count)})`, fd(a.avgInlinks, b.avgInlinks), fd(a.avgDepth, b.avgDepth), fd((a.avgPagerank ?? 0) * 100, (b.avgPagerank ?? 0) * 100, 4)]
      }),
      ["type", "pages (Δ)", "avg in (Δ)", "avg depth (Δ)", "avg PR% (Δ)"],
    ),
  )

  const aNodes = A.nodes || {}
  const bNodes = B.nodes || {}
  const added = Object.keys(bNodes).filter((k) => !(k in aNodes))
  const removed = Object.keys(aNodes).filter((k) => !(k in bNodes))
  section(`Node universe: +${added.length} added, -${removed.length} removed`)
  for (const u of added.slice(0, 20)) console.log(`  + ${u}`)
  if (added.length > 20) console.log(`  … and ${added.length - 20} more`)
  for (const u of removed.slice(0, 20)) console.log(`  - ${u}`)
  if (removed.length > 20) console.log(`  … and ${removed.length - 20} more`)

  const common = Object.keys(aNodes).filter((k) => k in bNodes)
  const movers = common
    .map((k) => ({ url: k, t: bNodes[k].t, dIn: bNodes[k].in - aNodes[k].in, dDepth: (bNodes[k].d ?? 99) - (aNodes[k].d ?? 99), aIn: aNodes[k].in, bIn: bNodes[k].in }))
    .filter((m) => m.dIn !== 0 || m.dDepth !== 0)
  movers.sort((a, b) => Math.abs(b.dIn) - Math.abs(a.dIn) || Math.abs(b.dDepth) - Math.abs(a.dDepth))
  section(`Biggest per-page changes (inlinks / depth): ${movers.length} pages changed`)
  console.log(
    table(
      movers.slice(0, 25).map((m) => [m.url, m.t, `${m.aIn} → ${m.bIn}`, m.dIn > 0 ? `+${m.dIn}` : m.dIn, m.dDepth === 0 ? "0" : m.dDepth > 0 ? `+${m.dDepth}` : m.dDepth]),
      ["url", "type", "inlinks", "Δin", "Δdepth"],
    ),
  )
  console.log()
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv)

  if (args.compare) {
    compareSnapshots(args.compare[0], args.compare[1])
    return
  }

  const t0 = Date.now()
  const data = args.data ? JSON.parse(fs.readFileSync(args.data, "utf8")) : await loadLiveData()
  if (args.exportData) {
    fs.mkdirSync(path.dirname(args.exportData), { recursive: true })
    fs.writeFileSync(args.exportData, JSON.stringify(data), "utf8")
    console.log(`Raw data dumped to ${args.exportData}`)
  }

  const model = buildGraphModel(data, args.locale)
  const { stats } = computeMetrics(model)
  assembleSitemap(model, stats)
  const dists = distributions(stats)
  const crossCheck = printReport({ model, stats, args, dists })

  if (args.emitRanking) {
    const pairsRanked = model.serviceModelRanked
      .map((p) => {
        const m = p.match(/^\/services\/([^/]+)\/([^/]+)$/)
        return m ? { s: m[1], m: m[2] } : null
      })
      .filter(Boolean)
      .slice(0, 2000)
    fs.mkdirSync(path.dirname(args.emitRanking), { recursive: true })
    fs.writeFileSync(
      args.emitRanking,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          rulesRevision: RULES_REVISION,
          locale: args.locale,
          note: "Top service-model pages by internal PageRank. Regenerate with: node scripts/link-graph/analyze.mjs --emit-ranking lib/seo/service-model-ranking.json",
          pairs: pairsRanked,
        },
        null,
        1,
      ),
      "utf8",
    )
    console.log(`  Ranking:  ${args.emitRanking} (${pairsRanked.length} pairs)`)
  }

  fs.mkdirSync(args.out, { recursive: true })
  const label = args.label || new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19)
  const csvFile = path.join(args.out, `pages-${label}.csv`)
  const snapFile = path.join(args.out, `snapshot-${label}.json`)
  writeCsv(csvFile, stats)
  writeSnapshot(snapFile, { args, model, stats, dists, crossCheck })

  section("Files")
  console.log(`  CSV:      ${csvFile}`)
  console.log(`  Snapshot: ${snapFile}`)
  console.log(`  Elapsed:  ${((Date.now() - t0) / 1000).toFixed(1)}s\n`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
