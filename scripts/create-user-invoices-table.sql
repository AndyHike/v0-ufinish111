-- Create local invoice cache for RO App invoices.
CREATE TABLE IF NOT EXISTS public.user_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    remonline_invoice_id INTEGER UNIQUE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,
    status_id INTEGER,
    status_name TEXT,
    status_group TEXT,
    issue_date TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at_remonline TIMESTAMP WITH TIME ZONE,
    modified_at_remonline TIMESTAMP WITH TIME ZONE,
    payment_method TEXT,
    client_id INTEGER,
    client_name TEXT,
    payer_id INTEGER,
    payer_name TEXT,
    manager_id INTEGER,
    manager_name TEXT,
    subtotal_amount NUMERIC(12,2),
    discount_amount NUMERIC(12,2),
    total_amount NUMERIC(12,2),
    paid_amount NUMERIC(12,2),
    balance_amount NUMERIC(12,2),
    currency TEXT,
    raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    sync_source TEXT NOT NULL DEFAULT 'webhook'
        CHECK (sync_source IN ('webhook', 'manual')),
    sync_status TEXT NOT NULL DEFAULT 'synced'
        CHECK (sync_status IN ('synced', 'error')),
    sync_error TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_invoices_user_id ON public.user_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_invoices_remonline_invoice_id ON public.user_invoices(remonline_invoice_id);
CREATE INDEX IF NOT EXISTS idx_user_invoices_client_id ON public.user_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_user_invoices_payer_id ON public.user_invoices(payer_id);
CREATE INDEX IF NOT EXISTS idx_user_invoices_issue_date ON public.user_invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_user_invoices_due_date ON public.user_invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_user_invoices_status_id ON public.user_invoices(status_id);
CREATE INDEX IF NOT EXISTS idx_user_invoices_is_deleted
    ON public.user_invoices(user_id, issue_date DESC)
    WHERE is_deleted = FALSE;

ALTER TABLE public.user_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own invoices" ON public.user_invoices;
CREATE POLICY "Users can view their own invoices" ON public.user_invoices
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can manage invoices" ON public.user_invoices;
CREATE POLICY "Service can manage invoices" ON public.user_invoices
    FOR ALL TO service_role USING (true) WITH CHECK (true);
