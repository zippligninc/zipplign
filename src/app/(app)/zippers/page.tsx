'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Bell, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LogoLarge } from '@/components/common/logo';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useTouchGestures, useHapticFeedback, useDeviceCapabilities } from '@/hooks/use-touch-gestures';
// Using scroll snap instead of carousel for better video control
import { VideoUIOverlay } from '@/components/home/video-ui-overlay';
import { LazyMedia } from '@/components/optimized/lazy-media';
import { LoadingOverlay } from '@/components/ui/loading-states';
import { ErrorBoundary } from '@/components/error/error-boundary';
import { sampleZippclips } from '@/lib/sample-content';

type Profile = {
  username: string;
  full_name: string;
  avatar_url: string;
};

type Zippclip = {
  id: string;
  profiles: Profile | null;
  description: string;
  song: string;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  media_url: string;
  media_type: 'image' | 'video';
  song_avatar_url: string;
};

const navItems = [
    { href: '/events', label: 'Events' },
    { href: '/zippers', label: 'Zippers' },
    { href: '/store', label: 'Store' },
    { href: '/home', label: 'For You' },
    { href: '/live', label: 'Live' },
];

const MediaPlayer = ({ clip, isActive }: { clip: Zippclip; isActive: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { triggerHaptic } = useHapticFeedback();
  const { isMobile } = useDeviceCapabilities();
  
  // Handle case where profiles might be null
  const user = clip.profiles || {
    username: 'unknown',
    full_name: 'Unknown User',
    avatar_url: ''
  };

  useEffect(() => {
    if (clip.media_type === 'video' && videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(error => {
          console.warn("Autoplay prevented: ", error);
          setIsPlaying(false);
        });
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        videoRef.current.muted = true; // Ensure video is muted when not active
        setIsPlaying(false);
        setIsMuted(true); // Update mute state
        videoRef.current.currentTime = 0;
      }
    }
  }, [isActive, clip.media_type]);

  const handleVideoError = () => {
    console.error('Video failed to load:', clip.media_url);
    setHasError(true);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
      // Haptic feedback on mobile
      if (isMobile) {
        triggerHaptic('light');
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      if (isMobile) {
        triggerHaptic('light');
      }
    }
  };

  const handleTouchStart = () => {
    setShowControls(true);
    setTimeout(() => setShowControls(false), 3000);
  };

  if (hasError) {
    return (
      <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-sm">Failed to load video</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => {
              setHasError(false);
              if (videoRef.current) {
                videoRef.current.load();
              }
            }}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-full bg-black flex items-center justify-center"
      onClick={handleTouchStart}
    >
      {clip.media_type === 'video' ? (
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            loop
            muted={isMuted}
            playsInline
            onError={handleVideoError}
          >
            <source src={clip.media_url} type="video/mp4" />
          </video>
          
          {/* Mute Button - Layered directly on video */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-10 w-10 rounded-full bg-black/80 hover:bg-black/90 z-50 border border-white/20"
            onClick={toggleMute}
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5 text-white" />
            ) : (
              <Volume2 className="h-5 w-5 text-white" />
            )}
          </Button>
        </div>
      ) : (
        <LazyMedia
          src={clip.media_url}
          alt={clip.description}
          type="image"
          width={400}
          height={600}
          className="w-full h-full object-contain"
        />
      )}

      {/* Video Controls Overlay */}
      {clip.media_type === 'video' && showControls && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <Button
            variant="ghost"
            size="lg"
            className="h-20 w-20 rounded-full bg-black/50 hover:bg-black/70"
            onClick={togglePlay}
          >
            {isPlaying ? (
              <Pause className="h-10 w-10 text-white" />
            ) : (
              <Play className="h-10 w-10 text-white" />
            )}
          </Button>
        </div>
      )}


      {/* Video UI Overlay */}
      <VideoUIOverlay
        id={clip.id}
        user={user}
        description={clip.description}
        song={clip.song}
        likes={clip.likes}
        comments={clip.comments}
        saves={clip.saves}
        shares={clip.shares}
        song_avatar_url={clip.song_avatar_url}
        media_url={clip.media_url}
        media_type={clip.media_type}
      />
    </div>
  );
};

function ZippersHeader() {
    const pathname = usePathname();
    return (
        <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 text-white">
            <div className="flex items-center gap-4 pl-2">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            'text-xs font-medium transition-colors',
                            pathname === item.href
                                ? 'text-white border-b-2 border-white pb-0.5'
                                : 'text-white/60 hover:text-white/90'
                        )}
                    >
                        {item.label}
                    </Link>
                ))}
            </div>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-white/80 hover:bg-transparent hover:text-white" asChild>
              <Link href="/notifications">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Link>
            </Button>
        </header>
    );
}

export default function ZippersPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { toast } = useToast();
  const [current, setCurrent] = React.useState(0)
  const [zippclips, setZippclips] = useState<Zippclip[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<Error | null>(null);

  // Scroll snap will handle navigation

  const fetchFollowingZippclips = async () => {
    if (!supabase) {
      setFetchError(new Error('Database connection not available'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setFetchError(null);
      
      // First get the current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log('No user session found');
        setLoading(false);
        return;
      }

      console.log('Fetching zippclips for user:', session.user.id);

      // Get users that the current user follows
      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', session.user.id);

      if (followingError) {
        console.error('Error fetching follows:', followingError);
        throw followingError;
      }

      console.log('Following data:', followingData);

      // If user follows no one, show sample content for demo
      if (!followingData || followingData.length === 0) {
        console.log('User follows no one, showing sample content');
        setZippclips(sampleZippclips.slice(0, 5)); // Show first 5 sample clips
        setLoading(false);
        return;
      }

      const followingIds = followingData.map(f => f.following_id);
      console.log('Following IDs:', followingIds);

      // Get zippclips from followed users
      const { data, error } = await supabase
        .from('zippclips')
        .select(`
          id,
          description,
          media_url,
          media_type,
          likes,
          comments,
          saves,
          shares,
          song,
          song_avatar_url,
          profiles:user_id (
            username,
            full_name,
            avatar_url
          )
        `)
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching zippclips:', error);
        throw error;
      }

      console.log('Fetched zippclips:', data);

      // If no zippclips from followed users, show sample content
      if (!data || data.length === 0) {
        console.log('No zippclips from followed users, showing sample content');
        setZippclips(sampleZippclips.slice(0, 5));
        setLoading(false);
        return;
      }

      const formattedClips: Zippclip[] = (data || []).map((clip: any) => ({
        id: clip.id,
        profiles: clip.profiles ? {
          username: clip.profiles.username || 'unknown',
          full_name: clip.profiles.full_name || 'Unknown User',
          avatar_url: clip.profiles.avatar_url || null
        } : null,
        description: clip.description || '',
        song: clip.song || 'Unknown Song',
        likes: Number(clip.likes) || 0,
        comments: Number(clip.comments) || 0,
        saves: Number(clip.saves) || 0,
        shares: Number(clip.shares) || 0,
        media_url: clip.media_url,
        media_type: clip.media_type || 'image',
        song_avatar_url: clip.song_avatar_url || null,
      }));

      setZippclips(formattedClips);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setFetchError(error);
      console.error('Error fetching following zippclips:', error);
    } finally {
      setLoading(false);
    }
  };

  // Track current video index for scroll snap
  React.useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.querySelector('.snap-y');
      if (scrollContainer) {
        const scrollTop = scrollContainer.scrollTop;
        const itemHeight = window.innerHeight;
        const currentIndex = Math.round(scrollTop / itemHeight);
        setCurrent(currentIndex);
      }
    };

    const scrollContainer = document.querySelector('.snap-y');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [zippclips.length]);

  // Fetch zippclips on mount
  useEffect(() => {
    console.log('Zippers page mounted, starting data fetch');
    
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log('Loading timeout reached, showing sample content');
        setZippclips(sampleZippclips.slice(0, 5));
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    // Try to fetch data, but fallback to sample content
    fetchFollowingZippclips().catch((error) => {
      console.error('Error in fetchFollowingZippclips:', error);
      setZippclips(sampleZippclips.slice(0, 5));
      setLoading(false);
    });

    return () => clearTimeout(timeoutId);
  }, []); // Remove dependencies to prevent infinite re-renders

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      if (!supabase) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
        
        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        setUserProfile(profile);
      }
    };

    getCurrentUser();
  }, []);

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <LoadingOverlay />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-lg mb-4">Error loading content</p>
          <p className="text-sm text-gray-400 mb-4">{fetchError.message}</p>
          <Button 
            onClick={fetchFollowingZippclips}
            className="bg-teal-600 hover:bg-teal-700"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (zippclips.length === 0) {
    return (
      <div className="h-screen bg-black text-white">
        <ZippersHeader />
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="mb-6">
              <LogoLarge className="w-16 h-16 mx-auto mb-4" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Welcome to Zippers!</h2>
            <p className="text-gray-400 mb-6 max-w-sm">
              This is where you'll see content from users you follow. Start by following some creators on the "For You" tab!
            </p>
            <Button 
              asChild
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Link href="/home">
                Discover Content
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-black text-white overflow-hidden">
      <ZippersHeader />
      
      <ErrorBoundary>
        <div className="h-full w-full overflow-y-auto snap-y snap-mandatory">
          {zippclips.map((clip, index) => (
            <div key={clip.id} className="h-full w-full snap-start">
              <MediaPlayer 
                clip={clip} 
                isActive={index === current}
              />
            </div>
          ))}
        </div>
      </ErrorBoundary>
    </div>
  );
}
