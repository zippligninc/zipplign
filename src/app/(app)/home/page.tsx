
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Bell, Play, Pause, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LogoXLarge } from '@/components/common/logo';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useTouchGestures, useHapticFeedback, useDeviceCapabilities } from '@/hooks/use-touch-gestures';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { VideoUIOverlay } from '@/components/home/video-ui-overlay';
import { LazyMedia } from '@/components/optimized/lazy-media';
import { ZippclipGridSkeleton, LoadingOverlay } from '@/components/ui/loading-states';
import { ErrorBoundary } from '@/components/error/error-boundary';
import { PerformanceOptimizer } from '@/lib/performance';
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
        setIsPlaying(false);
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
      // Haptic feedback on mobile
      if (isMobile) {
        triggerHaptic('light');
      }
    }
  };

  const handleTouchStart = () => {
    setShowControls(true);
    setTimeout(() => setShowControls(false), 3000);
  };

  const toggleControls = () => {
    if (clip.media_type === 'video') {
      setShowControls(!showControls);
      setTimeout(() => setShowControls(false), 3000);
    }
  };

  // Touch gestures for video controls
  const touchGestures = useTouchGestures({
    onTap: toggleControls,
    onDoubleTap: togglePlay,
    onSwipeUp: () => {
      if (clip.media_type === 'video' && videoRef.current) {
        // Seek forward
        videoRef.current.currentTime = Math.min(
          videoRef.current.currentTime + 10,
          videoRef.current.duration
        );
        if (isMobile) triggerHaptic('medium');
      }
    },
    onSwipeDown: () => {
      if (clip.media_type === 'video' && videoRef.current) {
        // Seek backward
        videoRef.current.currentTime = Math.max(
          videoRef.current.currentTime - 10,
          0
        );
        if (isMobile) triggerHaptic('medium');
      }
    },
    threshold: 30
  });

  return (
    <div 
      className="relative h-full w-full bg-black flex items-center justify-center"
      onTouchStart={handleTouchStart}
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


function HomeHeader() {
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

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { toast } = useToast();
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)
  const { triggerHaptic } = useHapticFeedback();
  const { isMobile } = useDeviceCapabilities();

  // Simplified fetch for zippclips - removing complex optimization that may cause issues
  const [zippclips, setZippclips] = useState<Zippclip[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<Error | null>(null);

  const fetchZippclips = React.useCallback(async () => {
    if (!supabase) {
      setFetchError(new Error('Database connection not available'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setFetchError(null);
      
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
        .order('created_at', { ascending: false })
        .limit(20); // Simple limit instead of pagination

      if (error) throw error;

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

      // Use sample data if no clips found in database
      if (formattedClips.length === 0) {
        console.log('No clips found in database, using sample data');
        setZippclips(sampleZippclips);
      } else {
        setZippclips(formattedClips);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setFetchError(error);
      console.error('Error fetching zippclips:', error);
      // Use sample data as fallback
      console.log('Using sample data as fallback');
      setZippclips(sampleZippclips);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch zippclips on mount
  React.useEffect(() => {
    fetchZippclips();
  }, [fetchZippclips]);

  React.useEffect(() => {
    if (!api) {
      return
    }
 
    setCurrent(api.selectedScrollSnap())
 
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap())
      // Haptic feedback when scrolling on mobile
      if (isMobile) {
        triggerHaptic('light');
      }
    })
  }, [api, isMobile, triggerHaptic])


  // Fetch user session and profile
  useEffect(() => {
    const fetchUserSession = async () => {
      if (!supabase) return;
      
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user || null);
      
      // Fetch profile if user is logged in
      if (session?.user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setUserProfile(profile);
        }
      }
      
      // Listen for auth changes
      if (!supabase) return;
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event);
          setCurrentUser(session?.user || null);
          
          try {
            if (session?.user?.id && supabase) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              setUserProfile(profile || null);
            } else {
              setUserProfile(null);
            }
          } catch (error) {
            console.error('Error fetching profile:', error);
            setUserProfile(null);
          }
        }
      );
      
      return () => {
        subscription?.unsubscribe();
      };
    };
    
    fetchUserSession();
  }, []);

  // Handle fetch errors
  React.useEffect(() => {
    if (fetchError) {
      console.error('Error fetching zippclips:', fetchError);
        toast({
          title: 'Error loading content',
        description: fetchError.message || 'Failed to load content. Please check your internet connection and try again.',
          variant: 'destructive',
        });
      }
  }, [fetchError, toast]);


  return (
    <div className="relative h-full w-full bg-black overflow-hidden">
        <HomeHeader />
        {loading ? (
           <div className="flex h-full w-full flex-col items-center justify-center bg-black text-white">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-white/70">Loading amazing content...</p>
           </div>
        ) : zippclips && zippclips.length > 0 ? (
          <Carousel
            setApi={setApi}
            className="h-full w-full"
            opts={{
              align: "start",
              loop: false,
            }}
          >
            <CarouselContent className="h-full">
              {zippclips.map((clip, index) => (
                <CarouselItem key={clip.id} className="h-full">
                  <MediaPlayer clip={clip} isActive={index === current} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-black text-white">
              <LogoXLarge className="h-20 w-20 mb-4" />
              <h2 className="text-xl font-bold mb-2">No Zippclips Yet</h2>
              <p className="text-muted-foreground mb-6 text-center text-sm max-w-md">
                Be the first to share your amazing moments! Create and post your first video to see content here.
              </p>
              <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link href="/create">Create a Zippclip</Link>
              </Button>
          </div>
        )}
    </div>
  );
}
