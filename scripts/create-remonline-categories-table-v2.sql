-- Drop existing table if exists
DROP TABLE IF EXISTS remonline_categories CASCADE;
DROP TABLE IF EXISTS remonline_services CASCADE;

-- Create table for RemOnline category associations (simplified)
CREATE TABLE IF NOT EXISTS remonline_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id BIGINT NOT NULL UNIQUE,
  category_title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_remonline_categories_category_id ON remonline_categories(category_id);

-- Create table for RemOnline services sync
CREATE TABLE IF NOT EXISTS remonline_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  remonline_id BIGINT NOT NULL UNIQUE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  series_id UUID REFERENCES series(id) ON DELETE SET NULL,
  model_id UUID REFERENCES models(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  cost DECIMAL(10,2) DEFAULT 0,
  price DECIMAL(10,2) DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  warranty_months INTEGER DEFAULT 0,
  barcode VARCHAR(255),
  category_id BIGINT,
  parsed_service_slug VARCHAR(255),
  parsed_brand_slug VARCHAR(255),
  parsed_series_slug VARCHAR(255),
  parsed_model_slug VARCHAR(255),
  sync_status VARCHAR(50) DEFAULT 'pending',
  sync_error TEXT,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_remonline_services_remonline_id ON remonline_services(remonline_id);
CREATE INDEX IF NOT EXISTS idx_remonline_services_service_id ON remonline_services(service_id);
CREATE INDEX IF NOT EXISTS idx_remonline_services_brand_id ON remonline_services(brand_id);
CREATE INDEX IF NOT EXISTS idx_remonline_services_series_id ON remonline_services(series_id);
CREATE INDEX IF NOT EXISTS idx_remonline_services_model_id ON remonline_services(model_id);
CREATE INDEX IF NOT EXISTS idx_remonline_services_category_id ON remonline_services(category_id);
CREATE INDEX IF NOT EXISTS idx_remonline_services_barcode ON remonline_services(barcode);
CREATE INDEX IF NOT EXISTS idx_remonline_services_sync_status ON remonline_services(sync_status);

-- Create table for sync progress tracking
CREATE TABLE IF NOT EXISTS remonline_sync_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL UNIQUE,
  total_services INTEGER DEFAULT 0,
  processed_services INTEGER DEFAULT 0,
  created_services INTEGER DEFAULT 0,
  updated_services INTEGER DEFAULT 0,
  error_services INTEGER DEFAULT 0,
  created_brands INTEGER DEFAULT 0,
  created_series INTEGER DEFAULT 0,
  created_models INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'running',
  current_service_title VARCHAR(255),
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_remonline_sync_sessions_session_id ON remonline_sync_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_remonline_sync_sessions_status ON remonline_sync_sessions(status);

COMMENT ON TABLE remonline_categories IS 'RemOnline categories for visual reference and filtering';
COMMENT ON TABLE remonline_services IS 'Sync data between RemOnline services and local services with hierarchy';
COMMENT ON TABLE remonline_sync_sessions IS 'Real-time sync progress tracking';
