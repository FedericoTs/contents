-- Check if the status column exists before trying to alter it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'content_items' 
    AND column_name = 'status'
  ) THEN
    -- Add the status column if it doesn't exist
    ALTER TABLE content_items ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;

  -- Refresh the schema cache
  NOTIFY pgrst, 'reload schema';
END$$;
