-- Create processing_jobs table if it doesn't exist
CREATE TABLE IF NOT EXISTS processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  content_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
  target_format TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  options JSONB,
  result JSONB,
  error TEXT
);

-- Enable row-level security
ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own processing jobs" ON processing_jobs;
CREATE POLICY "Users can view their own processing jobs"
  ON processing_jobs FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM content_items WHERE id = content_id
    )
  );

DROP POLICY IF EXISTS "Users can insert their own processing jobs" ON processing_jobs;
CREATE POLICY "Users can insert their own processing jobs"
  ON processing_jobs FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM content_items WHERE id = content_id
    )
  );

DROP POLICY IF EXISTS "Users can update their own processing jobs" ON processing_jobs;
CREATE POLICY "Users can update their own processing jobs"
  ON processing_jobs FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM content_items WHERE id = content_id
    )
  );

DROP POLICY IF EXISTS "Users can delete their own processing jobs" ON processing_jobs;
CREATE POLICY "Users can delete their own processing jobs"
  ON processing_jobs FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM content_items WHERE id = content_id
    )
  );

-- Enable realtime subscriptions
alter publication supabase_realtime add table processing_jobs;
