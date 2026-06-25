-- ============================================================================
-- Legal documents CMS  (admin-managed privacy / terms / VOP / account terms)
-- ----------------------------------------------------------------------------
-- Replaces the two single-language app_settings keys
-- (privacy_policy_content, terms_of_service_content) with a proper table so
-- the admin can add documents, name them in 3 languages, toggle visibility,
-- order them in the footer, and flag which ones require consent at signup.
--
-- Body is a single shared markdown (one text for all locales); only the title
-- is per-locale. Access model mirrors 20260624_000_enable_rls_security.sql:
-- RLS on, anon SELECT (public read), all writes via the service-role key.
-- ============================================================================

create table if not exists public.legal_documents (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_cs text not null default '',
  title_uk text not null default '',
  title_en text not null default '',
  content text not null default '',
  is_active boolean not null default true,
  required_at_registration boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- keep updated_at fresh (function already exists in this schema, search_path pinned)
drop trigger if exists set_legal_documents_updated_at on public.legal_documents;
create trigger set_legal_documents_updated_at
  before update on public.legal_documents
  for each row execute function public.update_updated_at_column();

-- RLS: fail-closed, re-open SELECT only (anon + authenticated). Writes = service role.
alter table public.legal_documents enable row level security;
drop policy if exists "public read" on public.legal_documents;
create policy "public read" on public.legal_documents
  for select to anon, authenticated using (true);

-- ----------------------------------------------------------------------------
-- Seed: migrate the two existing documents out of app_settings (idempotent).
-- ----------------------------------------------------------------------------
insert into public.legal_documents
  (slug, title_cs, title_uk, title_en, content, is_active, required_at_registration, sort_order)
select
  'privacy',
  'Ochrana osobních údajů',
  'Політика конфіденційності',
  'Privacy Policy',
  coalesce((select value from public.app_settings where key = 'privacy_policy_content'), ''),
  true,
  true,
  10
on conflict (slug) do nothing;

insert into public.legal_documents
  (slug, title_cs, title_uk, title_en, content, is_active, required_at_registration, sort_order)
select
  'terms',
  'Obchodní podmínky',
  'Умови надання послуг',
  'Terms of Service',
  coalesce((select value from public.app_settings where key = 'terms_of_service_content'), ''),
  true,
  false,
  20
on conflict (slug) do nothing;
