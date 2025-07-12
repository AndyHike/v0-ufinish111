-- Add missing columns to model_services table
ALTER TABLE model_services 
ADD COLUMN IF NOT EXISTS warranty_months INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS duration_hours DECIMAL(4,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS warranty_period VARCHAR(20) DEFAULT 'months',
ADD COLUMN IF NOT EXISTS detailed_description TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS what_included TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS benefits TEXT DEFAULT NULL;

-- Add comment to explain the structure
COMMENT ON TABLE model_services IS 'Services assigned to specific models with model-specific pricing and terms';
COMMENT ON COLUMN model_services.warranty_months IS 'Warranty duration in months for this specific model service';
COMMENT ON COLUMN model_services.duration_hours IS 'Service duration in hours for this specific model';
COMMENT ON COLUMN model_services.warranty_period IS 'Warranty period type: months or days';
COMMENT ON COLUMN model_services.detailed_description IS 'Model-specific detailed description';
COMMENT ON COLUMN model_services.what_included IS 'What is included in this service for this model';
COMMENT ON COLUMN model_services.benefits IS 'Benefits of this service for this model';
