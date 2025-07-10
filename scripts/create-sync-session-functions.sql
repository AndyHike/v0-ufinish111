-- Function to increment created brands counter
CREATE OR REPLACE FUNCTION increment_sync_session_brands(session_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE remonline_sync_sessions 
  SET created_brands = created_brands + 1
  WHERE session_id = $1;
END;
$$ LANGUAGE plpgsql;

-- Function to increment created series counter
CREATE OR REPLACE FUNCTION increment_sync_session_series(session_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE remonline_sync_sessions 
  SET created_series = created_series + 1
  WHERE session_id = $1;
END;
$$ LANGUAGE plpgsql;

-- Function to increment created models counter
CREATE OR REPLACE FUNCTION increment_sync_session_models(session_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE remonline_sync_sessions 
  SET created_models = created_models + 1
  WHERE session_id = $1;
END;
$$ LANGUAGE plpgsql;
