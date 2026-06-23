-- Scope-aware, multilingual FAQ overrides for service+model pages.
-- Mirrors service_faqs / service_faq_translations, but each FAQ is attached to a
-- specific scope (a model or a series) for a given service.
--
-- Read cascade (see lib/catalog/scope-faqs.ts): the MOST SPECIFIC scope that has
-- any FAQs wins as a whole list — model FAQs, else series FAQs, else the base
-- service_faqs. This closes the gap where a model has no FAQ yet (it inherits the
-- series' FAQ) and makes the per-model pages far more unique.
--
-- Additive + idempotent. Starts empty → read path falls through to base service_faqs.

create table if not exists service_scope_faqs (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id) on delete cascade,
  scope_type text not null check (scope_type in ('model', 'series')),
  scope_id   uuid not null,
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- position doubles as the logical slot, so bulk re-imports upsert cleanly
  -- (one row per service×scope×position) instead of piling up duplicates.
  constraint service_scope_faqs_unique unique (service_id, scope_type, scope_id, position)
);

create index if not exists service_scope_faqs_lookup
  on service_scope_faqs (service_id, scope_type, scope_id);

create table if not exists service_scope_faq_translations (
  id uuid primary key default gen_random_uuid(),
  faq_id   uuid not null references service_scope_faqs(id) on delete cascade,
  locale   text not null check (locale in ('cs', 'en', 'uk')),
  question text not null,
  answer   text not null,
  constraint service_scope_faq_translations_unique unique (faq_id, locale)
);

create index if not exists service_scope_faq_translations_faq
  on service_scope_faq_translations (faq_id);
