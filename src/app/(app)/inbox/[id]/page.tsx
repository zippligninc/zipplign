'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Phone, Video, MoreVertical, Image as ImageIcon, Camera, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getMessages, sendMessage, markMessagesAsRead, subscribeToMessages, type Message } from '@/lib/messaging';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ConversationPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversationInfo, setConversationInfo] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const conversationId = params?.id as string;

  useEffect(() => {
    if (conversationId) {
      checkAuthAndFetchData();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!conversationId) return;

    // Subscribe to real-time messages
    const subscription = subscribeToMessages(conversationId, (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
      
      // Mark as read if not own message
      if (!newMessage.is_own_message) {
        markMessagesAsRead(conversationId);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [conversationId]);

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
    await fetchMessages();
    await fetchConversationInfo();
    await markMessagesAsRead(conversationId);
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const result = await getMessages(conversationId);
      if (result.success) {
        setMessages(result.data || []);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load messages',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationInfo = async () => {
    try {
      if (!supabase || !currentUser) return;

      // Get conversation participants
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select(`
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .is('left_at', null);

      if (participants) {
        const otherParticipants = participants
          .filter(p => p.profiles?.id !== currentUser.id)
          .map(p => p.profiles);
        
        setConversationInfo({
          participants: otherParticipants,
          name: otherParticipants.length === 1 
            ? otherParticipants[0]?.full_name 
            : otherParticipants.map(p => p?.full_name).join(', ')
        });
      }
    } catch (error) {
      console.error('Error fetching conversation info:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      const result = await sendMessage(conversationId, messageContent);
      if (result.success) {
        setMessages(prev => [...prev, result.data]);
      } else {
        setNewMessage(messageContent); // Restore message on error
        toast({
          title: 'Error',
          description: 'Failed to send message',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateSeparator = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const shouldShowDateSeparator = (currentMsg: Message, prevMsg?: Message) => {
    if (!prevMsg) return true;
    
    const currentDate = new Date(currentMsg.created_at);
    const prevDate = new Date(prevMsg.created_at);
    
    return currentDate.toDateString() !== prevDate.toDateString();
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={conversationInfo?.participants[0]?.avatar_url} />
              <AvatarFallback>
                {conversationInfo?.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-semibold text-sm">
                {conversationInfo?.name || 'Loading...'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {conversationInfo?.participants?.length === 1 ? 'Active now' : `${conversationInfo?.participants?.length || 0} participants`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground">Send a message to start the conversation</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const prevMessage = index > 0 ? messages[index - 1] : undefined;
            const showDate = shouldShowDateSeparator(message, prevMessage);
            const isOwnMessage = message.is_own_message;
            const showAvatar = !isOwnMessage && (!prevMessage || prevMessage.sender.id !== message.sender.id || showDate);

            return (
              <div key={message.id}>
                {/* Date separator */}
                {showDate && (
                  <div className="flex justify-center my-4">
                    <span className="text-xs text-muted-foreground bg-background px-3 py-1 rounded-full border">
                      {formatDateSeparator(message.created_at)}
                    </span>
                  </div>
                )}

                {/* Message */}
                <div className={`flex gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                  {!isOwnMessage && (
                    <div className="w-8">
                      {showAvatar && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.sender.avatar_url} />
                          <AvatarFallback>
                            {message.sender.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  )}

                  <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : ''}`}>
                    {!isOwnMessage && showAvatar && (
                      <p className="text-xs text-muted-foreground mb-1 ml-2">
                        {message.sender.full_name}
                      </p>
                    )}
                    
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    
                    <p className={`text-xs text-muted-foreground mt-1 ${isOwnMessage ? 'text-right' : 'ml-2'}`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon">
            <ImageIcon className="h-5 w-5" />
          </Button>
          
          <Button type="button" variant="ghost" size="icon">
            <Camera className="h-5 w-5" />
          </Button>
          
          <div className="flex-1">
            <Input
              ref={inputRef}
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sending}
              className="rounded-full"
            />
          </div>
          
          <Button 
            type="submit" 
            size="icon" 
            disabled={!newMessage.trim() || sending}
            className="rounded-full"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}