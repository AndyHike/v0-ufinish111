-- Create promotional_banners table for managing promotional banners
CREATE TABLE IF NOT EXISTS promotional_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN DEFAULT false,
  color VARCHAR(100) DEFAULT 'bg-orange-500',
  text_cs TEXT NOT NULL,
  text_en TEXT NOT NULL,
  text_uk TEXT NOT NULL,
  button_text_cs VARCHAR(255) DEFAULT 'Отримати знижку',
  button_text_en VARCHAR(255) DEFAULT 'Get discount',
  button_text_uk VARCHAR(255) DEFAULT 'Отримати знижку',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for enabled banners
CREATE INDEX IF NOT EXISTS idx_promotional_banners_enabled ON promotional_banners(enabled);

-- Insert default promotional banner
INSERT INTO promotional_banners (enabled, color, text_cs, text_en, text_uk, button_text_cs, button_text_en, button_text_uk)
VALUES (
  false,
  'bg-orange-500',
  '🔥 Akce: Výměna displeje -20%! Do 31.05.',
  '🔥 Sale: Display Replacement -20%! Until 31.05.',
  '🔥 Акція: Заміна дисплея -20%! До 31.05.',
  'Získat slevu',
  'Get discount',
  'Отримати знижку'
)
ON CONFLICT DO NOTHING;
