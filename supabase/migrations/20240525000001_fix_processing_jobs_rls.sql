-- Drop existing RLS policies for processing_jobs if they exist
DROP POLICY IF EXISTS "Users can view their own processing jobs" ON processing_jobs;
DROP POLICY IF EXISTS "Users can insert their own processing jobs" ON processing_jobs;
DROP POLICY IF EXISTS "Users can update their own processing jobs" ON processing_jobs;

-- Enable RLS on processing_jobs table
ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for processing_jobs
CREATE POLICY "Users can view their own processing jobs"
ON processing_jobs FOR SELECT
USING (
  auth.uid() = (SELECT user_id FROM content_items WHERE id = content_id) OR
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can insert their own processing jobs"
ON processing_jobs FOR INSERT
WITH CHECK (
  auth.uid() = (SELECT user_id FROM content_items WHERE id = content_id) OR
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own processing jobs"
ON processing_jobs FOR UPDATE
USING (
  auth.uid() = (SELECT user_id FROM content_items WHERE id = content_id) OR
  auth.uid() IS NOT NULL
);
