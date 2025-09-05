'use client';

import { supabase } from './supabase';
import { toast } from '@/hooks/use-toast';

export interface SocialActionResponse {
  success: boolean;
  error?: string;
  data?: any;
}

// Like/Unlike functions
export async function toggleLike(zippclipId: string): Promise<SocialActionResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Check if already liked
    const { data: existingLike, error: checkError } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('zippclip_id', zippclipId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
      throw checkError;
    }

    if (existingLike) {
      // Unlike
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('zippclip_id', zippclipId);

      if (deleteError) throw deleteError;

      return { success: true, data: { liked: false } };
    } else {
      // Like
      const { error: insertError } = await supabase
        .from('likes')
        .insert({
          user_id: user.id,
          zippclip_id: zippclipId
        });

      if (insertError) throw insertError;

      // Create notification for the post owner
      const { data: zippclip } = await supabase
        .from('zippclips')
        .select('user_id')
        .eq('id', zippclipId)
        .single();

      if (zippclip && zippclip.user_id !== user.id) {
        await supabase
          .from('notifications')
          .insert({
            recipient_id: zippclip.user_id,
            actor_id: user.id,
            type: 'like',
            zippclip_id: zippclipId
          });
      }

      return { success: true, data: { liked: true } };
    }
  } catch (error: any) {
    console.error('Error toggling like:', error);
    return { success: false, error: error.message };
  }
}

// Comment functions
export async function addComment(zippclipId: string, content: string): Promise<SocialActionResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    if (!content.trim()) {
      throw new Error('Comment cannot be empty');
    }

    const { data: comment, error: insertError } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        zippclip_id: zippclipId,
        content: content.trim()
      })
      .select(`
        id,
        content,
        created_at,
        profiles:user_id (
          username,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (insertError) throw insertError;

    // Create notification for the post owner
    const { data: zippclip } = await supabase
      .from('zippclips')
      .select('user_id')
      .eq('id', zippclipId)
      .single();

    if (zippclip && zippclip.user_id !== user.id) {
      await supabase
        .from('notifications')
        .insert({
          recipient_id: zippclip.user_id,
          actor_id: user.id,
          type: 'comment',
          zippclip_id: zippclipId,
          comment_id: comment.id,
          content: content.trim()
        });
    }

    return { success: true, data: comment };
  } catch (error: any) {
    console.error('Error adding comment:', error);
    return { success: false, error: error.message };
  }
}

export async function getComments(zippclipId: string): Promise<SocialActionResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        profiles:user_id (
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('zippclip_id', zippclipId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return { success: true, data: comments };
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return { success: false, error: error.message };
  }
}

// Follow/Unfollow functions
export async function toggleFollow(targetUserId: string): Promise<SocialActionResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    if (user.id === targetUserId) {
      throw new Error('Cannot follow yourself');
    }

    // Check if already following
    const { data: existingFollow, error: checkError } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingFollow) {
      // Unfollow
      const { error: deleteError } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

      if (deleteError) throw deleteError;

      return { success: true, data: { following: false } };
    } else {
      // Follow
      const { error: insertError } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: targetUserId
        });

      if (insertError) throw insertError;

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          recipient_id: targetUserId,
          actor_id: user.id,
          type: 'follow'
        });

      return { success: true, data: { following: true } };
    }
  } catch (error: any) {
    console.error('Error toggling follow:', error);
    return { success: false, error: error.message };
  }
}

// Check if user is following another user
export async function checkIsFollowing(targetUserId: string): Promise<SocialActionResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: true, data: { following: false } };
    }

    const { data: follow, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return { success: true, data: { following: !!follow } };
  } catch (error: any) {
    console.error('Error checking follow status:', error);
    return { success: false, error: error.message };
  }
}

// Check if user has liked a post
export async function checkIsLiked(zippclipId: string): Promise<SocialActionResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: true, data: { liked: false } };
    }

    const { data: like, error } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('zippclip_id', zippclipId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return { success: true, data: { liked: !!like } };
  } catch (error: any) {
    console.error('Error checking like status:', error);
    return { success: false, error: error.message };
  }
}

// Get notifications for current user
export async function getNotifications(): Promise<SocialActionResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select(`
        id,
        type,
        content,
        read,
        created_at,
        zippclip_id,
        actor:actor_id (
          username,
          full_name,
          avatar_url
        ),
        zippclip:zippclip_id (
          media_url,
          media_type
        )
      `)
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return { success: true, data: notifications };
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return { success: false, error: error.message };
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string): Promise<SocialActionResponse> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error.message };
  }
}
