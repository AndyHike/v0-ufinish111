-- Link RO App invoices to one or more local repair orders.
CREATE TABLE IF NOT EXISTS public.user_invoice_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES public.user_invoices(id) ON DELETE CASCADE,
    remonline_invoice_id INTEGER NOT NULL,
    order_id UUID REFERENCES public.user_repair_orders(id) ON DELETE SET NULL,
    remonline_order_id INTEGER NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (remonline_invoice_id, remonline_order_id)
);

CREATE INDEX IF NOT EXISTS idx_user_invoice_orders_invoice_id
    ON public.user_invoice_orders(invoice_id);
CREATE INDEX IF NOT EXISTS idx_user_invoice_orders_order_id
    ON public.user_invoice_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_user_invoice_orders_remonline_invoice_id
    ON public.user_invoice_orders(remonline_invoice_id);
CREATE INDEX IF NOT EXISTS idx_user_invoice_orders_remonline_order_id
    ON public.user_invoice_orders(remonline_order_id);
CREATE INDEX IF NOT EXISTS idx_user_invoice_orders_user_id
    ON public.user_invoice_orders(user_id);

ALTER TABLE public.user_invoice_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own invoice order links" ON public.user_invoice_orders;
CREATE POLICY "Users can view their own invoice order links" ON public.user_invoice_orders
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can manage invoice order links" ON public.user_invoice_orders;
CREATE POLICY "Service can manage invoice order links" ON public.user_invoice_orders
    FOR ALL TO service_role USING (true) WITH CHECK (true);
