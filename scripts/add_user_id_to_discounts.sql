-- Add user_id to the discounts table to support personal discounts

-- 1. Add column to discounts table
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Create index to fetch personal discounts faster
CREATE INDEX IF NOT EXISTS idx_discounts_user_id ON discounts(user_id);

-- Optional: Update postgrest definition so that edge functions can query it
NOTIFY pgrst, 'reload schema';
