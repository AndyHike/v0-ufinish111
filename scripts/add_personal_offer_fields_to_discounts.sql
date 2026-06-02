-- Add presentation fields for personal profile offers.
-- These fields do not change discount calculation; they only control whether
-- an existing personal discount is highlighted in the user's profile/homepage.

ALTER TABLE public.discounts
  ADD COLUMN IF NOT EXISTS show_as_offer BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS offer_title TEXT,
  ADD COLUMN IF NOT EXISTS offer_description TEXT,
  ADD COLUMN IF NOT EXISTS offer_priority INTEGER NOT NULL DEFAULT 0;

UPDATE public.discounts
SET show_as_offer = false
WHERE user_id IS NULL
  AND show_as_offer = true;

CREATE INDEX IF NOT EXISTS idx_discounts_profile_offers
  ON public.discounts(user_id, show_as_offer, is_active, offer_priority DESC, expires_at)
  WHERE user_id IS NOT NULL AND show_as_offer = true;

COMMENT ON COLUMN public.discounts.show_as_offer IS 'When true, a personal discount can be highlighted as a profile offer';
COMMENT ON COLUMN public.discounts.offer_title IS 'Optional display title for a personal profile offer';
COMMENT ON COLUMN public.discounts.offer_description IS 'Optional display description for a personal profile offer';
COMMENT ON COLUMN public.discounts.offer_priority IS 'Higher priority offers are shown first in profile and homepage toast';
