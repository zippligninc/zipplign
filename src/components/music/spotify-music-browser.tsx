'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Search, 
  Music, 
  TrendingUp,
  List,
  Grid3X3,
  Loader2
} from 'lucide-react';
import { 
  SpotifyTrack, 
  searchSpotifyTracks, 
  getFeaturedPlaylists, 
  getPlaylistTracks,
  getUserTopTracks,
  formatDuration,
  getTrackDisplayName,
  hasPreview
} from '@/lib/spotify';
import { supabase } from '@/lib/supabase';

interface SpotifyMusicBrowserProps {
  onTrackSelect: (track: SpotifyTrack) => void;
  selectedTrack?: SpotifyTrack | null;
}

export function SpotifyMusicBrowser({ onTrackSelect, selectedTrack }: SpotifyMusicBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [featuredPlaylists, setFeaturedPlaylists] = useState<any[]>([]);
  const [playlistTracks, setPlaylistTracks] = useState<SpotifyTrack[]>([]);
  const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([]);
  const [playingTrack, setPlayingTrack] = useState<SpotifyTrack | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Check if user is connected to Spotify
  useEffect(() => {
    checkSpotifyConnection();
  }, []);

  const checkSpotifyConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('spotify_access_token, spotify_connected')
          .eq('id', user.id)
          .single();

        if (profile?.spotify_connected && profile?.spotify_access_token) {
          setAccessToken(profile.spotify_access_token);
          setIsConnected(true);
          loadInitialData(profile.spotify_access_token);
        }
      }
    } catch (error) {
      console.error('Error checking Spotify connection:', error);
    }
  };

  const loadInitialData = async (token: string) => {
    setLoading(true);
    try {
      // Load featured playlists and top tracks in parallel
      const [playlists, tracks] = await Promise.all([
        getFeaturedPlaylists(token, 6),
        getUserTopTracks(token, 'medium_term', 20)
      ]);
      
      setFeaturedPlaylists(playlists);
      setTopTracks(tracks);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim() || !accessToken) return;
    
    setSearchQuery(query);
    setLoading(true);
    
    try {
      const results = await searchSpotifyTracks(query, accessToken, 20);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching tracks:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPlaylistTracks = async (playlistId: string) => {
    if (!accessToken) return;
    
    setLoading(true);
    try {
      const tracks = await getPlaylistTracks(playlistId, accessToken, 50);
      setPlaylistTracks(tracks);
    } catch (error) {
      console.error('Error loading playlist tracks:', error);
      setPlaylistTracks([]);
    } finally {
      setLoading(false);
    }
  };

  const playPreview = (track: SpotifyTrack) => {
    if (!hasPreview(track)) return;

    // Stop current audio
    if (audioRef) {
      audioRef.pause();
      audioRef.currentTime = 0;
    }

    // Create new audio element
    const audio = new Audio(track.preview_url!);
    audio.muted = isMuted;
    audio.play().catch(error => {
      console.warn('Preview play failed:', error);
    });
    
    setAudioRef(audio);
    setPlayingTrack(track);

    // Auto-stop after 30 seconds (preview length)
    setTimeout(() => {
      audio.pause();
      setPlayingTrack(null);
    }, 30000);
  };

  const stopPreview = () => {
    if (audioRef) {
      audioRef.pause();
      audioRef.currentTime = 0;
    }
    setPlayingTrack(null);
  };

  const toggleMute = () => {
    if (audioRef) {
      audioRef.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const connectSpotify = () => {
    window.location.href = '/api/spotify/auth';
  };

  const renderTrackCard = (track: SpotifyTrack) => (
    <Card 
      key={track.id} 
      className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
        selectedTrack?.id === track.id ? 'ring-2 ring-green-500' : ''
      }`}
      onClick={() => onTrackSelect(track)}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={track.album.images[0]?.url || '/placeholder-album.png'}
              alt={track.album.name}
              className="w-12 h-12 object-cover"
            />
            {hasPreview(track) && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute inset-0 h-12 w-12 p-0 bg-black/50 hover:bg-black/70"
                onClick={(e) => {
                  e.stopPropagation();
                  if (playingTrack?.id === track.id) {
                    stopPreview();
                  } else {
                    playPreview(track);
                  }
                }}
              >
                {playingTrack?.id === track.id ? (
                  <Pause className="h-4 w-4 text-white" />
                ) : (
                  <Play className="h-4 w-4 text-white" />
                )}
              </Button>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{track.name}</h4>
            <p className="text-xs text-gray-500 truncate">
              {track.artists.map(artist => artist.name).join(', ')}
            </p>
            <p className="text-xs text-gray-400 truncate">{track.album.name}</p>
          </div>
          
          <div className="text-xs text-gray-400">
            {formatDuration(track.duration_ms)}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <Music className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">Connect to Spotify</h3>
        <p className="text-gray-400 mb-4">
          Connect your Spotify account to browse and add real music to your posts.
        </p>
        <Button
          onClick={connectSpotify}
          className="bg-green-600 hover:bg-green-700"
        >
          Connect Spotify
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search for songs, artists, or albums..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Audio Controls */}
      {playingTrack && (
        <div className="bg-gray-800 rounded-lg p-4 flex items-center gap-4">
          <img
            src={playingTrack.album.images[0]?.url || '/placeholder-album.png'}
            alt={playingTrack.album.name}
            className="w-12 h-12 object-cover"
          />
          <div className="flex-1">
            <h4 className="font-medium text-sm">{playingTrack.name}</h4>
            <p className="text-xs text-gray-400">
              {playingTrack.artists.map(artist => artist.name).join(', ')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={stopPreview}
            >
              <Pause className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={toggleMute}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="trending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trending" className="text-xs">
            <TrendingUp className="h-4 w-4 mr-1" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="search" className="text-xs">
            <Search className="h-4 w-4 mr-1" />
            Search
          </TabsTrigger>
          <TabsTrigger value="playlists" className="text-xs">
            <List className="h-4 w-4 mr-1" />
            Playlists
          </TabsTrigger>
          <TabsTrigger value="top" className="text-xs">
            <Grid3X3 className="h-4 w-4 mr-1" />
            Top Tracks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trending" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              topTracks.slice(0, 12).map(renderTrackCard)
            )}
          </div>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          {searchQuery ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                <div className="col-span-full flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                searchResults.map(renderTrackCard)
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Search className="h-12 w-12 mx-auto mb-4" />
              <p>Search for your favorite songs</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="playlists" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredPlaylists.map((playlist) => (
              <Card 
                key={playlist.id}
                className="cursor-pointer hover:scale-105 transition-all duration-200"
                onClick={() => loadPlaylistTracks(playlist.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={playlist.images[0]?.url || '/placeholder-playlist.png'}
                      alt={playlist.name}
                      className="w-12 h-12 object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{playlist.name}</h4>
                      <p className="text-xs text-gray-500 truncate">{playlist.description}</p>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {playlist.tracks.total} tracks
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {playlistTracks.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Playlist Tracks</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {playlistTracks.map(renderTrackCard)}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="top" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              topTracks.map(renderTrackCard)
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
