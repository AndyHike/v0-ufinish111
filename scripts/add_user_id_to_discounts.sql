-- Add user_id to the discounts table to support personal discounts

-- 1. Add column to discounts table
ALTER TABLE public.discounts ADD COLUMN IF NOT EXISTS user_id UUID;

-- 2. Ensure the personal-discount owner points to the app users table.
--    Discounts are assigned from public.users in the admin panel, and RemOnline-created
--    users may not have a matching auth.users row.
ALTER TABLE public.discounts DROP CONSTRAINT IF EXISTS discounts_user_id_fkey;
ALTER TABLE public.discounts
  ADD CONSTRAINT discounts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- 3. Create index to fetch personal discounts faster
CREATE INDEX IF NOT EXISTS idx_discounts_user_id ON public.discounts(user_id);

-- Optional: Update postgrest definition so that edge functions can query it
NOTIFY pgrst, 'reload schema';
