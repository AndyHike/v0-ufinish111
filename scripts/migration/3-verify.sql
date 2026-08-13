-- Звірка з проду. Праворуч — те, що було на ${PROJECT_REF} станом на 13.08.2026.
-- Розбіжність у page_views на кілька рядків нормальна: сайт пише туди під час дампу.
-- page_views навмисно не переносимо (аналітика не потрібна) — там має бути 0.
select 'page_views (навмисно 0)'   as tbl, count(*) local,      0 as prod from page_views
union all select 'model_services',              count(*),   2466 from model_services
union all select 'service_scope_translations',  count(*),   1093 from service_scope_translations
union all select 'remonline_services',          count(*),    745 from remonline_services
union all select 'activities',                  count(*),    459 from activities
union all select 'models',                      count(*),    263 from models
union all select 'sessions',                    count(*),    167 from sessions
union all select 'service_faq_translations',    count(*),    140 from service_faq_translations
union all select 'service_scope_faq_trans',     count(*),     96 from service_scope_faq_translations
union all select 'remonline_order_sync_issues', count(*),     95 from remonline_order_sync_issues
union all select 'contact_messages',            count(*),     76 from contact_messages
union all select 'service_faqs',                count(*),     47 from service_faqs
union all select 'services_translations',       count(*),     39 from services_translations
union all select 'order_status_history',        count(*),     24 from order_status_history
union all select 'app_settings',                count(*),     21 from app_settings
union all select 'article_translations',        count(*),     18 from article_translations
union all select 'services',                    count(*),     13 from services
union all select 'users',                       count(*),     12 from users
union all select 'profiles',                    count(*),     12 from profiles
union all select 'series',                      count(*),     11 from series
union all select 'repair_orders',               count(*),      9 from repair_orders
union all select 'user_repair_orders',          count(*),      8 from user_repair_orders
union all select 'articles',                    count(*),      6 from articles
union all select 'legal_documents',             count(*),      4 from legal_documents
union all select 'roles',                       count(*),      2 from roles
union all select 'brands',                      count(*),      3 from brands
order by prod desc;

-- Картинки: скільки посилань куди дивиться (прод: R2 183, Supabase Storage 110)
select
  count(*) filter (where v like '%dns.devicehelp.cz%')  as r2,
  count(*) filter (where v like '%supabase.co/storage%') as prod_storage,
  count(*) filter (where v like '%127.0.0.1%' or v like '%localhost%') as local_storage
from (
  select image_url v from models
  union all select image_url from series
  union all select image_url from services
  union all select logo_url  from brands
  union all select featured_image from articles
  union all select value from app_settings where key in ('site_logo','site_favicon')
) t where v is not null and v <> '';
