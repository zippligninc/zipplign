-- Add Spotify preview URL field to drafts table
-- This allows drafts to store Spotify preview URLs for music functionality

-- Add spotify_preview_url column to drafts table
ALTER TABLE drafts ADD COLUMN IF NOT EXISTS spotify_preview_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN drafts.spotify_preview_url IS 'Spotify preview URL for 30-second audio preview in drafts';
