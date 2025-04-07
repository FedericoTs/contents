-- Drop existing RLS policies for content_outputs if they exist
DROP POLICY IF EXISTS "Users can view their own content outputs" ON content_outputs;
DROP POLICY IF EXISTS "Users can insert their own content outputs" ON content_outputs;
DROP POLICY IF EXISTS "Users can update their own content outputs" ON content_outputs;

-- Enable RLS on content_outputs table
ALTER TABLE content_outputs ENABLE ROW LEVEL SECURITY;

-- Create policies for content_outputs
CREATE POLICY "Users can view their own content outputs"
ON content_outputs FOR SELECT
USING (
  auth.uid() = (SELECT user_id FROM content_items WHERE id = content_id) OR
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can insert their own content outputs"
ON content_outputs FOR INSERT
WITH CHECK (
  auth.uid() = (SELECT user_id FROM content_items WHERE id = content_id) OR
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own content outputs"
ON content_outputs FOR UPDATE
USING (
  auth.uid() = (SELECT user_id FROM content_items WHERE id = content_id) OR
  auth.uid() IS NOT NULL
);
