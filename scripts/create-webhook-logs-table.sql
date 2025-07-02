-- 🔄 Drop existing table to ensure clean structure
DROP TABLE IF EXISTS webhook_logs CASCADE;

-- ✅ Create webhook_logs table with proper structure
CREATE TABLE webhook_logs (
    id BIGSERIAL PRIMARY KEY,
    event_type TEXT NOT NULL DEFAULT 'unknown',
    status TEXT NOT NULL CHECK (status IN ('received', 'success', 'failed', 'error')),
    message TEXT DEFAULT '',
    processing_time_ms INTEGER DEFAULT 0,
    webhook_data JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 📈 Create indexes for better performance
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX idx_webhook_logs_webhook_data ON webhook_logs USING GIN(webhook_data);

-- 🧪 Insert test record to verify table works
INSERT INTO webhook_logs (event_type, status, message, webhook_data) 
VALUES (
    'test_event',
    'success',
    'Test webhook log entry - table created successfully',
    jsonb_build_object(
        'test', true,
        'created_at', NOW(),
        'message', 'Table is working correctly'
    )
);

-- ✅ Verify table creation
SELECT 
    'webhook_logs table created successfully' AS status,
    COUNT(*) AS test_records,
    MAX(created_at) AS last_record_time
FROM webhook_logs;

-- 🗂️ Show table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'webhook_logs' 
ORDER BY ordinal_position;
