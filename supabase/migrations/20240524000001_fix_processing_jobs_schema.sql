-- Add source_content_id and previous_transformation_id columns to processing_jobs if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'processing_jobs' AND column_name = 'source_content_id') THEN
        ALTER TABLE processing_jobs ADD COLUMN source_content_id UUID REFERENCES content_items(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'processing_jobs' AND column_name = 'previous_transformation_id') THEN
        ALTER TABLE processing_jobs ADD COLUMN previous_transformation_id UUID REFERENCES content_outputs(id);
    END IF;
    
    -- Make sure target_format column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'processing_jobs' AND column_name = 'target_format') THEN
        ALTER TABLE processing_jobs ADD COLUMN target_format TEXT;
    END IF;
END $$;

-- Check if processing_jobs table is already in the publication before adding it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'processing_jobs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE processing_jobs;
    END IF;
END $$;
