-- Allow product series (лінійки) to carry their own photo, shown on the brand
-- page next to each series. Mirrors models.image_url (a full R2/Supabase URL).
ALTER TABLE series ADD COLUMN IF NOT EXISTS image_url TEXT;
