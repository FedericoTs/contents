-- Create content_items table
CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content_type TEXT NOT NULL,
  file_path TEXT,
  url TEXT,
  preview_url TEXT,
  target_type TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
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

-- Enable realtime
alter publication supabase_realtime add table content_items;