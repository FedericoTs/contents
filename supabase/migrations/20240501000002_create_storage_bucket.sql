-- Create storage bucket for content files
INSERT INTO storage.buckets (id, name, public)
VALUES ('content', 'content', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the content bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'content');

DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'content');

DROP POLICY IF EXISTS "Owners can update" ON storage.objects;
CREATE POLICY "Owners can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (auth.uid() = owner);

DROP POLICY IF EXISTS "Owners can delete" ON storage.objects;
CREATE POLICY "Owners can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (auth.uid() = owner);
