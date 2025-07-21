-- Створення адмін користувача та профілю
-- Цей скрипт потрібно виконати після того, як користувач зареєструється через Supabase Auth

-- Спочатку потрібно зареєструвати користувача через Supabase Auth UI або API:
-- supabase.auth.signUp({ email: 'trasasrukhh@gmail.com', password: 'temp_password' })

-- Після реєстрації виконати цей скрипт для надання адмін прав:

-- Оновлюємо роль користувача на адміна (замініть USER_ID на реальний ID)
-- UPDATE public.user_roles 
-- SET role = 'admin' 
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'trasasrukhh@gmail.com');

-- Оновлюємо профіль адміна
-- UPDATE public.profiles 
-- SET 
--   first_name = 'Admin',
--   last_name = 'User',
--   remonline_id = 'admin_remonline_id'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'trasasrukhh@gmail.com');

-- Додаємо базові налаштування додатку
INSERT INTO public.app_settings (key, value, description) VALUES
  ('default_language', 'uk', 'Default language for the application'),
  ('maintenance_mode_enabled', 'false', 'Enable/disable maintenance mode'),
  ('registration_enabled', 'true', 'Enable/disable user registration'),
  ('site_name', 'DeviceHelp', 'Site name'),
  ('contact_email', 'trasasrukhh@gmail.com', 'Contact email for support')
ON CONFLICT (key) DO NOTHING;
