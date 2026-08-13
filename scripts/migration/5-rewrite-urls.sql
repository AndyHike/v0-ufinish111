-- Виконується на ЦІЛЬОВІЙ базі через /pg/query.
--
-- Після відновлення 110 рядків усе ще посилаються на
-- https://${PROJECT_REF}.supabase.co/storage/... — тобто сайт тягнув би
-- картинки з проду і далі палив той самий трафік, заради якого все й затівалось.
-- Тут перемикаємо їх на Storage вашої VPS.
--
-- Чистий SQL без psql-макросів: іде одним POST на /pg/query.

begin;

update models   set image_url = replace(image_url, 'https://${PROJECT_REF}.supabase.co', '${VPS_SUPABASE_URL}') where image_url like 'https://${PROJECT_REF}.supabase.co%';
update series   set image_url = replace(image_url, 'https://${PROJECT_REF}.supabase.co', '${VPS_SUPABASE_URL}') where image_url like 'https://${PROJECT_REF}.supabase.co%';
update services set image_url = replace(image_url, 'https://${PROJECT_REF}.supabase.co', '${VPS_SUPABASE_URL}') where image_url like 'https://${PROJECT_REF}.supabase.co%';
update brands   set logo_url  = replace(logo_url,  'https://${PROJECT_REF}.supabase.co', '${VPS_SUPABASE_URL}') where logo_url  like 'https://${PROJECT_REF}.supabase.co%';
update articles set featured_image = replace(featured_image, 'https://${PROJECT_REF}.supabase.co', '${VPS_SUPABASE_URL}') where featured_image like 'https://${PROJECT_REF}.supabase.co%';
update hero_carousel_slides set image_url = replace(image_url, 'https://${PROJECT_REF}.supabase.co', '${VPS_SUPABASE_URL}') where image_url like 'https://${PROJECT_REF}.supabase.co%';
update app_settings set value = replace(value, 'https://${PROJECT_REF}.supabase.co', '${VPS_SUPABASE_URL}') where value like 'https://${PROJECT_REF}.supabase.co%';

commit;

-- Має бути 0:
select count(*) as still_pointing_at_prod from (
  select image_url v from models
  union all select image_url from series
  union all select image_url from services
  union all select logo_url from brands
  union all select featured_image from articles
  union all select value from app_settings
) t where v like '%${PROJECT_REF}%';
