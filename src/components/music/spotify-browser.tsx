'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Play, 
  Pause, 
  Music, 
  Clock, 
  Users, 
  Loader2,
  ExternalLink,
  Volume2
} from 'lucide-react';
import { 
  searchSpotifyTracks, 
  getFeaturedPlaylists, 
  getPlaylistTracks,
  getUserTopTracks,
  formatDuration,
  getTrackDisplayName,
  hasPreview,
  type SpotifyTrack,
  type SpotifyPlaylist
} from '@/lib/spotify';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface SpotifyBrowserProps {
  onTrackSelect: (track: SpotifyTrack) => void;
  selectedTrack?: SpotifyTrack | null;
}

export function SpotifyBrowser({ onTrackSelect, selectedTrack }: SpotifyBrowserProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [featuredPlaylists, setFeaturedPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [playlistTracks, setPlaylistTracks] = useState<SpotifyTrack[]>([]);
  const [userTopTracks, setUserTopTracks] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [playingTrack, setPlayingTrack] = useState<SpotifyTrack | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  // Get Spotify access token
  useEffect(() => {
    const getAccessToken = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('spotify_access_token, spotify_connected')
            .eq('id', user.id)
            .single();

          if (profile?.spotify_connected && profile.spotify_access_token) {
            setAccessToken(profile.spotify_access_token);
          }
        }
      } catch (error) {
        console.error('Error getting Spotify access token:', error);
      }
    };

    getAccessToken();
  }, []);

  // Load featured playlists on mount
  useEffect(() => {
    if (accessToken) {
      loadFeaturedPlaylists();
      loadUserTopTracks();
    }
  }, [accessToken]);

  const loadFeaturedPlaylists = async () => {
    if (!accessToken) return;
    
    setLoading(true);
    try {
      const playlists = await getFeaturedPlaylists(accessToken);
      setFeaturedPlaylists(playlists);
    } catch (error) {
      console.error('Error loading featured playlists:', error);
      toast({
        title: 'Error',
        description: 'Failed to load featured playlists',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserTopTracks = async () => {
    if (!accessToken) return;
    
    try {
      const tracks = await getUserTopTracks(accessToken);
      setUserTopTracks(tracks);
    } catch (error) {
      console.error('Error loading user top tracks:', error);
    }
  };

  const handleSearch = async (query: string) => {
    if (!accessToken || !query.trim()) return;
    
    setSearching(true);
    try {
      const results = await searchSpotifyTracks(query, accessToken);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching tracks:', error);
      toast({
        title: 'Search Error',
        description: 'Failed to search for tracks',
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  const loadPlaylistTracks = async (playlist: SpotifyPlaylist) => {
    if (!accessToken) return;
    
    setSelectedPlaylist(playlist);
    setLoading(true);
    try {
      const tracks = await getPlaylistTracks(playlist.id, accessToken);
      setPlaylistTracks(tracks);
    } catch (error) {
      console.error('Error loading playlist tracks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load playlist tracks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const playPreview = (track: SpotifyTrack) => {
    if (!track.preview_url) return;

    // Stop current audio
    if (audioRef) {
      audioRef.pause();
      audioRef.currentTime = 0;
    }

    // Create new audio element
    const audio = new Audio(track.preview_url);
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

  if (!accessToken) {
    return (
      <div className="text-center py-8">
        <Music className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">Connect to Spotify</h3>
        <p className="text-gray-400 mb-4">
          Connect your Spotify account to browse and add music to your posts.
        </p>
        <Button
          onClick={() => window.location.href = '/api/spotify/auth'}
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
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search for songs, artists, or albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
            className="flex-1"
          />
          <Button
            onClick={() => handleSearch(searchQuery)}
            disabled={searching || !searchQuery.trim()}
          >
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
          <TabsTrigger value="top">Your Top</TabsTrigger>
        </TabsList>

        {/* Search Results */}
        <TabsContent value="search" className="space-y-4">
          {searchResults.length > 0 ? (
            <div className="grid gap-3">
              {searchResults.map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  isSelected={selectedTrack?.id === track.id}
                  isPlaying={playingTrack?.id === track.id}
                  onSelect={() => onTrackSelect(track)}
                  onPlay={() => playPreview(track)}
                  onStop={stopPreview}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              Search for music to get started
            </div>
          )}
        </TabsContent>

        {/* Featured Playlists */}
        <TabsContent value="featured" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading featured playlists...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {featuredPlaylists.map((playlist) => (
                <Card
                  key={playlist.id}
                  className="cursor-pointer hover:bg-gray-800/50 transition-colors"
                  onClick={() => loadPlaylistTracks(playlist)}
                >
                  <CardContent className="p-4">
                    <div className="aspect-square relative mb-3">
                      <Image
                        src={playlist.images[0]?.url || '/placeholder-album.png'}
                        alt={playlist.name}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <h3 className="font-medium text-sm truncate">{playlist.name}</h3>
                    <p className="text-xs text-gray-400 truncate">{playlist.owner.display_name}</p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {playlist.tracks.total} tracks
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Playlist Tracks */}
        <TabsContent value="playlists" className="space-y-4">
          {selectedPlaylist ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg">
                <div className="w-16 h-16 relative">
                  <Image
                    src={selectedPlaylist.images[0]?.url || '/placeholder-album.png'}
                    alt={selectedPlaylist.name}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
                <div>
                  <h3 className="font-medium">{selectedPlaylist.name}</h3>
                  <p className="text-sm text-gray-400">{selectedPlaylist.owner.display_name}</p>
                  <p className="text-xs text-gray-500">{selectedPlaylist.tracks.total} tracks</p>
                </div>
              </div>
              
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Loading tracks...</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {playlistTracks.map((track) => (
                    <TrackCard
                      key={track.id}
                      track={track}
                      isSelected={selectedTrack?.id === track.id}
                      isPlaying={playingTrack?.id === track.id}
                      onSelect={() => onTrackSelect(track)}
                      onPlay={() => playPreview(track)}
                      onStop={stopPreview}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              Select a playlist from Featured to view tracks
            </div>
          )}
        </TabsContent>

        {/* User Top Tracks */}
        <TabsContent value="top" className="space-y-4">
          {userTopTracks.length > 0 ? (
            <div className="grid gap-3">
              {userTopTracks.map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  isSelected={selectedTrack?.id === track.id}
                  isPlaying={playingTrack?.id === track.id}
                  onSelect={() => onTrackSelect(track)}
                  onPlay={() => playPreview(track)}
                  onStop={stopPreview}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              No top tracks available
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Track Card Component
function TrackCard({ 
  track, 
  isSelected, 
  isPlaying, 
  onSelect, 
  onPlay, 
  onStop 
}: {
  track: SpotifyTrack;
  isSelected: boolean;
  isPlaying: boolean;
  onSelect: () => void;
  onPlay: () => void;
  onStop: () => void;
}) {
  return (
    <Card 
      className={`cursor-pointer transition-all ${
        isSelected 
          ? 'ring-2 ring-teal-500 bg-teal-500/10' 
          : 'hover:bg-gray-800/50'
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 relative flex-shrink-0">
            <Image
              src={track.album.images[0]?.url || '/placeholder-album.png'}
              alt={track.album.name}
              fill
              className="object-cover rounded-lg"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{track.name}</h4>
            <p className="text-xs text-gray-400 truncate">
              {track.artists.map(artist => artist.name).join(', ')}
            </p>
            <p className="text-xs text-gray-500 truncate">{track.album.name}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {formatDuration(track.duration_ms)}
            </span>
            
            {hasPreview(track) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  isPlaying ? onStop() : onPlay();
                }}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                window.open(track.external_urls.spotify, '_blank');
              }}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
