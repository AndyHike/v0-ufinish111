-- Adds company identity and structured billing address fields for business accounts.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'company_name'
  ) THEN
    ALTER TABLE users ADD COLUMN company_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'billing_street'
  ) THEN
    ALTER TABLE profiles ADD COLUMN billing_street TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'billing_city'
  ) THEN
    ALTER TABLE profiles ADD COLUMN billing_city TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'billing_postal_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN billing_postal_code VARCHAR(20);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'billing_country'
  ) THEN
    ALTER TABLE profiles ADD COLUMN billing_country VARCHAR(2) DEFAULT 'CZ';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_company_name ON users(company_name);
CREATE INDEX IF NOT EXISTS idx_profiles_billing_city ON profiles(billing_city);

COMMENT ON COLUMN users.company_name IS 'Company name for business accounts';
COMMENT ON COLUMN profiles.billing_street IS 'Billing street and house number';
COMMENT ON COLUMN profiles.billing_city IS 'Billing city';
COMMENT ON COLUMN profiles.billing_postal_code IS 'Billing postal code';
COMMENT ON COLUMN profiles.billing_country IS 'Billing country code';
