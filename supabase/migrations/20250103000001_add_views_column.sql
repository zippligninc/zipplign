-- Add views column to zippclips table
-- This migration adds view count tracking to zippclips

-- Add views column to zippclips table
ALTER TABLE zippclips ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Create function to increment view count
CREATE OR REPLACE FUNCTION increment_zippclip_views(zippclip_id UUID)
RETURNS INTEGER AS $$
DECLARE
    new_view_count INTEGER;
BEGIN
    UPDATE zippclips 
    SET views = views + 1 
    WHERE id = zippclip_id
    RETURNING views INTO new_view_count;
    
    RETURN COALESCE(new_view_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_zippclip_views(UUID) TO authenticated;

-- Create index for better performance on view queries
CREATE INDEX IF NOT EXISTS idx_zippclips_views ON zippclips(views DESC);

-- Update existing zippclips to have 0 views if NULL
UPDATE zippclips SET views = 0 WHERE views IS NULL;
