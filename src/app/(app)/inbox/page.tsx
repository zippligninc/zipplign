'use client';

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Plus, Search, Users, LayoutGrid, MessageCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getConversations, type Conversation } from "@/lib/messaging";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
    const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    if (!supabase) {
      toast({
        title: 'Configuration Error',
        description: 'Database connection not available.',
        variant: 'destructive',
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    setCurrentUser(user);
    await fetchConversations();
  };

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const result = await getConversations();
      if (result.success) {
        setConversations(result.data || []);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load conversations',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = () => {
    router.push('/inbox/new');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return date.toLocaleDateString();
  };

  const getConversationName = (conv: Conversation) => {
    if (conv.participants.length === 1) {
      return conv.participants[0].full_name;
    }
    return conv.participants.map(p => p.full_name).join(', ');
  };

  const getConversationAvatar = (conv: Conversation) => {
    if (conv.participants.length === 1) {
      return conv.participants[0].avatar_url;
    }
    return conv.participants[0]?.avatar_url; // For group chats, show first participant
  };

  const filteredConversations = conversations.filter(conv =>
    getConversationName(conv).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnreadCount = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <header className="flex items-center justify-between p-3 sticky top-0 bg-background z-10 border-b">
        <Link href="/add-friends">
          <Button variant="ghost" size="icon">
            <Users className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
            <h1 className="text-base font-bold">Inbox</h1>
          {totalUnreadCount > 0 && (
            <Badge variant="destructive" className="h-5 min-w-5 text-xs">
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={handleNewMessage}>
          <Pencil className="h-5 w-5" />
        </Button>
        </header>
        
        <main className="flex-1 px-4">
        {/* Search */}
        <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search conversations..." 
            className="pl-9 h-9" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Quick Actions */}
        <div className="flex space-x-3 py-3 overflow-x-auto border-b mb-4">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 whitespace-nowrap"
            onClick={handleNewMessage}
          >
            <MessageCircle className="h-4 w-4" />
            New Message
          </Button>
          
          <Link href="/add-friends">
            <Button variant="outline" size="sm" className="flex items-center gap-2 whitespace-nowrap">
              <Users className="h-4 w-4" />
              Find Friends
            </Button>
          </Link>
        </div>

        {/* Conversations List */}
        <div className="space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => (
              <Link key={conv.id} href={`/inbox/${conv.id}`} className="block">
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={getConversationAvatar(conv)} alt={getConversationName(conv)} />
                      <AvatarFallback>
                        {getConversationName(conv).charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                    {conv.participants.length > 1 && (
                      <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                        <Users className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm truncate">
                        {getConversationName(conv)}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {conv.last_message ? formatTime(conv.last_message.created_at) : formatTime(conv.created_at)}
                        </p>
                        {conv.unread_count > 0 && (
                          <Badge variant="destructive" className="h-5 min-w-5 text-xs">
                            {conv.unread_count > 99 ? '99+' : conv.unread_count}
                          </Badge>
                        )}
                        </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.last_message ? (
                        <>
                          {conv.last_message.sender_name}: {conv.last_message.content}
                        </>
                      ) : (
                        <span className="italic">No messages yet</span>
                      )}
                    </p>
                          </div>
                      </div>
                    </Link>
                  ))
                ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
              <p className="text-muted-foreground mb-6">
                Start messaging your friends and followers
              </p>
              <Button onClick={handleNewMessage} className="flex items-center gap-2 mx-auto">
                <Pencil className="h-4 w-4" />
                Start a conversation
              </Button>
            </div>
          )}
            </div>
        </main>
    </div>
  );
}