
'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Send, Music, Bookmark, MoreHorizontal, Flag, UserX, Zap, Bell, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { toggleLike, checkIsLiked, getLikeCount, getCommentCount } from '@/lib/social-actions';
import { blockUser, checkIfBlocked } from '@/lib/moderation';
import { incrementZippclipViews, getZippclipViews, formatViewCount } from '@/lib/view-tracking';
import { toggleSave, checkIsSaved, getSaveCount } from '@/lib/save-actions';
import { getZipperCount, getZippers, getOriginalVideo } from '@/lib/zipper-actions';
import { CommentsModal } from './comments-modal';
import { ReportModal } from '../moderation/report-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define the VideoUIOverlayProps interface directly
interface VideoUIOverlayProps {
  id: string;
  user: {
    id?: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
  description: string;
  song: string;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  media_url: string;
  media_type: 'image' | 'video';
  song_avatar_url: string | null;
  music_track_id?: string;
  music_preview_url?: string | null;
  parentId?: string | null;
  isActive?: boolean;
}

export const VideoUIOverlay = React.memo(function VideoUIOverlay({
  id,
  user,
  description,
  song,
  likes,
  comments,
  saves,
  shares,
  media_url,
  media_type,
  song_avatar_url,
  music_track_id,
  music_preview_url,
  parentId,
  isActive,
}: VideoUIOverlayProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(parseInt(likes.toString()) || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(parseInt(comments.toString()) || 0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isUserBlocked, setIsUserBlocked] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveCount, setSaveCount] = useState(parseInt(saves.toString()) || 0);
  const [isSaving, setIsSaving] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [zipperCount, setZipperCount] = useState(0);
  const [zipperPreview, setZipperPreview] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [originalPreview, setOriginalPreview] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [originalId, setOriginalId] = useState<string | null>(null);
  
  // Audio state
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [audioError, setAudioError] = useState(false);

  // Check if user has liked this post, if user is blocked, fetch view count and follower count
  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Only check like status if we have a valid user session
        if (id && supabase) {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser) {
            const likeResult = await checkIsLiked(id);
            if (likeResult.success) {
              setIsLiked(likeResult.data.liked);
            }
          } else {
            // No user - set not liked
            setIsLiked(false);
          }
        } else {
          // No supabase or id - set not liked
          setIsLiked(false);
        }
        
        if (user?.id) {
          try {
            const blockResult = await checkIfBlocked(user.id);
            if (blockResult.success && blockResult.data) {
              setIsUserBlocked(blockResult.data.blocked);
            } else {
              setIsUserBlocked(false);
            }
          } catch (error) {
            // Silently handle block check errors
            setIsUserBlocked(false);
          }
        } else {
          setIsUserBlocked(false);
        }

        // Fetch current view count
        if (id) {
          try {
            const viewResult = await getZippclipViews(id);
            if (viewResult.success && viewResult.data) {
              setViewCount(viewResult.data.views);
            } else {
              // If there's an error, set view count to 0
              setViewCount(0);
            }
          } catch (error) {
            // Silently handle view count errors
            setViewCount(0);
          }
        }

        // Fetch follower count for the user
        if (user?.id && supabase) {
          try {
            const { data, error } = await supabase
              .from('follows')
              .select('id', { count: 'exact' })
              .eq('following_id', user.id);
            
            if (!error && data !== null) {
              setFollowerCount(data.length || 0);
            }
          } catch (error) {
            console.error('Error fetching follower count:', error);
          }
        }

        // Fetch real social action counts
        if (id) {
          try {
            // Fetch like count
            const likeCountResult = await getLikeCount(id);
            if (likeCountResult.success && likeCountResult.data) {
              setLikeCount(likeCountResult.data.count);
            }

            // Fetch comment count
            const commentCountResult = await getCommentCount(id);
            if (commentCountResult.success && commentCountResult.data) {
              setCommentCount(commentCountResult.data.count);
            }

            // Fetch save count
            const saveCountResult = await getSaveCount(id);
            if (saveCountResult.success && saveCountResult.data) {
              setSaveCount(saveCountResult.data.saves);
            }
          } catch (error) {
            console.error('Error fetching social action counts:', error);
          }
        }

        // Check if user has saved this zippclip
        if (id) {
          const saveResult = await checkIsSaved(id);
          if (saveResult.success && saveResult.data) {
            setIsSaved(saveResult.data.saved);
          }
        }
      } catch (error) {
        // Silently handle errors - set default states
        setIsLiked(false);
        setIsUserBlocked(false);
      }
    };
    
    checkStatus();
  }, [id, user?.id]);

  // Track view when component mounts (only once per device for this clip)
  useEffect(() => {
    const trackView = async () => {
      if (id && !hasTrackedView) {
        try {
          // Device-level guard to avoid multiple increments from the same device
          const storageKey = `viewed:${id}`;
          if (typeof window !== 'undefined' && localStorage.getItem(storageKey) === '1') {
            setHasTrackedView(true);
            return;
          }

          const result = await incrementZippclipViews(id);
          if (result.success && result.data) {
            setViewCount(result.data.views);
            setHasTrackedView(true);
            if (typeof window !== 'undefined') {
              localStorage.setItem(storageKey, '1');
            }
          }
        } catch (error: any) {
          // Only log meaningful error messages
          if (error?.message) {
            console.error('Error tracking view:', error.message);
          }
        }
      }
    };

    // Track view after 3 seconds to ensure real watch time
    const timer = setTimeout(trackView, 3000);
    return () => clearTimeout(timer);
  }, [id, hasTrackedView]);

  // Fetch zipper count and preview of latest zipper
  useEffect(() => {
    if (!isActive) return;
    const fetchZipperInfo = async () => {
      const parentForQuery = parentId || id;
      if (parentForQuery) {
        try {
          const result = await getZipperCount(parentForQuery);
          if (result.success && result.data) {
            setZipperCount(result.data.zippers);
          }
          // Fetch original (root) preview for the current response
          const orig = await getOriginalVideo(parentForQuery);
          if (orig.success && orig.data) {
            setOriginalPreview({ url: orig.data.media_url, type: orig.data.media_type });
            setOriginalId(orig.data.id);
          } else {
            setOriginalPreview(null);
            setOriginalId(null);
          }

          // Fetch latest zipper (child) to show at root
          const zippers = await getZippers(parentForQuery, 1);
          if (zippers.success && zippers.data && zippers.data.zippers && zippers.data.zippers.length > 0) {
            const latest = zippers.data.zippers[0];
            setZipperPreview({ url: latest.media_url, type: latest.media_type });
          } else {
            setZipperPreview(null);
          }
        } catch (error: any) {
          if (error?.message) {
            console.error('Error fetching zipper count:', error.message);
          }
        }
      }
    };

    fetchZipperInfo();
  }, [id, parentId, isActive]);

  // Realtime: update zipper info when children are inserted/deleted for this zippclip
  useEffect(() => {
    if (!id || !supabase || !isActive) return;

    const refetch = async () => {
      try {
        const parentForQuery = parentId || id;
        const result = await getZipperCount(parentForQuery);
        if (result.success && result.data) {
          setZipperCount(result.data.zippers);
        }

        const zippers = await getZippers(parentForQuery, 1);
        if (zippers.success && zippers.data && zippers.data.zippers && zippers.data.zippers.length > 0) {
          const latest = zippers.data.zippers[0];
          setZipperPreview({ url: latest.media_url, type: latest.media_type });
        } else {
          setZipperPreview(null);
        }
      } catch {}
    };

    // Type guard for non-null supabase already handled at hook entry
    const client = supabase as NonNullable<typeof supabase>;
    const channel = client
      .channel(`zippers:${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'zippclips', filter: `parent_zippclip_id=eq.${parentId || id}` },
        refetch
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'zippclips', filter: `parent_zippclip_id=eq.${parentId || id}` },
        refetch
      )
      .subscribe();

    return () => {
      try { client.removeChannel(channel); } catch {}
    };
  }, [id, parentId, isActive]);

  const handleLike = useCallback(async () => {
    if (!supabase) {
      toast({
        title: 'Configuration Error',
        description: 'Database connection not available.',
        variant: 'destructive',
      });
      return;
    }

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      toast({
        title: 'Login Required',
        description: 'You need to log in to like posts.',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }

    if (isLiking) return; // Prevent double-clicking

    setIsLiking(true);
    
    // Optimistic update
    const newLikeState = !isLiked;
    setIsLiked(newLikeState);
    setLikeCount(prev => newLikeState ? prev + 1 : Math.max(prev - 1, 0));

    const result = await toggleLike(id);
    
    if (!result.success) {
      // Revert optimistic update on error
      setIsLiked(!newLikeState);
      setLikeCount(prev => newLikeState ? Math.max(prev - 1, 0) : prev + 1);
      
      toast({
        title: 'Error',
        description: result.error || 'Failed to update like status',
        variant: 'destructive',
      });
    } else {
      // Refresh the real like count
      try {
        const likeCountResult = await getLikeCount(id);
        if (likeCountResult.success && likeCountResult.data) {
          setLikeCount(likeCountResult.data.count);
        }
      } catch (error) {
        console.error('Error refreshing like count:', error);
      }
    }
    
    setIsLiking(false);
  }, [supabase, isLiking, isLiked, id, toast, router]);

  const handleComment = useCallback(async () => {
    if (!supabase) {
      toast({
        title: 'Configuration Error',
        description: 'Database connection not available.',
        variant: 'destructive',
      });
      return;
    }

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      toast({
        title: 'Login Required',
        description: 'You need to log in to comment.',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }

    setShowComments(true);
  }, [supabase, toast, router]);

  const handleCommentAdded = useCallback(async () => {
    // Optimistic update
    setCommentCount(prev => prev + 1);
    
    // Refresh the real comment count
    try {
      const commentCountResult = await getCommentCount(id);
      if (commentCountResult.success && commentCountResult.data) {
        setCommentCount(commentCountResult.data.count);
      }
    } catch (error) {
      console.error('Error refreshing comment count:', error);
    }
  }, [id]);

  // Audio control functions
  const toggleAudioPlay = useCallback(() => {
    if (audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.pause();
        setIsAudioPlaying(false);
      } else {
        audioRef.current.play().catch(error => {
          console.warn("Audio autoplay prevented: ", error);
          setIsAudioPlaying(false);
          setAudioError(true);
        });
        setIsAudioPlaying(true);
      }
    }
  }, [isAudioPlaying]);

  const toggleAudioMute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = !isAudioMuted;
      setIsAudioMuted(!isAudioMuted);
    }
  }, [isAudioMuted]);

  const handleAudioError = () => {
    console.error('Audio failed to load');
    setAudioError(true);
    setIsAudioPlaying(false);
  };

  const handleAudioLoad = () => {
    setAudioError(false);
  };

  const handleBlockUser = async () => {
    if (!user?.id) return;

    try {
      const result = await blockUser(user.id);
      if (result.success) {
        setIsUserBlocked(true);
        toast({
          title: 'User Blocked',
          description: `You have blocked @${user.username}. You won't see their content anymore.`,
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to block user',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  };

  const handleReportContent = () => {
    setShowReportModal(true);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out this Zippclip by ${user?.full_name || 'Unknown'}`,
          text: description,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled or share failed
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback to copying URL
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: 'Link Copied',
          description: 'Zippclip link copied to clipboard!',
        });
      } catch (error) {
        toast({
          title: 'Share',
          description: 'Share functionality not available on this device.',
        });
      }
    }
  };

  const handleSave = async () => {
    if (!supabase) {
      toast({
        title: 'Configuration Error',
        description: 'Database connection not available.',
        variant: 'destructive',
      });
      return;
    }

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      toast({
        title: 'Login Required',
        description: 'You need to log in to save posts.',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }

    if (isSaving) return; // Prevent double-clicking

    setIsSaving(true);
    
    // Optimistic update
    const newSaveState = !isSaved;
    setIsSaved(newSaveState);
    setSaveCount(prev => newSaveState ? prev + 1 : Math.max(prev - 1, 0));

    const result = await toggleSave(id);
    
    if (!result.success) {
      // Revert optimistic update on error
      setIsSaved(!newSaveState);
      setSaveCount(prev => newSaveState ? Math.max(prev - 1, 0) : prev + 1);
      
      toast({
        title: 'Error',
        description: result.error || 'Failed to update save status',
        variant: 'destructive',
      });
    } else {
      // Refresh the real save count
      try {
        const saveCountResult = await getSaveCount(id);
        if (saveCountResult.success && saveCountResult.data) {
          setSaveCount(saveCountResult.data.saves);
        }
      } catch (error) {
        console.error('Error refreshing save count:', error);
      }
    }
    
    setIsSaving(false);
  };



  return (
    <>
      {/* PiP: show original clip only when current clip is a response AND this card is active */}
      {isActive && parentId && originalPreview && (
        <div
          className="fixed top-10 left-4 z-50 cursor-pointer"
          onClick={() => {
            const targetId = originalId ?? (parentId || id);
            if (targetId) {
              router.push(`/post/${targetId}`);
            }
          }}
          aria-label="Open original video"
          role="button"
        >
          <div className="w-24 h-32 rounded-xl overflow-hidden border-2 border-teal-400/50 shadow-2xl">
            {(originalPreview.type) === 'video' ? (
              <video
                src={originalPreview.url}
                className="w-full h-full object-cover"
                muted
                loop
                autoPlay
                playsInline
              />
            ) : (
              <Image
                src={originalPreview.url}
                alt="Preview"
                width={96}
                height={128}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          {/* Zipper Count Display */}
          <div className="mt-3 text-center">
            <div>
              <p className="text-white text-xs font-bold">{formatViewCount(zipperCount)} Zipper</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Overlay - Bottom */}
      <div className="absolute bottom-[4.5rem] left-0 right-0 flex items-end justify-between p-4 pb-0 text-white z-10 sm:bottom-[4.5rem] md:bottom-[4.5rem]">
      {/* Left Side - User Info and Content */}
      <div className="flex-1 max-w-[75%] space-y-3">
        <div className="flex items-center gap-3">
          <Link href={`/user/${user.username}`}>
            <Avatar className="h-10 w-10 border-2 border-white/90 shadow-lg">
              <AvatarImage 
                src={user.avatar_url && user.avatar_url.trim() !== '' ? user.avatar_url : undefined} 
                alt={user.full_name} 
              />
              <AvatarFallback className="bg-gradient-to-br from-teal-500 to-green-500 text-white font-bold text-sm">
                {user.full_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <Link href={`/user/${user.username}`}>
                <p className="font-bold text-sm text-white">{user.full_name}</p>
                <p className="text-xs text-white/80">@{user.username}</p>
            </Link>
          </div>
        </div>
        
        <div>
          <Link href={`/post/${id}`}>
            <p className="text-[10px] leading-relaxed font-medium text-white cursor-pointer hover:text-white/80">
              {isCaptionExpanded ? description : description.length > 80 ? description.substring(0, 80) + '...' : description}
              {description.length > 80 && (
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsCaptionExpanded(!isCaptionExpanded);
                  }}
                  className="text-white/70 ml-1 hover:text-white cursor-pointer"
                >
                  {isCaptionExpanded ? ' See Less' : ' See More'}
                </button>
              )}
            </p>
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href={`/post/${id}`}>
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80">
              <Music className="h-4 w-4 text-teal-400" />
              <p className="text-xs font-medium truncate text-white">{song}</p>
            </div>
          </Link>
          {music_preview_url && (
            <div className="flex items-center gap-1 ml-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={toggleAudioPlay}
              >
                {isAudioPlaying ? (
                  <Pause className="h-3 w-3 text-white" />
                ) : (
                  <Play className="h-3 w-3 text-white" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={toggleAudioMute}
              >
                {isAudioMuted ? (
                  <VolumeX className="h-3 w-3 text-white" />
                ) : (
                  <Volume2 className="h-3 w-3 text-white" />
                )}
              </Button>
            </div>
          )}
        </div>
        
        {/* View Count Display */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
          <p className="text-xs text-white/90 font-medium">
            {formatViewCount(viewCount)} views
          </p>
        </div>
      </div>

      {/* Right Side - Social Actions */}
      <div className="flex flex-col items-center space-y-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-auto w-auto flex-col gap-1 p-1 text-white hover:bg-white/10 rounded-full" 
          onClick={handleLike}
          disabled={isLiking}
        >
          <Heart className={`h-7 w-7 ${isLiked ? 'fill-red-500 text-red-500' : 'fill-white'}`} />
          <span className="text-sm font-bold">{likeCount}</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-auto w-auto flex-col gap-1 p-1 text-white hover:bg-white/10 rounded-full" 
          onClick={handleComment}
        >
          <MessageCircle className="h-7 w-7 fill-white" />
          <span className="text-sm font-bold">{commentCount}</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-auto w-auto flex-col gap-1 p-1 text-white hover:bg-white/10 rounded-full" 
          onClick={handleSave}
          disabled={isSaving}
        >
          <Bookmark className={`h-7 w-7 ${isSaved ? 'fill-yellow-500 text-yellow-500' : 'fill-white'}`} />
          <span className="text-sm font-bold">{saveCount}</span>
        </Button>

        {/* Ride My Zipp */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-auto w-auto flex-col gap-1 p-1 text-white hover:bg-white/10 rounded-full"
          onClick={() => {
            sessionStorage.setItem('zipp_reference', JSON.stringify({ id, user: user.username, description, song }));
            window.location.href = '/create';
          }}
        >
          <Zap className="h-7 w-7 fill-white" />
          {zipperCount > 0 && (
            <span className="text-sm font-bold">{formatViewCount(zipperCount)}</span>
          )}
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-auto w-auto flex-col gap-1 p-1 text-white hover:bg-white/10 rounded-full" 
          onClick={handleShare}
        >
          <Send className="h-7 w-7 fill-white" />
          <span className="text-sm font-bold">{shares}</span>
        </Button>


        {/* More Options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-auto w-auto flex-col gap-1 p-1 text-white hover:bg-white/10 rounded-full"
            >
              <MoreHorizontal className="h-7 w-7 fill-white" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleReportContent} className="text-red-600">
              <Flag className="mr-2 h-4 w-4" />
              Report
            </DropdownMenuItem>
            {!isUserBlocked && (
              <DropdownMenuItem onClick={handleBlockUser} className="text-red-600">
                <UserX className="mr-2 h-4 w-4" />
                Block @{user.username}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Song Avatar */}
        <div className="animate-spin-slow">
          {song_avatar_url && song_avatar_url.trim() !== '' ? (
            <Image 
                src={song_avatar_url}
                alt="Song avatar"
              width={24}
              height={24}
              className="rounded-full border-2 border-white"
            />
          ) : (
            <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-700 flex items-center justify-center">
              <Music className="h-3 w-3 text-gray-400" />
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Comments Modal */}
      <CommentsModal
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        zippclipId={id}
        initialCommentCount={commentCount}
        onCommentAdded={handleCommentAdded}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentType="zippclip"
        contentId={id}
        contentDescription={description}
      />

      {/* Audio Element for Music - Only render if we have a valid audio URL */}
      {music_preview_url && (
        <audio
          ref={audioRef}
          loop
          muted={isAudioMuted}
          onError={handleAudioError}
          onLoadedData={handleAudioLoad}
          onEnded={() => setIsAudioPlaying(false)}
          onPause={() => setIsAudioPlaying(false)}
          onPlay={() => setIsAudioPlaying(true)}
        >
          <source src={music_preview_url} type="audio/mpeg" />
        </audio>
      )}
    </>
  );
});


