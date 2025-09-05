
'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserPlus, Heart, MessageCircle, Bell, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getNotifications, markNotificationAsRead } from '@/lib/social-actions';
import { useToast } from '@/hooks/use-toast';

interface NotificationData {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'share';
  content?: string;
  read: boolean;
  created_at: string;
  zippclip_id?: string;
  actor: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
  zippclip?: {
    media_url: string;
    media_type: string;
  };
}

const NotificationIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'follow':
      return <UserPlus className="h-5 w-5 text-primary" />;
    case 'like':
      return <Heart className="h-5 w-5 text-red-500" />;
    case 'comment':
      return <MessageCircle className="h-5 w-5 text-blue-500" />;
    default:
      return null;
  }
};

const NotificationText = ({ notification }: { notification: NotificationData }) => {
    switch (notification.type) {
      case 'follow':
        return (
          <p>
            <span className="font-semibold">{notification.actor.full_name}</span> started following you.
          </p>
        );
      case 'like':
        return (
          <p>
            <span className="font-semibold">{notification.actor.full_name}</span> liked your zippclip.
          </p>
        );
      case 'comment':
        return (
          <p>
            <span className="font-semibold">{notification.actor.full_name}</span> commented: {notification.content}
          </p>
        );
      case 'share':
        return (
          <p>
            <span className="font-semibold">{notification.actor.full_name}</span> shared your zippclip.
          </p>
        );
      default:
        return null;
    }
  };

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMilliseconds = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
};

export default function NotificationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      const result = await getNotifications();
      
      if (result.success) {
        setNotifications(result.data || []);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to load notifications',
          variant: 'destructive',
        });
      }
      setLoading(false);
    };

    fetchNotifications();
  }, [toast]);

  const handleNotificationClick = async (notification: NotificationData) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
    }

    // Navigate to relevant content
    if (notification.zippclip_id) {
      // Navigate to home page with the specific zippclip highlighted
      router.push(`/home?highlight=${notification.zippclip_id}`);
    } else if (notification.type === 'follow') {
      router.push(`/user/${notification.actor.username}`);
    } else if (notification.comment_id) {
      // Navigate to home page with the comment's zippclip highlighted
      router.push(`/home?highlight=${notification.zippclip_id}&comment=${notification.comment_id}`);
    }
  };

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 flex items-center border-b bg-background p-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-semibold mx-auto">Notifications</h1>
        <div className="w-10" />
      </header>
      <main className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : notifications.length > 0 ? (
          <ul>
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={cn(
                  'border-b p-4 flex items-start gap-3 cursor-pointer hover:bg-muted/50',
                  !notification.read ? 'bg-primary/5' : 'bg-background'
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={notification.actor.avatar_url} alt={notification.actor.full_name} />
                    <AvatarFallback>{notification.actor.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-background p-0.5 rounded-full">
                      <NotificationIcon type={notification.type} />
                  </div>
                </div>
                <div className="flex-1">
                  <NotificationText notification={notification} />
                  <p className="text-sm text-muted-foreground mt-1">{formatTimeAgo(notification.created_at)}</p>
                </div>
                {notification.zippclip && (
                  <Image
                    src={notification.zippclip.media_url}
                    alt="zippclip thumbnail"
                    width={48}
                    height={64}
                    className="rounded-md object-cover"
                  />
                )}
                {!notification.zippclip && notification.type === 'follow' && (
                  <Button size="sm" variant={notification.read ? "secondary" : "primary"}>Follow Back</Button>
                )}
              </li>
            ))}
          </ul>
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
              <Bell className="w-24 h-24 mb-4"/>
              <h2 className="text-2xl font-bold text-foreground">No Notifications Yet</h2>
              <p className="mt-2">Your notifications will appear here.</p>
            </div>
        )}
      </main>
    </div>
  );
}
