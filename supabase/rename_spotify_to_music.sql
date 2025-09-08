-- Rename spotify_preview_url column to music_preview_url in zippclips table
ALTER TABLE zippclips RENAME COLUMN spotify_preview_url TO music_preview_url;

-- Add comment to clarify the column purpose
COMMENT ON COLUMN zippclips.music_preview_url IS 'Local music preview URL for audio playback';

-- Also rename in drafts table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drafts' AND column_name = 'spotify_preview_url') THEN
        ALTER TABLE drafts RENAME COLUMN spotify_preview_url TO music_preview_url;
        COMMENT ON COLUMN drafts.music_preview_url IS 'Local music preview URL for audio playback in drafts';
    END IF;
END $$;
