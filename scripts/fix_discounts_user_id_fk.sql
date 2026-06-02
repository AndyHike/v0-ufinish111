-- Fix discounts.user_id FK to point at public.users instead of auth.users.
-- Run this on existing databases where personal discounts fail with discounts_user_id_fkey.

ALTER TABLE public.discounts ADD COLUMN IF NOT EXISTS user_id UUID;

-- If there are already personal discounts pointing at IDs that do not exist in public.users,
-- keep the migration safe by converting those broken references back to global discounts.
UPDATE public.discounts d
SET user_id = NULL
WHERE d.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = d.user_id
  );

ALTER TABLE public.discounts DROP CONSTRAINT IF EXISTS discounts_user_id_fkey;

ALTER TABLE public.discounts
  ADD CONSTRAINT discounts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_discounts_user_id ON public.discounts(user_id);

NOTIFY pgrst, 'reload schema';
