'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SimpleMusicBrowser } from '@/components/music/simple-music-browser';
import { type SimpleTrack } from '@/lib/spotify-simple';

export default function AddMusicPage() {
  const router = useRouter();
  const [selectedTrack, setSelectedTrack] = useState<SimpleTrack | null>(null);

  const handleTrackSelect = (track: SimpleTrack) => {
    setSelectedTrack(track);
  };

  const handleContinue = () => {
    if (selectedTrack) {
      // Store selected track in localStorage or pass to next page
      localStorage.setItem('selectedMusic', JSON.stringify(selectedTrack));
      router.push('/create/post');
    }
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 bg-black flex items-center justify-between p-3 sm:p-4 border-b border-gray-800">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-white hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <h1 className="text-base sm:text-lg font-semibold">Add Music</h1>
        </div>
        {selectedTrack && (
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-teal-400">
            <Check className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Music Selected</span>
            <span className="sm:hidden">Selected</span>
          </div>
        )}
      </header>

      {/* Music Browser - Scrollable */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4">
        <SimpleMusicBrowser 
          onTrackSelect={handleTrackSelect}
          selectedTrack={selectedTrack}
        />
      </div>

      {/* Bottom Actions - Fixed */}
      <div className="flex-shrink-0 bg-black border-t border-gray-800 p-2 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 text-sm sm:text-base"
            onClick={() => {
              setSelectedTrack(null);
              localStorage.removeItem('selectedMusic');
            }}
          >
            No Music
          </Button>
          <Button 
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-sm sm:text-base"
            onClick={handleContinue}
            disabled={!selectedTrack}
          >
            {selectedTrack ? 'Continue with Music' : 'Select Music'}
          </Button>
        </div>
      </div>
    </div>
  );
}