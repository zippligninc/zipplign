// Simple Spotify integration for music library browsing
// This approach uses public endpoints and doesn't require user authentication

export interface SimpleTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  duration: string;
  preview_url: string | null;
  image_url: string;
  spotify_url: string;
}

// Predefined music categories for users to browse
export const MUSIC_CATEGORIES = [
  {
    id: 'trending',
    name: 'Trending Now',
    description: 'Popular songs everyone is listening to'
  },
  {
    id: 'hip-hop',
    name: 'Hip Hop',
    description: 'Latest hip hop and rap tracks'
  },
  {
    id: 'pop',
    name: 'Pop',
    description: 'Current pop hits'
  },
  {
    id: 'electronic',
    name: 'Electronic',
    description: 'EDM and electronic music'
  },
  {
    id: 'rock',
    name: 'Rock',
    description: 'Rock and alternative music'
  },
  {
    id: 'rnb',
    name: 'R&B',
    description: 'R&B and soul music'
  },
  {
    id: 'country',
    name: 'Country',
    description: 'Country and folk music'
  },
  {
    id: 'latin',
    name: 'Latin',
    description: 'Latin and reggaeton'
  }
];

// Sample music library - in a real app, this would come from Spotify API
export const SAMPLE_MUSIC_LIBRARY: SimpleTrack[] = [
  {
    id: '1',
    name: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: '3:20',
    preview_url: 'https://p.scdn.co/mp3-preview/sample1.mp3',
    image_url: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36',
    spotify_url: 'https://open.spotify.com/track/0VjIjW4WUjz9FcI5nbtM4x'
  },
  {
    id: '2',
    name: 'Levitating',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    duration: '3:23',
    preview_url: 'https://p.scdn.co/mp3-preview/sample2.mp3',
    image_url: 'https://i.scdn.co/image/ab67616d0000b273ef24c3d2c4f4b2b2b2b2b2b2',
    spotify_url: 'https://open.spotify.com/track/463CkQjx2Zk1yXoBuierM9'
  },
  {
    id: '3',
    name: 'Good 4 U',
    artist: 'Olivia Rodrigo',
    album: 'SOUR',
    duration: '2:58',
    preview_url: 'https://p.scdn.co/mp3-preview/sample3.mp3',
    image_url: 'https://i.scdn.co/image/ab67616d0000b273a91c10fe9472d9bd89802e5a',
    spotify_url: 'https://open.spotify.com/track/4ZtFanR9U6ndgddUvNcjcG'
  },
  {
    id: '4',
    name: 'Industry Baby',
    artist: 'Lil Nas X ft. Jack Harlow',
    album: 'MONTERO',
    duration: '3:32',
    preview_url: 'https://p.scdn.co/mp3-preview/sample4.mp3',
    image_url: 'https://i.scdn.co/image/ab67616d0000b273c4b2b2b2b2b2b2b2b2b2b2b2',
    spotify_url: 'https://open.spotify.com/track/27NovPIUIRrOZoCHxABJwK'
  },
  {
    id: '5',
    name: 'Stay',
    artist: 'The Kid LAROI & Justin Bieber',
    album: 'F*CK LOVE 3: OVER YOU',
    duration: '2:21',
    preview_url: 'https://p.scdn.co/mp3-preview/sample5.mp3',
    image_url: 'https://i.scdn.co/image/ab67616d0000b273b2b2b2b2b2b2b2b2b2b2b2b2',
    spotify_url: 'https://open.spotify.com/track/5PjdY0CKGZdEuoNab3yDmX'
  },
  {
    id: '6',
    name: 'Heat Waves',
    artist: 'Glass Animals',
    album: 'Dreamland',
    duration: '3:58',
    preview_url: 'https://p.scdn.co/mp3-preview/sample6.mp3',
    image_url: 'https://i.scdn.co/image/ab67616d0000b273d2b2b2b2b2b2b2b2b2b2b2b2',
    spotify_url: 'https://open.spotify.com/track/02MWAaffLxlfxAUY7c5dvx'
  },
  {
    id: '7',
    name: 'Peaches',
    artist: 'Justin Bieber ft. Daniel Caesar & Giveon',
    album: 'Justice',
    duration: '3:18',
    preview_url: 'https://p.scdn.co/mp3-preview/sample7.mp3',
    image_url: 'https://i.scdn.co/image/ab67616d0000b273e2b2b2b2b2b2b2b2b2b2b2b2',
    spotify_url: 'https://open.spotify.com/track/4iJyoBOLtHqaGxP12qzhQI'
  },
  {
    id: '8',
    name: 'Kiss Me More',
    artist: 'Doja Cat ft. SZA',
    album: 'Planet Her',
    duration: '3:28',
    preview_url: 'https://p.scdn.co/mp3-preview/sample8.mp3',
    image_url: 'https://i.scdn.co/image/ab67616d0000b273f2b2b2b2b2b2b2b2b2b2b2b2',
    spotify_url: 'https://open.spotify.com/track/3DarAbFujv6eYNliUTyqtz'
  }
];

// Get music by category
export function getMusicByCategory(categoryId: string): SimpleTrack[] {
  // In a real implementation, this would filter based on category
  // For now, return all tracks
  return SAMPLE_MUSIC_LIBRARY;
}

// Search music
export function searchMusic(query: string): SimpleTrack[] {
  if (!query.trim()) return SAMPLE_MUSIC_LIBRARY;
  
  const lowercaseQuery = query.toLowerCase();
  return SAMPLE_MUSIC_LIBRARY.filter(track => 
    track.name.toLowerCase().includes(lowercaseQuery) ||
    track.artist.toLowerCase().includes(lowercaseQuery) ||
    track.album.toLowerCase().includes(lowercaseQuery)
  );
}

// Get trending music
export function getTrendingMusic(): SimpleTrack[] {
  // Return first 6 tracks as "trending"
  return SAMPLE_MUSIC_LIBRARY.slice(0, 6);
}

// Get track by ID
export function getTrackById(id: string): SimpleTrack | null {
  return SAMPLE_MUSIC_LIBRARY.find(track => track.id === id) || null;
}

// Format duration from seconds to MM:SS
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
