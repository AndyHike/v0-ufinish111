-- Persist the user's preferred locale for localized RemOnline webhook status labels.
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'uk';

UPDATE public.users
SET locale = 'uk'
WHERE locale IS NULL OR locale NOT IN ('uk', 'en', 'cs');

ALTER TABLE public.users
    ALTER COLUMN locale SET DEFAULT 'uk',
    ALTER COLUMN locale SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_locale_check'
          AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT users_locale_check
            CHECK (locale IN ('uk', 'en', 'cs'));
    END IF;
END $$;
