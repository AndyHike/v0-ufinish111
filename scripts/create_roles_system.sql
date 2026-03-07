-- Міграція: Система ролей з автопідтвердженням та знижками
-- Виконати через Supabase Dashboard → SQL Editor

-- =============================================
-- 1. Таблиця ролей
-- =============================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  is_default BOOLEAN DEFAULT false,
  auto_approve BOOLEAN DEFAULT true,
  discount_percentage NUMERIC(5,2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger для автооновлення updated_at
CREATE OR REPLACE FUNCTION update_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_roles_updated_at ON roles;
CREATE TRIGGER trigger_update_roles_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION update_roles_updated_at();

-- =============================================
-- 2. Seed дефолтних ролей
-- =============================================
INSERT INTO roles (name, slug, is_default, auto_approve, discount_percentage, description)
VALUES 
  ('Звичайний користувач', 'user', true, true, 0, 'Стандартна роль для нових користувачів'),
  ('B2B Клієнт', 'b2b', false, false, 10, 'Бізнес-клієнт з підтвердженням адміністратором')
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- 3. Нові поля в таблиці users
-- =============================================
DO $$
BEGIN
  -- role_id — зв''язок з таблицею roles
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role_id') THEN
    ALTER TABLE users ADD COLUMN role_id UUID REFERENCES roles(id) ON DELETE SET NULL;
  END IF;

  -- IČO (ідентифікаційний номер організації)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'ico') THEN
    ALTER TABLE users ADD COLUMN ico VARCHAR(20);
  END IF;

  -- DIČ (податковий ідентифікаційний номер)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'dic') THEN
    ALTER TABLE users ADD COLUMN dic VARCHAR(20);
  END IF;

  -- B2B прапорець
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_b2b') THEN
    ALTER TABLE users ADD COLUMN is_b2b BOOLEAN DEFAULT false;
  END IF;

  -- Підтвердження акаунту
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_approved') THEN
    ALTER TABLE users ADD COLUMN is_approved BOOLEAN DEFAULT true;
  END IF;
END $$;

-- =============================================
-- 4. Встановити role_id для існуючих users
-- =============================================
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE slug = 'user')
WHERE role_id IS NULL;

-- =============================================
-- 5. Індекси
-- =============================================
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_is_approved ON users(is_approved) WHERE is_approved = false;
CREATE INDEX IF NOT EXISTS idx_users_is_b2b ON users(is_b2b) WHERE is_b2b = true;

-- =============================================
-- Коментарі
-- =============================================
COMMENT ON TABLE roles IS 'Динамічні ролі користувачів з автопідтвердженням та знижками';
COMMENT ON COLUMN roles.is_default IS 'Чи є ця роль дефолтною для нових реєстрацій';
COMMENT ON COLUMN roles.auto_approve IS 'Чи підтверджується реєстрація автоматично для цієї ролі';
COMMENT ON COLUMN roles.discount_percentage IS 'Постійна знижка у відсотках для цієї ролі';
COMMENT ON COLUMN users.role_id IS 'FK до таблиці roles';
COMMENT ON COLUMN users.ico IS 'IČO — ідентифікаційний номер організації (для B2B)';
COMMENT ON COLUMN users.dic IS 'DIČ — податковий ідентифікаційний номер (для B2B)';
COMMENT ON COLUMN users.is_b2b IS 'Прапорець B2B клієнта';
COMMENT ON COLUMN users.is_approved IS 'Чи підтверджений акаунт адміністратором';
