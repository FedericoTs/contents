-- Disable RLS for processing_jobs table
ALTER TABLE processing_jobs DISABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
DROP POLICY IF EXISTS "Allow all operations" ON processing_jobs;
CREATE POLICY "Allow all operations"
ON processing_jobs
FOR ALL
USING (true);
