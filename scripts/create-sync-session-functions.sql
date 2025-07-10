-- Function to increment sync session brands
CREATE OR REPLACE FUNCTION increment_sync_session_brands(session_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE remonline_sync_sessions 
  SET created_brands = created_brands + 1,
      updated_at = NOW()
  WHERE remonline_sync_sessions.session_id = increment_sync_session_brands.session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment sync session series
CREATE OR REPLACE FUNCTION increment_sync_session_series(session_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE remonline_sync_sessions 
  SET created_series = created_series + 1,
      updated_at = NOW()
  WHERE remonline_sync_sessions.session_id = increment_sync_session_series.session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment sync session models
CREATE OR REPLACE FUNCTION increment_sync_session_models(session_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE remonline_sync_sessions 
  SET created_models = created_models + 1,
      updated_at = NOW()
  WHERE remonline_sync_sessions.session_id = increment_sync_session_models.session_id;
END;
$$ LANGUAGE plpgsql;
