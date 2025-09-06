-- Add Spotify integration fields to zippclips table
-- Run this in Supabase SQL Editor

-- Add Spotify fields to zippclips table
ALTER TABLE zippclips ADD COLUMN IF NOT EXISTS spotify_track_id TEXT;
ALTER TABLE zippclips ADD COLUMN IF NOT EXISTS spotify_preview_url TEXT;
ALTER TABLE zippclips ADD COLUMN IF NOT EXISTS spotify_track_name TEXT;
ALTER TABLE zippclips ADD COLUMN IF NOT EXISTS spotify_artist_name TEXT;
ALTER TABLE zippclips ADD COLUMN IF NOT EXISTS spotify_album_name TEXT;
ALTER TABLE zippclips ADD COLUMN IF NOT EXISTS spotify_album_image_url TEXT;

-- Add Spotify fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS spotify_access_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS spotify_refresh_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS spotify_connected BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS spotify_connected_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_zippclips_spotify_track_id ON zippclips(spotify_track_id);
CREATE INDEX IF NOT EXISTS idx_profiles_spotify_connected ON profiles(spotify_connected);

-- Add comments for documentation
COMMENT ON COLUMN zippclips.spotify_track_id IS 'Spotify track ID for music integration';
COMMENT ON COLUMN zippclips.spotify_preview_url IS 'Spotify preview URL for 30-second audio preview';
COMMENT ON COLUMN zippclips.spotify_track_name IS 'Spotify track name';
COMMENT ON COLUMN zippclips.spotify_artist_name IS 'Spotify artist name(s)';
COMMENT ON COLUMN zippclips.spotify_album_name IS 'Spotify album name';
COMMENT ON COLUMN zippclips.spotify_album_image_url IS 'Spotify album cover image URL';

COMMENT ON COLUMN profiles.spotify_access_token IS 'Spotify API access token';
COMMENT ON COLUMN profiles.spotify_refresh_token IS 'Spotify API refresh token';
COMMENT ON COLUMN profiles.spotify_connected IS 'Whether user has connected Spotify';
COMMENT ON COLUMN profiles.spotify_connected_at IS 'When user connected Spotify';
