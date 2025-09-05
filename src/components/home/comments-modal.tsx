'use client';

import React, { useState, useEffect } from 'react';
import { X, Send, Heart, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { addComment, getComments } from '@/lib/social-actions';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  zippclipId: string;
  initialCommentCount: number;
  onCommentAdded: () => void;
}

export function CommentsModal({ 
  isOpen, 
  onClose, 
  zippclipId, 
  initialCommentCount,
  onCommentAdded 
}: CommentsModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  // Fetch comments when modal opens
  useEffect(() => {
    if (isOpen && zippclipId) {
      fetchComments();
    }
  }, [isOpen, zippclipId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const result = await getComments(zippclipId);
      if (result.success) {
        setComments(result.data || []);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load comments'
        });
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    if (!currentUser) {
      toast({
        variant: 'destructive',
        title: 'Please login',
        description: 'You need to be logged in to comment'
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await addComment(zippclipId, newComment);
      if (result.success) {
        setComments(prev => [...prev, result.data]);
        setNewComment('');
        onCommentAdded();
        toast({
          title: 'Comment added!',
          description: 'Your comment has been posted'
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to add comment'
        });
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add comment'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return `${Math.floor(diffInSeconds / 604800)}w`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Comments ({comments.length})</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground mb-2">No comments yet</p>
              <p className="text-sm text-muted-foreground">Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.profiles?.avatar_url} />
                  <AvatarFallback>
                    {comment.profiles?.full_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm">
                      {comment.profiles?.full_name || 'Unknown User'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{comment.content}</p>
                  
                  {/* Comment actions */}
                  <div className="flex items-center space-x-4 mt-2">
                    <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground hover:text-red-500">
                      <Heart className="h-3 w-3 mr-1" />
                      <span className="text-xs">Like</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground">
                      <span className="text-xs">Reply</span>
                    </Button>
                  </div>
                </div>
                
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <form onSubmit={handleSubmitComment} className="flex space-x-2 pt-4 border-t">
          <Avatar className="h-8 w-8">
            <AvatarImage src={currentUser?.user_metadata?.avatar_url} />
            <AvatarFallback>
              {currentUser?.user_metadata?.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 flex space-x-2">
            <Input
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1"
              disabled={submitting}
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!newComment.trim() || submitting}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
