-- Quick setup for views column
-- Run this in Supabase SQL Editor if the migration hasn't been applied

-- Add views column to zippclips table
ALTER TABLE zippclips ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Update existing zippclips to have 0 views if NULL
UPDATE zippclips SET views = 0 WHERE views IS NULL;

-- Create index for better performance on view queries
CREATE INDEX IF NOT EXISTS idx_zippclips_views ON zippclips(views DESC);
