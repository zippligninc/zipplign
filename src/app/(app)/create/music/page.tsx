
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Bookmark,
  ChevronDown,
  Flame,
  Music,
  Search,
  Settings,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const sounds = [
  {
    title: 'Upbeat Funk Groove',
    artist: 'FunkMaster',
    duration: '2:34',
    image: 'https://picsum.photos/seed/sound1/56/56',
  },
  {
    title: 'Acoustic Sunrise',
    artist: 'IndieFolk',
    duration: '3:12',
    image: 'https://picsum.photos/seed/sound2/56/56',
  },
  {
    title: 'Lo-Fi Chill Hop',
    artist: 'BeatScaper',
    duration: '2:58',
    image: 'https://picsum.photos/seed/sound3/56/56',
  },
  {
    title: 'Epic Cinematic Score',
    artist: 'OrchestraMax',
    duration: '4:01',
    image: 'https://picsum.photos/seed/sound4/56/56',
  },
  {
    title: '80s Retro Wave',
    artist: 'SynthRider',
    duration: '3:45',
    image: 'https://picsum.photos/seed/sound5/56/56',
  },
];
const playlistItems = ['Zipping', 'Workout', 'Chill', 'Party', 'Focus', 'Romance'];

export default function AddMusicPage() {
  const router = useRouter();

  const handleSelectSound = (sound: any) => {
    // Store selected music in sessionStorage to pass to post page
    try {
      sessionStorage.setItem('selectedMusic', JSON.stringify({
        title: sound.title,
        artist: sound.artist,
        duration: sound.duration,
        image: sound.image,
        timestamp: Date.now()
      }));
      
      // Navigate back to create page
      router.push('/create');
    } catch (error) {
      console.error('Error storing selected music:', error);
    }
  };

  return (
    <div className="h-full bg-background text-foreground">
      <header className="flex items-center justify-between p-4 sticky top-0 bg-background z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Button variant="ghost" className="text-lg font-bold">
          Sounds <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings">
            <Settings className="h-5 w-5" />
          </Link>
        </Button>
      </header>

      <main className="px-4 pb-8">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search" className="pl-9" />
        </div>

        <div className="rounded-lg bg-muted p-3 mb-4">
          <div className="flex items-start gap-3">
            <div className="bg-primary/20 p-1.5 rounded-full">
                <Music className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground flex-1">
              Find the perfect sound for your Zippclip.
            </p>
            <Button variant="ghost" size="icon" className="h-5 w-5 -mr-1 -mt-1">
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="relative aspect-video mt-3 rounded-md overflow-hidden">
            <Image
              src="https://picsum.photos/seed/music-banner/600/338"
              alt="Music banner"
              fill
              className="object-cover"
              data-ai-hint="singer on stage"
            />
          </div>
        </div>

        <div className="flex space-x-2 mb-4 overflow-x-auto pb-2 -mx-4 px-4">
          <Button className="rounded-full h-8" variant="primary">For you</Button>
          <Button className="rounded-full h-8" variant="secondary">Favorites</Button>
          <Button className="rounded-full h-8" variant="secondary">More</Button>
          <Button className="rounded-full h-8" variant="secondary">Your sounds</Button>
        </div>

        <div className="space-y-1">
          {sounds.length > 0 ? (
            sounds.map((sound, index) => (
              <div key={index} className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-muted/50">
                <Image
                  src={sound.image}
                  alt={sound.title}
                  width={48}
                  height={48}
                  className="rounded-md"
                />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{sound.title}</p>
                  <p className="text-xs text-muted-foreground">{sound.artist}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{sound.duration}</p>
                </div>
                <Button variant="ghost" size="icon">
                  <Bookmark className="h-5 w-5" />
                </Button>
                <Button size="sm" onClick={() => handleSelectSound(sound)}>Use</Button>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-8">No sounds found. Try a different search.</p>
          )}
        </div>
        
        <h2 className="text-base font-bold mt-6 mb-3">Playlist</h2>
        <div className="grid grid-cols-3 gap-2">
            {playlistItems.length > 0 ? (
              playlistItems.map((item, index) => (
                   <Button key={index} variant="secondary" className="font-normal h-9">
                      <Flame className="h-4 w-4 mr-2 text-orange-500" />
                      {item}
                   </Button>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8 col-span-3">No playlists available.</p>
            )}
        </div>
      </main>
    </div>
  );
}
