-- Store signed RemOnline order webhook events that could not be applied locally.
CREATE TABLE IF NOT EXISTS public.remonline_order_sync_issues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    remonline_event_id TEXT NOT NULL UNIQUE,
    event_name TEXT NOT NULL,
    remonline_order_id INTEGER,
    remonline_client_id INTEGER,
    status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'resolved', 'ignored')),
    reason TEXT NOT NULL,
    details TEXT,
    raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    attempts INTEGER NOT NULL DEFAULT 1 CHECK (attempts >= 1),
    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ignored_at TIMESTAMP WITH TIME ZONE,
    ignored_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_remonline_order_sync_issues_status
    ON public.remonline_order_sync_issues(status);

CREATE INDEX IF NOT EXISTS idx_remonline_order_sync_issues_order_id
    ON public.remonline_order_sync_issues(remonline_order_id);

CREATE INDEX IF NOT EXISTS idx_remonline_order_sync_issues_client_id
    ON public.remonline_order_sync_issues(remonline_client_id);

CREATE INDEX IF NOT EXISTS idx_remonline_order_sync_issues_last_seen
    ON public.remonline_order_sync_issues(last_seen_at DESC);

ALTER TABLE public.remonline_order_sync_issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service can manage order sync issues"
    ON public.remonline_order_sync_issues;

CREATE POLICY "Service can manage order sync issues"
    ON public.remonline_order_sync_issues
    FOR ALL TO service_role USING (true) WITH CHECK (true);
