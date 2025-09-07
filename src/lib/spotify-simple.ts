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
    id: '9',
    name: 'No Broke Boys',
    artist: 'Disco Lines, Tinashe',
    album: 'No Broke Boys (Single)',
    duration: '2:43',
    preview_url: '/Musics/goldn-uk-drill-music-116392.mp3',
    image_url: '/Images/logo.png',
    spotify_url: 'https://open.spotify.com/track/3cZajhyr8LmtPfHZ9296tj?si=dbc70b7b11344094'
  },
  {
    id: '10',
    name: 'Dior (feat. Chrystal)',
    artist: 'MK, Chrystal',
    album: 'Dior (Single)',
    duration: '2:49',
    preview_url: '/Musics/goldn-uk-drill-music-116392.mp3',
    image_url: '/Images/logo.png',
    spotify_url: 'https://open.spotify.com/track/3kPNkracUxYvwpzkdpHMQQ?si=6bdad5beb292478c'
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
