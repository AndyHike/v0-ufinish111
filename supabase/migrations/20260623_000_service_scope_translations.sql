-- Multilingual, scope-aware text overrides for service descriptions.
-- Scope levels: model / series / brand. Base text stays in services_translations.
-- Additive + idempotent — safe to re-run.

create table if not exists service_scope_translations (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id) on delete cascade,
  scope_type text not null check (scope_type in ('model', 'series', 'brand')),
  scope_id   uuid not null,
  locale     text not null check (locale in ('cs', 'en', 'uk')),
  detailed_description text,
  what_included text,
  benefits text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_scope_translations_unique
    unique (service_id, scope_type, scope_id, locale)
);

create index if not exists service_scope_translations_lookup
  on service_scope_translations (service_id, scope_type, scope_id);

-- NOTE: No backfill from the inline model_services.{detailed_description,
-- what_included,benefits} columns. On inspection that data was seed junk —
-- `[service-slug]` placeholders, thin part-labels, and warranty months stored
-- in `benefits` ("6 міс.") — i.e. not usable page copy. The table starts empty;
-- the read path falls through to the real base text in services_translations
-- until genuine per-model/series content is entered. (See lib/catalog/scope-text.ts.)
