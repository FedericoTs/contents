-- Add target_type column to content_items table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'content_items' 
                AND column_name = 'target_type') THEN
    ALTER TABLE content_items ADD COLUMN target_type TEXT DEFAULT 'social';
  END IF;
  
  -- Refresh the schema cache
  NOTIFY pgrst, 'reload schema';
END$$;