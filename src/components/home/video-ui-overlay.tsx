
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Send, Music, Bookmark, MoreHorizontal, Flag, UserX, Zap, Bell } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { toggleLike, checkIsLiked } from '@/lib/social-actions';
import { blockUser, checkIfBlocked } from '@/lib/moderation';
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

  // Check if user has liked this post and if user is blocked
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
          const blockResult = await checkIfBlocked(user.id);
          if (blockResult.success && blockResult.data) {
            setIsUserBlocked(blockResult.data.blocked);
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

  const handleCommentAdded = () => {
    setCommentCount(prev => prev + 1);
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

    // TODO: Implement save functionality
    toast({
      title: 'Feature Coming Soon',
      description: 'Save functionality will be available soon.',
    });
  };



  return (
    <>
      {/* Picture-in-Picture Window - Top Left */}
      <div className="fixed top-16 left-4 z-50">
        <div className="w-20 h-28 bg-black/80 rounded-lg overflow-hidden border-2 border-white/30 shadow-lg">
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
              width={80}
              height={112}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </div>

      {/* Main Overlay - Bottom */}
      <div className="absolute bottom-32 left-0 right-0 flex items-end justify-between p-4 pb-4 text-white z-10">
      {/* Left Side - User Info and Content */}
      <div className="flex-1 max-w-[80%] space-y-2">
        <div className="flex items-center gap-2">
          <Link href={`/user/${user.username}`}>
            <Avatar className="h-9 w-9 border-2 border-white">
              <AvatarImage 
                src={user.avatar_url && user.avatar_url.trim() !== '' ? user.avatar_url : undefined} 
                alt={user.full_name} 
              />
              <AvatarFallback className="bg-gray-600 text-white font-bold text-sm">
                {user.full_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <Link href={`/user/${user.username}`}>
                <p className="font-bold text-sm">{user.full_name}</p>
                <p className="text-xs text-white/90">@{user.username}</p>
            </Link>
          </div>
        </div>
        
        <p className="text-sm leading-relaxed max-w-[95%] font-medium">
          {description}
          {description.length > 80 && (
            <span className="text-white/80 ml-1">... See More</span>
          )}
        </p>
        
        <div className="flex items-center gap-2">
          <Music className="h-3 w-3" />
          <p className="text-xs font-medium truncate">{song}</p>
        </div>
      </div>

      {/* Right Side - Social Actions */}
      <div className="flex flex-col items-center space-y-1.5">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-auto w-auto flex-col gap-0.5 p-0 text-white hover:bg-transparent" 
          onClick={handleLike}
          disabled={isLiking}
        >
          <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : 'fill-white'}`} />
          <span className="text-xs font-bold">{likeCount}</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-auto w-auto flex-col gap-0.5 p-0 text-white hover:bg-transparent" 
          onClick={handleComment}
        >
          <MessageCircle className="h-5 w-5 fill-white" />
          <span className="text-xs font-bold">{commentCount}</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-auto w-auto flex-col gap-0.5 p-0 text-white hover:bg-transparent" 
          onClick={handleSave}
        >
          <Bookmark className="h-5 w-5 fill-white" />
          <span className="text-xs font-bold">{saves}</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-auto w-auto flex-col gap-0.5 p-0 text-white hover:bg-transparent" 
          onClick={handleShare}
        >
          <Send className="h-5 w-5 fill-white" />
          <span className="text-xs font-bold">{shares}</span>
        </Button>


        {/* More Options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-auto w-auto flex-col gap-0.5 p-0 text-white hover:bg-transparent"
            >
              <MoreHorizontal className="h-5 w-5 fill-white" />
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
      </div>
    </>
  );
}

