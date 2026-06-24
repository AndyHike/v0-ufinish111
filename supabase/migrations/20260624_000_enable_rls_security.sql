-- ============================================================================
-- Enable Row-Level Security across the public schema  (APPLIED 2026-06-24)
-- ----------------------------------------------------------------------------
-- Fixes Supabase advisors: rls_disabled_in_public + sensitive_columns_exposed,
-- and removes pre-existing permissive USING(true) policies that exposed
-- customer order/invoice data to the anon/public role.
--
-- Access model (see memory / CLAUDE notes): the app does NOT use Supabase Auth.
-- Sessions are a custom cookie, so all client traffic is the `anon` role.
--   * Privileged reads/writes go through the SERVICE-ROLE key on the server,
--     which BYPASSES RLS (login, admin, user orders/invoices, webhooks, forms,
--     registration, analytics, remonline sync, discounts).
--   * The anon key is used only to READ the public catalog/content.
--
-- Strategy (fail-closed): RLS on for every table; re-open SELECT only on the
-- public catalog/content tables. Everything else = service-role only.
-- ============================================================================

-- 1) Enable RLS on every base table in public (idempotent).
do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security;', r.tablename);
  end loop;
end $$;

-- 2) Drop dangerous permissive policies (public role, USING / WITH CHECK true)
--    on sensitive order/invoice/analytics tables. Service role bypasses RLS.
drop policy if exists "Service can manage repair orders"  on public.user_repair_orders;
drop policy if exists "System can delete orders"          on public.user_repair_orders;
drop policy if exists "System can insert orders"          on public.user_repair_orders;
drop policy if exists "System can update orders"          on public.user_repair_orders;

drop policy if exists "Service can manage order services" on public.user_repair_order_services;
drop policy if exists "System can delete order services"  on public.user_repair_order_services;
drop policy if exists "System can insert order services"  on public.user_repair_order_services;
drop policy if exists "System can update order services"  on public.user_repair_order_services;

drop policy if exists "Users can view repair orders"      on public.repair_orders;
drop policy if exists "Users can view order items"        on public.repair_order_items;
drop policy if exists "Allow insert"                      on public.page_views;
drop policy if exists "Allow read access to daily_stats"      on public.daily_stats;
drop policy if exists "Allow read access to page_view_hashes" on public.page_view_hashes;

-- 3) Public read-only SELECT on catalog/content tables (anon + authenticated).
--    These are read by public pages via the anon key (incl. nested joins).
do $$
declare
  t text;
  public_read text[] := array[
    'brands','series','models','services','services_translations','model_services',
    'service_faqs','service_faq_translations',
    'service_scope_translations','service_scope_faqs','service_scope_faq_translations',
    'catalog_descriptions',
    'articles','article_translations',
    'promotional_banners','app_settings','settings','order_statuses'
  ];
begin
  foreach t in array public_read loop
    if exists (select 1 from pg_tables where schemaname='public' and tablename=t) then
      execute format('drop policy if exists "public read" on public.%I;', t);
      execute format('create policy "public read" on public.%I for select to anon, authenticated using (true);', t);
    end if;
  end loop;
end $$;

-- 4) Harden flagged functions: pin search_path (clears function_search_path_mutable).
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.proname in (
        'update_app_settings_updated_at','update_service_bookings_updated_at',
        'increment_sync_session_brands','increment_sync_session_series','increment_sync_session_models',
        'update_discount_updated_at','update_roles_updated_at','create_contact_messages_table',
        'update_updated_at_column','slugify','increment_page_view'
      )
  loop
    execute format('alter function %s set search_path = public, pg_temp;', r.sig);
  end loop;
end $$;

-- Remaining (not handled here, dashboard action): minor Postgres version upgrade.
