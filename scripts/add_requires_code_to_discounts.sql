-- Add code-only mode to discounts.
-- When requires_code is true, the discount is hidden from automatic pricing and only
-- applies when the customer enters its code during booking.

ALTER TABLE public.discounts
  ADD COLUMN IF NOT EXISTS requires_code BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_discounts_requires_code
  ON public.discounts(requires_code);

NOTIFY pgrst, 'reload schema';
