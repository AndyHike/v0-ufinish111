-- Adds RO App account/contact synchronization state to local users.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'remonline_contact_type'
  ) THEN
    ALTER TABLE public.users
      ADD COLUMN remonline_contact_type TEXT
      CHECK (remonline_contact_type IN ('person', 'organization'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'remonline_sync_status'
  ) THEN
    ALTER TABLE public.users
      ADD COLUMN remonline_sync_status TEXT
      CHECK (remonline_sync_status IN ('pending', 'synced', 'error'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'remonline_sync_error'
  ) THEN
    ALTER TABLE public.users ADD COLUMN remonline_sync_error TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'remonline_synced_at'
  ) THEN
    ALTER TABLE public.users ADD COLUMN remonline_synced_at TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'remonline_sync_attempts'
  ) THEN
    ALTER TABLE public.users
      ADD COLUMN remonline_sync_attempts INTEGER NOT NULL DEFAULT 0
      CHECK (remonline_sync_attempts >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_remonline_sync_status ON public.users(remonline_sync_status);
CREATE INDEX IF NOT EXISTS idx_users_remonline_contact_type ON public.users(remonline_contact_type);
