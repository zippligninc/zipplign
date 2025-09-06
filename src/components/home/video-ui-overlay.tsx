
'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  spotify_track_id?: string;
  spotify_preview_url?: string;
}

export function VideoUIOverlay({
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
  spotify_track_id,
  spotify_preview_url,
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
  
  // Audio state
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(true);
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

  // Track view when component mounts (only once per session)
  useEffect(() => {
    const trackView = async () => {
      if (id && !hasTrackedView) {
        try {
          const result = await incrementZippclipViews(id);
          if (result.success && result.data) {
            setViewCount(result.data.views);
            setHasTrackedView(true);
          }
        } catch (error: any) {
          // Only log meaningful error messages
          if (error?.message) {
            console.error('Error tracking view:', error.message);
          }
        }
      }
    };

    // Track view after a short delay to ensure the video is actually being viewed
    const timer = setTimeout(trackView, 2000);
    return () => clearTimeout(timer);
  }, [id, hasTrackedView]);

  const handleLike = async () => {
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
  };

  const handleComment = async () => {
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
  };

  const handleCommentAdded = async () => {
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
  };

  // Audio control functions
  const toggleAudioPlay = () => {
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
  };

  const toggleAudioMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isAudioMuted;
      setIsAudioMuted(!isAudioMuted);
    }
  };

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
    } else if (result.data) {
      // Update with actual count from server
      setSaveCount(result.data.saves);
    }
    
    setIsSaving(false);
  };



  return (
    <>
      {/* Picture-in-Picture Window - Top Left */}
      <div className="fixed top-16 left-4 z-50">
        <div className="w-24 h-32 rounded-xl overflow-hidden border-2 border-teal-400/50 shadow-2xl">
          {media_type === 'video' ? (
            <video
              src={media_url}
              className="w-full h-full object-cover"
              muted
              loop
              autoPlay
              playsInline
            />
          ) : (
            <Image
              src={media_url}
              alt="Preview"
              width={96}
              height={128}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        {/* Follower Count Display */}
        <div className="mt-3 text-center">
          <div>
            <p className="text-white text-xs font-bold">
              {formatViewCount(followerCount)} Zippers
            </p>
          </div>
        </div>
      </div>

      {/* Main Overlay - Bottom */}
      <div className="absolute bottom-[1rem] left-0 right-0 flex items-end justify-between p-4 pb-0 text-white z-10 sm:bottom-4 md:bottom-2">
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
          {spotify_preview_url && (
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
      {spotify_preview_url && (
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
          <source src={spotify_preview_url} type="audio/mpeg" />
        </audio>
      )}
    </>
  );
}


