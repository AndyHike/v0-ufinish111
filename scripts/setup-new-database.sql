-- Enable RLS
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create profiles table that extends auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  address TEXT,
  avatar_url TEXT,
  remonline_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create verification_codes table
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('login', 'registration')),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on verification_codes
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Create policy for verification_codes (only system can access)
CREATE POLICY "System can manage verification codes" ON public.verification_codes
  FOR ALL USING (true);

-- Create app_settings table
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for app_settings (public read, admin write)
CREATE POLICY "Anyone can read app settings" ON public.app_settings
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify app settings" ON public.app_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_app_meta_data->>'role' = 'admin')
    )
  );

-- Insert default app settings
INSERT INTO public.app_settings (key, value) VALUES
  ('default_language', 'uk'),
  ('maintenance_mode_enabled', 'false'),
  ('registration_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

-- Create brands table
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name JSONB NOT NULL, -- {"uk": "Назва", "en": "Name", "cs": "Název"}
  slug TEXT UNIQUE NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on brands
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Create policy for brands (public read, admin write)
CREATE POLICY "Anyone can read active brands" ON public.brands
  FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can modify brands" ON public.brands
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_app_meta_data->>'role' = 'admin')
    )
  );

-- Create series table
CREATE TABLE IF NOT EXISTS public.series (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  name JSONB NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on series
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;

-- Create policy for series (public read, admin write)
CREATE POLICY "Anyone can read active series" ON public.series
  FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can modify series" ON public.series
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_app_meta_data->>'role' = 'admin')
    )
  );

-- Create models table
CREATE TABLE IF NOT EXISTS public.models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  series_id UUID REFERENCES public.series(id) ON DELETE CASCADE,
  name JSONB NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on models
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;

-- Create policy for models (public read, admin write)
CREATE POLICY "Anyone can read active models" ON public.models
  FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can modify models" ON public.models
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_app_meta_data->>'role' = 'admin')
    )
  );

-- Create services table
CREATE TABLE IF NOT EXISTS public.services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name JSONB NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description JSONB,
  price DECIMAL(10,2),
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Create policy for services (public read, admin write)
CREATE POLICY "Anyone can read active services" ON public.services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can modify services" ON public.services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_app_meta_data->>'role' = 'admin')
    )
  );

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on contact_messages
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Create policy for contact_messages (anyone can insert, only admins can read)
CREATE POLICY "Anyone can send contact messages" ON public.contact_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Only admins can read contact messages" ON public.contact_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_app_meta_data->>'role' = 'admin')
    )
  );

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, created_at, updated_at)
  VALUES (NEW.id, '', '', NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_series_updated_at BEFORE UPDATE ON public.series
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_models_updated_at BEFORE UPDATE ON public.models
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
