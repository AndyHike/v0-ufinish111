-- Unique, multilingual descriptions for catalog PAGES themselves
-- (series / model / brand) — independent of any service.
--
-- Today the series & model pages show only a generic templated line, so they
-- read as near-duplicate to search engines even though the page content
-- (the model grid) is partially unique. This table lets the owner add a real
-- intro + optional longer body per page, with the same cascade philosophy as
-- service_scope_translations:
--   * language PRIMARY (keep requested locale across scope levels)
--   * most-specific scope wins: model -> series -> brand
-- A model with no description falls back to its series, then its brand.
--
-- Additive + idempotent — safe to re-run. Starts empty; read path falls through
-- to the existing generic line until real content is entered.

create table if not exists catalog_descriptions (
  id uuid primary key default gen_random_uuid(),
  scope_type text not null check (scope_type in ('model', 'series', 'brand')),
  scope_id   uuid not null,
  locale     text not null check (locale in ('cs', 'en', 'uk')),
  description text,          -- short intro shown under the H1
  body       text,          -- optional longer unique content block (plain text / light HTML)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_descriptions_unique unique (scope_type, scope_id, locale)
);

create index if not exists catalog_descriptions_lookup
  on catalog_descriptions (scope_type, scope_id);
