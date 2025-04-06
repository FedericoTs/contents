-- Add processed_content column to content_items table
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS processed_content JSONB;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update status enum to include 'processed' status
ALTER TABLE content_items DROP CONSTRAINT IF EXISTS content_items_status_check;
ALTER TABLE content_items ADD CONSTRAINT content_items_status_check 
  CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'processed'));
