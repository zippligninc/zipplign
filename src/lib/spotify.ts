// Spotify Web API integration
// This file handles Spotify authentication and API calls

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  album: {
    id: string;
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
  duration_ms: number;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
  uri: string;
}

export interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
    total: number;
  };
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  tracks: {
    total: number;
  };
  owner: {
    display_name: string;
  };
}

// Spotify API configuration
const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
const SPOTIFY_REDIRECT_URI = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || 'http://localhost:3000/auth/spotify/callback';

// Spotify API endpoints
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';

// Generate Spotify authorization URL
export function getSpotifyAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID || '',
    response_type: 'code',
    redirect_uri: SPOTIFY_REDIRECT_URI,
    scope: 'user-read-private user-read-email user-top-read playlist-read-private user-library-read',
    show_dialog: 'true'
  });

  return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

// Exchange authorization code for access token
export async function exchangeCodeForToken(code: string): Promise<{ access_token: string; refresh_token: string } | null> {
  try {
    const response = await fetch('/api/spotify/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    return null;
  }
}

// Search for tracks on Spotify
export async function searchSpotifyTracks(query: string, accessToken: string, limit: number = 20): Promise<SpotifyTrack[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      type: 'track',
      limit: limit.toString(),
      market: 'US'
    });

    const response = await fetch(`${SPOTIFY_API_BASE}/search?${params}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to search Spotify tracks');
    }

    const data: SpotifySearchResponse = await response.json();
    return data.tracks.items;
  } catch (error) {
    console.error('Error searching Spotify tracks:', error);
    return [];
  }
}

// Get featured playlists
export async function getFeaturedPlaylists(accessToken: string, limit: number = 20): Promise<SpotifyPlaylist[]> {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      country: 'US'
    });

    const response = await fetch(`${SPOTIFY_API_BASE}/browse/featured-playlists?${params}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get featured playlists');
    }

    const data = await response.json();
    return data.playlists.items;
  } catch (error) {
    console.error('Error getting featured playlists:', error);
    return [];
  }
}

// Get playlist tracks
export async function getPlaylistTracks(playlistId: string, accessToken: string, limit: number = 50): Promise<SpotifyTrack[]> {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      market: 'US'
    });

    const response = await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks?${params}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get playlist tracks');
    }

    const data = await response.json();
    return data.items.map((item: any) => item.track).filter((track: any) => track !== null);
  } catch (error) {
    console.error('Error getting playlist tracks:', error);
    return [];
  }
}

// Get user's top tracks
export async function getUserTopTracks(accessToken: string, timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', limit: number = 20): Promise<SpotifyTrack[]> {
  try {
    const params = new URLSearchParams({
      time_range: timeRange,
      limit: limit.toString(),
    });

    const response = await fetch(`${SPOTIFY_API_BASE}/me/top/tracks?${params}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user top tracks');
    }

    const data = await response.json();
    return data.items;
  } catch (error) {
    console.error('Error getting user top tracks:', error);
    return [];
  }
}

// Format track duration
export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Get track display name
export function getTrackDisplayName(track: SpotifyTrack): string {
  return `${track.name} - ${track.artists.map(artist => artist.name).join(', ')}`;
}

// Check if track has preview
export function hasPreview(track: SpotifyTrack): boolean {
  return track.preview_url !== null && track.preview_url !== '';
}
