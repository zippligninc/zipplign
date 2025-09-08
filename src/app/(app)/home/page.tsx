
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
// Using scroll snap instead of carousel for better video control
import { VideoUIOverlay } from '@/components/home/video-ui-overlay';
import { LazyMedia } from '@/components/optimized/lazy-media';
import { ZippclipGridSkeleton, LoadingOverlay } from '@/components/ui/loading-states';
import { ErrorBoundary } from '@/components/error/error-boundary';
import { PerformanceOptimizer } from '@/lib/performance';
import { sampleZippclips } from '@/lib/sample-content';
import { withCache, queryCache } from '@/lib/query-cache';
import { useOptimizedData } from '@/hooks/use-optimized-data';
import { errorHandler } from '@/lib/error-handler';
import { VideoChain } from '@/components/home/video-chain';
import { getZipperCount } from '@/lib/zipper-actions';

function shuffleArray<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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
  song_avatar_url: string | null;
  music_preview_url?: string | null;
  parent_zippclip_id?: string | null;
};

const navItems = [
    { href: '/events', label: 'Events' },
    { href: '/zippers', label: 'Zippers' },
    { href: '/store', label: 'Store' },
    { href: '/home', label: 'For You' },
    { href: '/live', label: 'Live' },
];

const MediaPlayer = ({ clip, isActive, onEnded }: { clip: Zippclip; isActive: boolean; onEnded?: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { triggerHaptic } = useHapticFeedback();
  const { isMobile } = useDeviceCapabilities();
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showSoundPrompt, setShowSoundPrompt] = useState(false);
  
  // Handle case where profiles might be null
  const user = clip.profiles || {
    username: 'unknown',
    full_name: 'Unknown User',
    avatar_url: ''
  };

  useEffect(() => {
    const vid = videoRef.current;
    const aud = audioRef.current;

    if (!isActive) {
      // Stop everything when not active
      if (vid) {
        try {
          vid.pause();
          vid.muted = true;
          vid.currentTime = 0;
        } catch {}
      }
      if (aud) {
        try {
          aud.pause();
          aud.muted = true;
          aud.currentTime = 0;
        } catch {}
      }
      setIsPlaying(false);
      return;
    }

    // Active
    if (clip.music_preview_url && aud) {
      // Prefer music preview as background audio; keep video muted
      if (vid) {
        vid.muted = true;
        vid.play().catch(() => {});
      }
      aud.muted = !soundEnabled;
      aud.autoplay = true;
      aud.play().catch(() => {
        // Show prompt if autoplay blocked
        setShowSoundPrompt(true);
      });
      setIsPlaying(true);
      return;
    }

    // No attached music: use original video audio if present
    if (clip.media_type === 'video' && vid) {
      vid.muted = !soundEnabled;
      vid.play().catch(() => {
        setIsPlaying(false);
        setShowSoundPrompt(true);
      });
      setIsPlaying(true);
    }
  }, [isActive, clip.media_type, clip.music_preview_url, soundEnabled]);

  // Extra safety: pause and mute on unmount to avoid lingering audio
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.muted = true;
        } catch {}
      }
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.muted = true;
        } catch {}
      }
    };
  }, []);

  // Initialize sound preference from storage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('sound_enabled');
      if (stored === '1') {
        setSoundEnabled(true);
      } else {
        setSoundEnabled(false);
        setShowSoundPrompt(true);
      }
    } catch {
      setSoundEnabled(false);
      setShowSoundPrompt(true);
    }
  }, []);

  const enableSound = () => {
    try { sessionStorage.setItem('sound_enabled', '1'); } catch {}
    setSoundEnabled(true);
    setShowSoundPrompt(false);
    // Immediately unmute and play the active media
    const vid = videoRef.current;
    const aud = audioRef.current;
    if (clip.music_preview_url && aud) {
      aud.muted = false;
      aud.play().catch(() => {});
    } else if (clip.media_type === 'video' && vid) {
      vid.muted = false;
      vid.play().catch(() => {});
    }
  };

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
    // Mute control removed by request
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
            muted={!soundEnabled}
            playsInline
            onError={handleVideoError}
            onEnded={() => {
              if (onEnded) onEnded();
            }}
          >
            <source src={clip.media_url} type="video/mp4" />
          </video>
          
          {/* Mute button removed */}
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

      {/* Enable sound prompt */}
      {isActive && !soundEnabled && showSoundPrompt && (
        <div className="absolute top-12 right-3 z-20">
          <Button
            variant="ghost"
            size="sm"
            className="bg-black/50 text-white hover:bg-black/70 rounded-full px-3 h-8"
            onClick={enableSound}
          >
            Tap to enable sound
          </Button>
        </div>
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
        music_preview_url={clip.music_preview_url}
        parentId={(clip as any).parent_zippclip_id ?? null}
        isActive={isActive}
      />

      {/* Audio element for posts with attached music (image or video) */}
      {clip.music_preview_url && (
        <audio
          ref={audioRef}
          loop
          muted={!soundEnabled}
          autoPlay
          onError={() => console.warn('Audio failed to load')}
        >
          <source src={clip.music_preview_url} type="audio/mpeg" />
        </audio>
      )}
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
  // Using scroll snap instead of carousel API
  const [current, setCurrent] = React.useState(0)
  const { triggerHaptic } = useHapticFeedback();
  const { isMobile } = useDeviceCapabilities();
  
  // Video chain state
  const [showVideoChain, setShowVideoChain] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);

  // Optimized data fetching for zippclips
  const { data: zippclipsData, loading, error: fetchError, refetch: refetchZippclips } = useOptimizedData(
    'zippclips_home',
    async () => {
      if (!supabase) {
        throw new Error('Database connection not available');
      }

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
          music_preview_url,
          parent_zippclip_id,
          profiles:user_id (
            username,
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

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
        music_preview_url: clip.music_preview_url || null,
        parent_zippclip_id: clip.parent_zippclip_id || null,
      }));

      return formattedClips.length > 0 ? formattedClips : shuffleArray(sampleZippclips);
    },
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      retry: 3,
      onError: (error) => {
        console.error('Error fetching zippclips:', error);
      }
    }
  );

  const zippclips = zippclipsData || [];
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const PULL_THRESHOLD = 70;

  // Pull-to-refresh handler
  const handleRefresh = React.useCallback(async () => {
    await refetchZippclips();
  }, [refetchZippclips]);

  // Pull-to-refresh (swipe down at top)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let startY = 0;
    let pulling = false;

    const onTouchStart = (e: TouchEvent) => {
      if (el.scrollTop <= 0) {
        startY = e.touches[0].clientY;
        pulling = true;
        setPullDistance(0);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!pulling) return;
      const dy = e.touches[0].clientY - startY;
      if (dy > 0) {
        e.preventDefault();
        setPullDistance(Math.min(dy, 120));
      } else {
        setPullDistance(0);
      }
    };
    const onTouchEnd = async () => {
      if (pullDistance >= PULL_THRESHOLD) {
        await handleRefresh();
      }
      setPullDistance(0);
      pulling = false;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart as any);
      el.removeEventListener('touchmove', onTouchMove as any);
      el.removeEventListener('touchend', onTouchEnd as any);
    };
  }, [handleRefresh, pullDistance]);

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
      errorHandler.handleError(fetchError, 'Content Loading');
    }
  }, [fetchError]);

  // Show video chain when current video has a parent and zippers
  React.useEffect(() => {
    const checkAndShowChain = async () => {
      if (zippclips.length > 0 && current < zippclips.length) {
        const currentClip = zippclips[current];
        if (currentClip && currentClip.id) {
          setCurrentVideoId(currentClip.id);
          
          // Only show chain if this video has a parent (is part of a chain)
          if (currentClip.parent_zippclip_id) {
            // Check if there are any zippers for this video
            try {
              const zipperResult = await getZipperCount(currentClip.id);
              if (zipperResult.success && zipperResult.data && zipperResult.data.zippers > 0) {
                setShowVideoChain(true);
              } else {
                setShowVideoChain(false);
              }
            } catch (error) {
              console.error('Error checking zipper count:', error);
              setShowVideoChain(false);
            }
          } else {
            setShowVideoChain(false);
          }
        }
      }
    };

    checkAndShowChain();
  }, [current, zippclips]);


  return (
    <div className="relative h-full w-full bg-black overflow-hidden">
        <HomeHeader />
        {loading ? (
           <div className="flex h-full w-full flex-col items-center justify-center bg-black text-white">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-white/70">Loading amazing content...</p>
           </div>
        ) : zippclips && zippclips.length > 0 ? (
          <div ref={scrollRef} className="h-full w-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory snap-always scroll-smooth touch-pan-y">
            {pullDistance > 0 && (
              <div className="sticky top-0 z-20 flex items-center justify-center text-white/80 text-xs h-10"
                   style={{ transform: `translateY(${pullDistance * 0.3}px)` }}>
                {pullDistance >= PULL_THRESHOLD ? 'Release to refresh' : 'Pull to refresh'}
              </div>
            )}
            {zippclips.map((clip, index) => (
              <div key={clip.id} className="h-full w-full snap-start">
                <MediaPlayer
                  clip={clip}
                  isActive={index === current}
                  onEnded={() => {
                    if (!scrollRef.current) return;
                    const next = Math.min(index + 1, zippclips.length - 1);
                    scrollRef.current.scrollTo({
                      top: next * window.innerHeight,
                      behavior: 'smooth',
                    });
                  }}
                />
              </div>
            ))}
          </div>
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
        
        {/* Video Chain Component */}
        {showVideoChain && currentVideoId && (
          <VideoChain
            currentVideoId={currentVideoId}
            onClose={() => setShowVideoChain(false)}
          />
        )}
    </div>
  );
}
