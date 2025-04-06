-- Add author and published_at columns to content_items table
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS author TEXT;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;
