-- Fix column name mismatch
-- Run this in Supabase SQL Editor

-- Check if the zippclips table exists and what columns it has
-- If it has video_url instead of media_url, let's fix it

-- Option 1: If table exists with video_url, rename it
DO $$ 
BEGIN
    -- Check if video_url column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'zippclips' 
        AND column_name = 'video_url'
    ) THEN
        -- Rename video_url to media_url
        ALTER TABLE zippclips RENAME COLUMN video_url TO media_url;
        
        -- Add missing columns if they don't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'zippclips' AND column_name = 'media_type'
        ) THEN
            ALTER TABLE zippclips ADD COLUMN media_type text DEFAULT 'video';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'zippclips' AND column_name = 'likes'
        ) THEN
            ALTER TABLE zippclips ADD COLUMN likes integer DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'zippclips' AND column_name = 'comments'
        ) THEN
            ALTER TABLE zippclips ADD COLUMN comments integer DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'zippclips' AND column_name = 'saves'
        ) THEN
            ALTER TABLE zippclips ADD COLUMN saves integer DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'zippclips' AND column_name = 'shares'
        ) THEN
            ALTER TABLE zippclips ADD COLUMN shares integer DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'zippclips' AND column_name = 'song_avatar_url'
        ) THEN
            ALTER TABLE zippclips ADD COLUMN song_avatar_url text;
        END IF;
        
        RAISE NOTICE 'Fixed zippclips table columns successfully!';
    ELSE
        RAISE NOTICE 'zippclips table already has correct column names or does not exist';
    END IF;
END $$;
