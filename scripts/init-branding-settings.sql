-- Initialize branding settings in app_settings table
INSERT INTO app_settings (key, value, description) VALUES
('site_logo', '/logo.PNG', 'URL to the site logo image'),
('site_favicon', '/logo.PNG', 'URL to the site favicon image'),
('default_language', 'cs', 'Default language code for the website')
ON CONFLICT (key) DO NOTHING;
