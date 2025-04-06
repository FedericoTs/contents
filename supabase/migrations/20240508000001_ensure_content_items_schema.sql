-- Recreate content_items table if it doesn't have all required columns
-- First, check if the table exists
CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  title TEXT NOT NULL,
  content_type TEXT NOT NULL,
  file_path TEXT,
  url TEXT,
  preview_url TEXT,
  target_type TEXT,
  status TEXT DEFAULT 'pending',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Ensure all columns exist (these will be ignored if columns already exist)
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS content_type TEXT;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS preview_url TEXT;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS target_type TEXT;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enable row-level security
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own content" ON content_items;
CREATE POLICY "Users can view their own content"
  ON content_items FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own content" ON content_items;
CREATE POLICY "Users can insert their own content"
  ON content_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own content" ON content_items;
CREATE POLICY "Users can update their own content"
  ON content_items FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own content" ON content_items;
CREATE POLICY "Users can delete their own content"
  ON content_items FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime subscriptions
DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'content_items'
  ) THEN
    alter publication supabase_realtime add table content_items;
  END IF;
END$;
