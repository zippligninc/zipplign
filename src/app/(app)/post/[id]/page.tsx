'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, MessageCircle, Send, Bookmark, Share2, Play, Pause, Volume2, VolumeX, Music } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { toggleLike, checkIsLiked, getLikeCount, getCommentCount } from '@/lib/social-actions';
import { toggleSave, checkIsSaved, getSaveCount } from '@/lib/save-actions';
import { incrementZippclipViews, getZippclipViews, formatViewCount } from '@/lib/view-tracking';
import { CommentsModal } from '@/components/home/comments-modal';
import Link from 'next/link';

interface Zippclip {
  id: string;
  description: string;
  media_url: string;
  media_type: 'image' | 'video';
  song: string;
  song_avatar_url: string | null;
  spotify_track_id?: string;
  spotify_preview_url?: string;
  created_at: string;
  profiles: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

function PostContent() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const postId = params?.id as string;
  
  const [zippclip, setZippclip] = useState<Zippclip | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  
  // Video state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  
  // Audio state
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [audioError, setAudioError] = useState(false);

  useEffect(() => {
    if (postId) {
      fetchZippclip();
    }
  }, [postId]);

  useEffect(() => {
    if (zippclip) {
      checkStatus();
      trackView();
    }
  }, [zippclip]);

  const fetchZippclip = async () => {
    try {
      const { data, error } = await supabase
        .from('zippclips')
        .select(`
          *,
          profiles (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;
      setZippclip(data);
    } catch (error) {
      console.error('Error fetching zippclip:', error);
      toast({
        title: 'Error',
        description: 'Failed to load post',
        variant: 'destructive',
      });
      router.push('/home');
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!zippclip) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check like status
        const likeResult = await checkIsLiked(zippclip.id);
        if (likeResult.success) {
          setIsLiked(likeResult.data.liked);
        }
        
        // Check save status
        const saveResult = await checkIsSaved(zippclip.id);
        if (saveResult.success) {
          setIsSaved(saveResult.data.saved);
        }
      }
      
      // Get counts
      const [likeCountResult, commentCountResult, saveCountResult, viewCountResult] = await Promise.all([
        getLikeCount(zippclip.id),
        getCommentCount(zippclip.id),
        getSaveCount(zippclip.id),
        getZippclipViews(zippclip.id)
      ]);
      
      setLikeCount(likeCountResult);
      setCommentCount(commentCountResult);
      setSaveCount(saveCountResult);
      setViewCount(viewCountResult);
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const trackView = async () => {
    if (!zippclip) return;
    
    try {
      await incrementZippclipViews(zippclip.id);
      const newViewCount = await getZippclipViews(zippclip.id);
      setViewCount(newViewCount);
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const handleLike = async () => {
    if (!zippclip || isLiking) return;
    
    setIsLiking(true);
    try {
      const result = await toggleLike(zippclip.id);
      if (result.success) {
        setIsLiked(result.data.liked);
        setLikeCount(result.data.likeCount);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleSave = async () => {
    if (!zippclip || isSaving) return;
    
    setIsSaving(true);
    try {
      const result = await toggleSave(zippclip.id);
      if (result.success) {
        setIsSaved(result.data.saved);
        setSaveCount(result.data.saveCount);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/post/${zippclip?.id}`;
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link copied!',
        description: 'Post link copied to clipboard',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
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
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleAudioPlay = () => {
    if (audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.pause();
        setIsAudioPlaying(false);
      } else {
        audioRef.current.play();
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
  };

  const handleAudioLoad = () => {
    setAudioError(false);
  };

  if (loading) {
    return (
      <div className="h-full bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading post...</p>
        </div>
      </div>
    );
  }

  if (!zippclip) {
    return (
      <div className="h-full bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p>Post not found</p>
          <Button onClick={() => router.push('/home')} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const user = zippclip.profiles;

  return (
    <div className="h-full bg-black text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Post</h1>
        <div className="w-9" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Media Section */}
        <div className="flex-1 relative bg-black">
          {zippclip.media_type === 'video' ? (
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                loop
                muted={isMuted}
                playsInline
                onClick={togglePlay}
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
              >
                <source src={zippclip.media_url} type="video/mp4" />
              </video>
              
              {/* Video Controls */}
              {showControls && (
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

              {/* Mute Button */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/80 hover:bg-black/90 z-50 border border-white/20"
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
            <div className="relative w-full h-full">
              <Image
                src={zippclip.media_url}
                alt={zippclip.description}
                fill
                className="object-contain"
              />
            </div>
          )}

          {/* Music Controls */}
          {(zippclip.song || zippclip.spotify_preview_url) && (
            <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-sm p-3 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 relative flex-shrink-0">
                  {zippclip.song_avatar_url ? (
                    <Image
                      src={zippclip.song_avatar_url}
                      alt="Song"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-teal-500 to-purple-600 flex items-center justify-center">
                      <Music className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {zippclip.song || 'Original Sound'}
                  </p>
                </div>
                
                {zippclip.spotify_preview_url && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={toggleAudioPlay}
                    >
                      {isAudioPlaying ? (
                        <Pause className="h-4 w-4 text-white" />
                      ) : (
                        <Play className="h-4 w-4 text-white" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={toggleAudioMute}
                    >
                      {isAudioMuted ? (
                        <VolumeX className="h-4 w-4 text-white" />
                      ) : (
                        <Volume2 className="h-4 w-4 text-white" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Audio Element */}
              {zippclip.spotify_preview_url && (
                <audio
                  ref={audioRef}
                  src={zippclip.spotify_preview_url}
                  onError={handleAudioError}
                  onLoadedData={handleAudioLoad}
                  onEnded={() => setIsAudioPlaying(false)}
                />
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-black border-l border-gray-800 flex flex-col">
          {/* User Info */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <Link href={`/user/${user.username}`}>
                <Avatar className="h-12 w-12 cursor-pointer">
                  <AvatarImage src={user.avatar_url || ''} alt={user.username} />
                  <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/user/${user.username}`}>
                  <p className="font-semibold text-sm cursor-pointer hover:underline">
                    {user.username}
                  </p>
                </Link>
                <p className="text-xs text-gray-400 truncate">
                  {user.full_name}
                </p>
              </div>
            </div>
          </div>

          {/* Caption */}
          <div className="p-4 border-b border-gray-800">
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Link href={`/user/${user.username}`}>
                  <p className="font-semibold text-sm cursor-pointer hover:underline">
                    {user.username}
                  </p>
                </Link>
                <p className="text-sm text-white flex-1">
                  {isCaptionExpanded ? zippclip.description : 
                   zippclip.description.length > 100 ? 
                   `${zippclip.description.substring(0, 100)}...` : 
                   zippclip.description}
                </p>
              </div>
              {zippclip.description.length > 100 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-gray-400 hover:text-white"
                  onClick={() => setIsCaptionExpanded(!isCaptionExpanded)}
                >
                  {isCaptionExpanded ? 'See Less' : 'See More'}
                </Button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0"
                  onClick={handleLike}
                  disabled={isLiking}
                >
                  <Heart className={`h-6 w-6 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                </Button>
                <span className="text-sm text-white">{formatViewCount(likeCount)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0"
                  onClick={() => setShowComments(true)}
                >
                  <MessageCircle className="h-6 w-6 text-white" />
                </Button>
                <span className="text-sm text-white">{formatViewCount(commentCount)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <Bookmark className={`h-6 w-6 ${isSaved ? 'fill-white text-white' : 'text-white'}`} />
                </Button>
                <span className="text-sm text-white">{formatViewCount(saveCount)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0"
                  onClick={handleShare}
                >
                  <Share2 className="h-6 w-6 text-white" />
                </Button>
                <span className="text-sm text-white">{formatViewCount(zippclip.shares || 0)}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="p-4 border-t border-gray-800 mt-auto">
            <div className="space-y-2 text-sm text-gray-400">
              <p>Views: {formatViewCount(viewCount)}</p>
              <p>Posted: {new Date(zippclip.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Modal */}
      {showComments && (
        <CommentsModal
          zippclipId={zippclip.id}
          isOpen={showComments}
          onClose={() => setShowComments(false)}
        />
      )}
    </div>
  );
}

export default function PostPage() {
  return (
    <Suspense fallback={
      <div className="h-full bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading post...</p>
        </div>
      </div>
    }>
      <PostContent />
    </Suspense>
  );
}
