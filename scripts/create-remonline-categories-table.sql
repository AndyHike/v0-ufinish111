-- Create table for RemOnline category associations
CREATE TABLE IF NOT EXISTS remonline_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id BIGINT NOT NULL UNIQUE,
  category_title VARCHAR(255) NOT NULL,
  association_type VARCHAR(20) NOT NULL CHECK (association_type IN ('brand', 'series')),
  target_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_remonline_categories_category_id ON remonline_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_remonline_categories_target_id ON remonline_categories(target_id);
CREATE INDEX IF NOT EXISTS idx_remonline_categories_type ON remonline_categories(association_type);

-- Add foreign key constraints
ALTER TABLE remonline_categories 
ADD CONSTRAINT fk_remonline_categories_brand 
FOREIGN KEY (target_id) REFERENCES brands(id) ON DELETE CASCADE
NOT VALID;

-- Create table for RemOnline services sync
CREATE TABLE IF NOT EXISTS remonline_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  remonline_id BIGINT NOT NULL UNIQUE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  cost DECIMAL(10,2),
  price DECIMAL(10,2),
  duration_minutes INTEGER,
  warranty_months INTEGER,
  barcode VARCHAR(255),
  category_id BIGINT,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_remonline_services_remonline_id ON remonline_services(remonline_id);
CREATE INDEX IF NOT EXISTS idx_remonline_services_service_id ON remonline_services(service_id);
CREATE INDEX IF NOT EXISTS idx_remonline_services_category_id ON remonline_services(category_id);
CREATE INDEX IF NOT EXISTS idx_remonline_services_barcode ON remonline_services(barcode);

COMMENT ON TABLE remonline_categories IS 'Associations between RemOnline categories and local brands/series';
COMMENT ON TABLE remonline_services IS 'Sync data between RemOnline services and local services';
