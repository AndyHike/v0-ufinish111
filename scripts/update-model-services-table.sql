-- Add new columns to model_services table for proper service management
ALTER TABLE model_services 
ADD COLUMN IF NOT EXISTS warranty_months INTEGER,
ADD COLUMN IF NOT EXISTS duration_hours DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS warranty_period VARCHAR(10) DEFAULT 'months',
ADD COLUMN IF NOT EXISTS detailed_description TEXT,
ADD COLUMN IF NOT EXISTS what_included TEXT,
ADD COLUMN IF NOT EXISTS benefits TEXT;

-- Add comments to explain the new structure
COMMENT ON COLUMN model_services.warranty_months IS 'Model-specific warranty duration in months or days (see warranty_period)';
COMMENT ON COLUMN model_services.duration_hours IS 'Model-specific service duration in hours';
COMMENT ON COLUMN model_services.warranty_period IS 'Warranty period type: months or days';
COMMENT ON COLUMN model_services.detailed_description IS 'Model-specific detailed description of the service';
COMMENT ON COLUMN model_services.what_included IS 'Model-specific list of what is included in the service';
COMMENT ON COLUMN model_services.benefits IS 'Model-specific benefits of the service';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_model_services_warranty ON model_services(warranty_months);
CREATE INDEX IF NOT EXISTS idx_model_services_duration ON model_services(duration_hours);
CREATE INDEX IF NOT EXISTS idx_model_services_warranty_period ON model_services(warranty_period);

-- Update existing records to use default values from services table where null
UPDATE model_services 
SET 
  warranty_months = COALESCE(warranty_months, (
    SELECT warranty_months 
    FROM services 
    WHERE services.id = model_services.service_id
  )),
  duration_hours = COALESCE(duration_hours, (
    SELECT duration_hours 
    FROM services 
    WHERE services.id = model_services.service_id
  )),
  warranty_period = COALESCE(warranty_period, 'months')
WHERE warranty_months IS NULL OR duration_hours IS NULL OR warranty_period IS NULL;
