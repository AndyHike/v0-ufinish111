# Link-graph analyzer

Аналізатор внутрішньої перелінковки головного сайту **без краулінгу**: повний
граф посилань реконструюється з правил лінкування у шаблонах
(`app/[locale]/…`, header/footer/breadcrumbs) + живих даних каталогу
(Supabase: `brands`, `series`, `models`, `services`, `model_services`,
`articles`, `legal_documents`).

Скрипт **тільки читає** — нічого в застосунку, роутах чи даних не змінює.

## Запуск

```bash
node scripts/link-graph/analyze.mjs                      # звіт + CSV + snapshot
node scripts/link-graph/analyze.mjs --label before       # іменований знімок
node scripts/link-graph/analyze.mjs --locale cs          # локаль (default cs)
node scripts/link-graph/analyze.mjs --export-data d.json # дамп сирих даних
node scripts/link-graph/analyze.mjs --data d.json        # offline з дампу

# Оновити ранжування для sitemap-сегмента services (top-N за PageRank):
node scripts/link-graph/analyze.mjs --emit-ranking lib/seo/service-model-ranking.json
# ↑ файл читає lib/seo/main-sitemap.ts — закоміть його після регенерації.
```

Креденшели Supabase читаються з `.env` / `.env.local`
(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) — anon-ключа
достатньо, каталог публічно читається.

## Порівняння до/після (оцінка змін шаблонів ДО деплою)

```bash
# 1. знімок "до"
node scripts/link-graph/analyze.mjs --label before
# 2. правиш шаблони → онови правила у buildGraphModel() в analyze.mjs
#    (і бампни RULES_REVISION)
node scripts/link-graph/analyze.mjs --label after
# 3. дельти
node scripts/link-graph/analyze.mjs --compare \
  scripts/link-graph/output/snapshot-before.json \
  scripts/link-graph/output/snapshot-after.json
```

Порівняння показує дельти розподілів click depth та inlinks, середні по
типах сторінок, додані/зниклі вузли та найбільші per-page зміни.

## Що рахується

- **Вузол** = канонічний URL сторінки однієї локалі (без префікса локалі).
- **Ребро** = внутрішнє посилання за правилом шаблону; дублі з однієї сторінки
  дедуплікуються (unique), загальна кількість зберігається окремо.
- **Метрики**: unique in/outlinks, click depth (BFS від головної), PageRank
  (damping 0.85, graphology), тип сторінки.
- **Sitemap cross-check**: всесвіт вузлів звіряється з логікою
  `lib/seo/main-sitemap.ts` — сторінки з sitemap без inlinks, досяжні
  сторінки поза sitemap тощо.

## Важливо: правила лінкування продубльовані вручну

`buildGraphModel()` віддзеркалює посилання з шаблонів станом на
`RULES_REVISION`. Якщо змінюєш лінкування у шаблонах — онови відповідне
правило тут, інакше граф розійдеться з реальністю. Список правил і припущень
друкується в секції 8 звіту.
