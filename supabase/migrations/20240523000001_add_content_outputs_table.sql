-- Create a new table to store multiple processed outputs for each content item
CREATE TABLE IF NOT EXISTS content_outputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  output_type TEXT NOT NULL,
  target_format TEXT NOT NULL,
  processed_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  options JSONB DEFAULT '{}'::JSONB
);

-- Add index for faster queries by content_id
CREATE INDEX IF NOT EXISTS idx_content_outputs_content_id ON content_outputs(content_id);

-- Enable row level security
ALTER TABLE content_outputs ENABLE ROW LEVEL SECURITY;

-- Create policies for content_outputs
DROP POLICY IF EXISTS "Users can view their own content outputs" ON content_outputs;
CREATE POLICY "Users can view their own content outputs"
  ON content_outputs
  FOR SELECT
  USING (
    content_id IN (
      SELECT id FROM content_items WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own content outputs" ON content_outputs;
CREATE POLICY "Users can insert their own content outputs"
  ON content_outputs
  FOR INSERT
  WITH CHECK (
    content_id IN (
      SELECT id FROM content_items WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own content outputs" ON content_outputs;
CREATE POLICY "Users can update their own content outputs"
  ON content_outputs
  FOR UPDATE
  USING (
    content_id IN (
      SELECT id FROM content_items WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own content outputs" ON content_outputs;
CREATE POLICY "Users can delete their own content outputs"
  ON content_outputs
  FOR DELETE
  USING (
    content_id IN (
      SELECT id FROM content_items WHERE user_id = auth.uid()
    )
  );

-- Realtime is already enabled for content_outputs