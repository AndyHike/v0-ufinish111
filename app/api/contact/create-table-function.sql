-- Функція для створення таблиці contact_messages
CREATE OR REPLACE FUNCTION create_contact_messages_table()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Перевіряємо, чи існує таблиця
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'contact_messages'
  ) THEN
    -- Створюємо таблицю
    CREATE TABLE public.contact_messages (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Додаємо індекси
    CREATE INDEX idx_contact_messages_status ON public.contact_messages(status);
    CREATE INDEX idx_contact_messages_created_at ON public.contact_messages(created_at);
    
    -- Додаємо тригер для оновлення updated_at
    CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.contact_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END;
$$;
