-- Add new columns to model_services table for proper service management
ALTER TABLE model_services 
ADD COLUMN IF NOT EXISTS warranty_months INTEGER,
ADD COLUMN IF NOT EXISTS duration_hours DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS warranty_period VARCHAR(10) DEFAULT 'months',
ADD COLUMN IF NOT EXISTS detailed_description TEXT,
ADD COLUMN IF NOT EXISTS what_included TEXT,
ADD COLUMN IF NOT EXISTS benefits TEXT;

-- Add comments to explain the new structure
COMMENT ON COLUMN model_services.warranty_months IS 'Warranty duration in months (converted from various periods)';
COMMENT ON COLUMN model_services.duration_hours IS 'Service duration in hours (converted from minutes)';
COMMENT ON COLUMN model_services.warranty_period IS 'Warranty period type: months or days';
COMMENT ON COLUMN model_services.detailed_description IS 'Detailed description specific to this model';
COMMENT ON COLUMN model_services.what_included IS 'What is included in this service for this model';
COMMENT ON COLUMN model_services.benefits IS 'Benefits of this service for this model';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_model_services_warranty ON model_services(warranty_months);
CREATE INDEX IF NOT EXISTS idx_model_services_duration ON model_services(duration_hours);
