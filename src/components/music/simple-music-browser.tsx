'use client';

import React, { useState, useEffect } from 'react';
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
  const [localTracks, setLocalTracks] = useState<SimpleTrack[]>([]);
  const [playingTrack, setPlayingTrack] = useState<SimpleTrack | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [oscillator, setOscillator] = useState<OscillatorNode | null>(null);
  const [gainNode, setGainNode] = useState<GainNode | null>(null);

  useEffect(() => {
    // Load local tracks from API
    fetch('/api/local-music')
      .then(res => res.json())
      .then(data => setLocalTracks(data.tracks || []))
      .catch(() => setLocalTracks([]));
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const base = localTracks.length ? localTracks : searchMusic('');
    const results = !query.trim()
      ? base
      : base.filter(t =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.artist.toLowerCase().includes(query.toLowerCase()) ||
          t.album.toLowerCase().includes(query.toLowerCase())
        );
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
    audio.play().catch(async error => {
      console.info('Preview source unsupported, using tone fallback.');
      // Fallback: use Web Audio API to play a short tone so user hears feedback
      try {
        const ctx = audioContext || new (window.AudioContext || (window as any).webkitAudioContext)();
        if (!audioContext) setAudioContext(ctx);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 440; // A4 tone
        gain.gain.value = isMuted ? 0 : 0.05; // low volume
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        setOscillator(osc);
        setGainNode(gain);
        // Stop after 1 second
        setTimeout(() => {
          try { osc.stop(); } catch {}
          setOscillator(null);
          setGainNode(null);
        }, 1000);
      } catch (e) {
        console.warn('WebAudio fallback failed:', e);
      }
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
    if (oscillator) {
      try { oscillator.stop(); } catch {}
      setOscillator(null);
    }
    setPlayingTrack(null);
  };

  const toggleMute = () => {
    if (audioRef) {
      audioRef.muted = !isMuted;
      setIsMuted(!isMuted);
    }
    if (gainNode) {
      gainNode.gain.value = !isMuted ? 0 : 0.05;
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {(localTracks.length ? localTracks : getTrendingMusic()).map((track) => (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
                  <div className="aspect-square bg-gradient-to-br from-teal-500 to-purple-600 mb-3 flex items-center justify-center">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {(localTracks.length ? localTracks : getMusicByCategory('all')).map((track) => (
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
        <div className="fixed bottom-20 left-2 right-2 sm:left-4 sm:right-4 bg-black/90 backdrop-blur-sm p-3 sm:p-4 z-50">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 relative flex-shrink-0">
              <Image
                src={playingTrack.image_url}
                alt={playingTrack.album}
                fill
                sizes="(max-width: 640px) 40px, (max-width: 768px) 48px, 48px"
                className="object-cover"
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
        <div className="space-y-3">
          {/* Album Cover */}
          <div className="aspect-square relative w-full">
            <Image
              src={track.image_url}
              alt={track.album}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
              className="object-cover"
            />
          </div>
          
          {/* Track Info */}
          <div className="space-y-1">
            <h4 className="font-medium text-sm sm:text-base truncate">{track.name}</h4>
            <p className="text-xs sm:text-sm text-gray-400 truncate">{track.artist}</p>
            <p className="text-xs text-gray-500 truncate">{track.album}</p>
            <p className="text-xs text-gray-400">{track.duration}</p>
          </div>
          
          {/* Controls */}
          <div className="flex items-center justify-between pt-2">
            {track.preview_url && (
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
                window.open(track.spotify_url, '_blank');
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
