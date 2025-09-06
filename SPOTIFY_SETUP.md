# Spotify Integration Setup

This guide will help you set up Spotify integration for Zipplign.

## 1. Create Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create App"
4. Fill in the app details:
   - **App name**: Zipplign
   - **App description**: Social media platform with music integration
   - **Website**: Your app URL
   - **Redirect URI**: `http://localhost:3000/auth/spotify/callback` (for development)
   - **Redirect URI**: `https://yourdomain.com/auth/spotify/callback` (for production)

## 2. Get Credentials

After creating the app, you'll get:
- **Client ID**
- **Client Secret**

## 3. Environment Variables

Add these to your `.env.local` file:

```env
# Spotify Configuration
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
NEXT_PUBLIC_SPOTIFY_REDIRECT_URI=http://localhost:3000/auth/spotify/callback
```

## 4. Database Setup

Run the SQL script in Supabase SQL Editor:

```sql
-- Add Spotify integration fields to zippclips table
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
```

## 5. Features

Once set up, users can:

- **Connect Spotify Account**: Link their Spotify account to browse music
- **Search Music**: Search for songs, artists, and albums
- **Browse Playlists**: View featured playlists and user's top tracks
- **Preview Music**: Play 30-second previews of tracks
- **Add Music to Posts**: Select Spotify tracks to add to their zippclips
- **Play Music**: Music plays alongside videos and images

## 6. API Endpoints

- `GET /api/spotify/auth` - Redirects to Spotify authorization
- `POST /api/spotify/token` - Exchanges authorization code for access token
- `GET /auth/spotify/callback` - Handles Spotify callback

## 7. Components

- `SpotifyBrowser` - Music browsing interface
- `VideoUIOverlay` - Updated to support Spotify tracks
- Spotify integration utilities in `src/lib/spotify.ts`

## 8. Usage

1. User clicks "Connect Spotify" in the music section
2. User authorizes the app on Spotify
3. User can now browse and select music for their posts
4. Music plays as background audio for images or alongside video audio

## 9. Limitations

- Spotify previews are limited to 30 seconds
- Requires user to have Spotify account
- Some tracks may not have previews available
- Rate limits apply to Spotify API calls

## 10. Troubleshooting

- **"Invalid redirect URI"**: Make sure the redirect URI in your Spotify app matches exactly
- **"Invalid client"**: Check that your Client ID and Secret are correct
- **"Access denied"**: User may have denied permission or the app may not be approved
- **No previews**: Some tracks don't have preview URLs available
