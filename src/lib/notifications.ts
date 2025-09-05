import { supabase } from './supabase';

export interface NotificationData {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'system';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
}

export class NotificationService {
  private static isSupported = 'Notification' in window;
  private static permission: NotificationPermission = 'default';

  // Initialize notification service
  static async initialize(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Notifications are not supported in this browser');
      return false;
    }

    this.permission = Notification.permission;
    
    if (this.permission === 'default') {
      this.permission = await Notification.requestPermission();
    }

    return this.permission === 'granted';
  }

  // Check if notifications are enabled
  static isEnabled(): boolean {
    return this.isSupported && this.permission === 'granted';
  }

  // Send browser notification
  static async sendNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<void> {
    if (!this.isEnabled()) {
      console.warn('Notifications are not enabled');
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Get user notifications from database
  static async getUserNotifications(userId: string): Promise<NotificationData[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`);
    }

    return data || [];
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(userId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
  }

  // Get unread notification count
  static async getUnreadCount(userId: string): Promise<number> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      throw new Error(`Failed to get unread count: ${error.message}`);
    }

    return count || 0;
  }

  // Create notification
  static async createNotification(
    userId: string,
    type: NotificationData['type'],
    title: string,
    message: string,
    data?: any
  ): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data,
        read: false
      });

    if (error) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }
  }

  // Subscribe to real-time notifications
  static subscribeToNotifications(
    userId: string,
    onNotification: (notification: NotificationData) => void
  ): () => void {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const notification = payload.new as NotificationData;
          onNotification(notification);
          
          // Send browser notification if enabled
          if (this.isEnabled()) {
            this.sendNotification(notification.title, {
              body: notification.message,
              tag: notification.id
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  // Handle different notification types
  static async handleLikeNotification(
    zippclipId: string,
    likerId: string,
    zippclipOwnerId: string
  ): Promise<void> {
    if (likerId === zippclipOwnerId) return; // Don't notify self

    const { data: liker } = await supabase
      .from('profiles')
      .select('username, full_name')
      .eq('id', likerId)
      .single();

    if (liker) {
      await this.createNotification(
        zippclipOwnerId,
        'like',
        'New Like',
        `${liker.full_name || liker.username} liked your zippclip`,
        { zippclip_id: zippclipId, liker_id: likerId }
      );
    }
  }

  static async handleCommentNotification(
    zippclipId: string,
    commenterId: string,
    zippclipOwnerId: string,
    comment: string
  ): Promise<void> {
    if (commenterId === zippclipOwnerId) return; // Don't notify self

    const { data: commenter } = await supabase
      .from('profiles')
      .select('username, full_name')
      .eq('id', commenterId)
      .single();

    if (commenter) {
      await this.createNotification(
        zippclipOwnerId,
        'comment',
        'New Comment',
        `${commenter.full_name || commenter.username} commented: "${comment.substring(0, 50)}${comment.length > 50 ? '...' : ''}"`,
        { zippclip_id: zippclipId, commenter_id: commenterId }
      );
    }
  }

  static async handleFollowNotification(
    followerId: string,
    followingId: string
  ): Promise<void> {
    if (followerId === followingId) return; // Don't notify self

    const { data: follower } = await supabase
      .from('profiles')
      .select('username, full_name')
      .eq('id', followerId)
      .single();

    if (follower) {
      await this.createNotification(
        followingId,
        'follow',
        'New Follower',
        `${follower.full_name || follower.username} started following you`,
        { follower_id: followerId }
      );
    }
  }
}
