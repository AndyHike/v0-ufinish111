-- Оновлена структура таблиці знижок - завжди прив'язана до послуги

-- Drop existing table if exists
DROP TABLE IF EXISTS discount_usages CASCADE;
DROP TABLE IF EXISTS discounts CASCADE;

-- Create discounts table with service-first approach
CREATE TABLE IF NOT EXISTS discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic discount info
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  
  -- Discount type and amount
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
  
  -- ВАЖЛИВО: Знижка завжди прив'язана до однієї або декількох послуг
  -- Використовуємо масив для підтримки декількох послуг одночасно
  service_ids UUID[] NOT NULL DEFAULT '{}', -- Масив ID послуг
  
  -- Scope of discount - до чого застосовується (brand, series, model, або all для всіх моделей)
  scope_type VARCHAR(50) NOT NULL CHECK (scope_type IN ('brand', 'series', 'model', 'all_models')),
  
  -- Foreign keys for specific scopes (nullable)
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  series_id UUID REFERENCES series(id) ON DELETE CASCADE,
  model_id UUID REFERENCES models(id) ON DELETE CASCADE,
  
  -- Status and validity
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Usage limits (optional)
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  max_uses_per_user INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_service_ids CHECK (array_length(service_ids, 1) > 0),
  CONSTRAINT valid_scope CHECK (
    (scope_type = 'brand' AND brand_id IS NOT NULL) OR
    (scope_type = 'series' AND series_id IS NOT NULL) OR
    (scope_type = 'model' AND model_id IS NOT NULL) OR
    (scope_type = 'all_models')
  ),
  CONSTRAINT valid_dates CHECK (expires_at IS NULL OR expires_at > starts_at)
);

-- Create discount usage tracking table
CREATE TABLE IF NOT EXISTS discount_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_id UUID NOT NULL REFERENCES discounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  order_id UUID,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  discount_amount NUMERIC(10, 2) NOT NULL,
  original_price NUMERIC(10, 2) NOT NULL,
  final_price NUMERIC(10, 2) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts(code);
CREATE INDEX IF NOT EXISTS idx_discounts_active ON discounts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_discounts_expires ON discounts(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_discounts_service_ids ON discounts USING GIN(service_ids);
CREATE INDEX IF NOT EXISTS idx_discounts_brand ON discounts(brand_id) WHERE brand_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_discounts_series ON discounts(series_id) WHERE series_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_discounts_model ON discounts(model_id) WHERE model_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_discount_usages_user ON discount_usages(user_id);
CREATE INDEX IF NOT EXISTS idx_discount_usages_discount ON discount_usages(discount_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_discount_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_discount_updated_at ON discounts;
CREATE TRIGGER trigger_update_discount_updated_at
BEFORE UPDATE ON discounts
FOR EACH ROW
EXECUTE FUNCTION update_discount_updated_at();

-- Add comments for documentation
COMMENT ON TABLE discounts IS 'Discount system: always attached to one or more services, with scope for brands/series/models';
COMMENT ON COLUMN discounts.service_ids IS 'Array of service IDs this discount applies to (can be multiple services)';
COMMENT ON COLUMN discounts.scope_type IS 'Scope: brand (all models of brand), series (all models in series), model (specific model), all_models';
COMMENT ON COLUMN discounts.discount_type IS 'Type: percentage (e.g., 15%) or fixed (e.g., 500 CZK)';
COMMENT ON COLUMN discounts.discount_value IS 'Discount amount - either percentage (1-100) or fixed amount';
