'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Play, 
  Pause, 
  Music, 
  Clock, 
  ExternalLink,
  Volume2,
  VolumeX
} from 'lucide-react';
import { 
  MUSIC_CATEGORIES,
  getMusicByCategory,
  searchMusic,
  getTrendingMusic,
  type SimpleTrack
} from '@/lib/spotify-simple';
import Image from 'next/image';

interface SimpleMusicBrowserProps {
  onTrackSelect: (track: SimpleTrack) => void;
  selectedTrack?: SimpleTrack | null;
}

export function SimpleMusicBrowser({ onTrackSelect, selectedTrack }: SimpleMusicBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SimpleTrack[]>([]);
  const [playingTrack, setPlayingTrack] = useState<SimpleTrack | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const results = searchMusic(query);
    setSearchResults(results);
  };

  const playPreview = (track: SimpleTrack) => {
    if (!track.preview_url) return;

    // Stop current audio
    if (audioRef) {
      audioRef.pause();
      audioRef.currentTime = 0;
    }

    // Create new audio element
    const audio = new Audio(track.preview_url);
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

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search for songs, artists, or albums..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={() => handleSearch(searchQuery)}
            disabled={!searchQuery.trim()}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="trending" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="trending" className="text-xs sm:text-sm">Trending</TabsTrigger>
          <TabsTrigger value="search" className="text-xs sm:text-sm">Search</TabsTrigger>
          <TabsTrigger value="categories" className="text-xs sm:text-sm">Categories</TabsTrigger>
          <TabsTrigger value="all" className="text-xs sm:text-sm">All Music</TabsTrigger>
        </TabsList>

        {/* Trending Music */}
        <TabsContent value="trending" className="space-y-4">
          <div className="grid gap-3">
            {getTrendingMusic().map((track) => (
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
        </TabsContent>

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
              {searchQuery ? 'No results found' : 'Search for music to get started'}
            </div>
          )}
        </TabsContent>

        {/* Categories */}
        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {MUSIC_CATEGORIES.map((category) => (
              <Card
                key={category.id}
                className="cursor-pointer hover:bg-gray-800/50 transition-colors"
                onClick={() => {
                  const tracks = getMusicByCategory(category.id);
                  setSearchResults(tracks);
                }}
              >
                <CardContent className="p-4">
                  <div className="aspect-square bg-gradient-to-br from-teal-500 to-purple-600 rounded-lg mb-3 flex items-center justify-center">
                    <Music className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-medium text-sm">{category.name}</h3>
                  <p className="text-xs text-gray-400">{category.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* All Music */}
        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-3">
            {getMusicByCategory('all').map((track) => (
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
        </TabsContent>
      </Tabs>

      {/* Audio Controls */}
      {playingTrack && (
        <div className="fixed bottom-20 left-2 right-2 sm:left-4 sm:right-4 bg-black/90 backdrop-blur-sm rounded-lg p-3 sm:p-4 z-50">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 relative flex-shrink-0">
              <Image
                src={playingTrack.image_url}
                alt={playingTrack.album}
                fill
                className="object-cover rounded-lg"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-xs sm:text-sm truncate">{playingTrack.name}</h4>
              <p className="text-xs text-gray-400 truncate">{playingTrack.artist}</p>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                onClick={stopPreview}
              >
                <Pause className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                onClick={toggleMute}
              >
                {isMuted ? (
                  <VolumeX className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : (
                  <Volume2 className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
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
  track: SimpleTrack;
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
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 relative flex-shrink-0">
            <Image
              src={track.image_url}
              alt={track.album}
              fill
              className="object-cover rounded-lg"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-xs sm:text-sm truncate">{track.name}</h4>
            <p className="text-xs text-gray-400 truncate">{track.artist}</p>
            <p className="text-xs text-gray-500 truncate hidden sm:block">{track.album}</p>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-xs text-gray-400 hidden sm:inline">
              {track.duration}
            </span>
            
            {track.preview_url && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  isPlaying ? onStop() : onPlay();
                }}
              >
                {isPlaying ? (
                  <Pause className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : (
                  <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                window.open(track.spotify_url, '_blank');
              }}
            >
              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
