'use client';

import { supabase } from './supabase';

export interface Message {
  id: string;
  content: string;
  message_type: 'text' | 'image' | 'video' | 'audio' | 'file';
  media_url?: string;
  created_at: string;
  sender: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
  is_own_message: boolean;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  participants: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  }[];
  last_message?: {
    content: string;
    sender_name: string;
    created_at: string;
  };
  unread_count: number;
}

export async function getConversations() {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get conversations where user is a participant
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        id,
        created_at,
        updated_at,
        last_message_at,
        conversation_participants!inner (
          user_id,
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url
          )
        )
      `)
      .eq('conversation_participants.user_id', user.id)
      .is('conversation_participants.left_at', null)
      .order('last_message_at', { ascending: false });

    if (error) throw error;

    // Get last message for each conversation
    const conversationsWithMessages = await Promise.all(
      (conversations || []).map(async (conv) => {
        // Get all participants except current user
        const { data: allParticipants } = await supabase
          .from('conversation_participants')
          .select(`
            profiles:user_id (
              id,
              username,
              full_name,
              avatar_url
            )
          `)
          .eq('conversation_id', conv.id)
          .is('left_at', null);

        const participants = (allParticipants || [])
          .map(p => p.profiles)
          .filter(p => p && p.id !== user.id);

        // Get last message
        const { data: lastMessage } = await supabase
          .from('messages')
          .select(`
            content,
            created_at,
            profiles:sender_id (
              full_name
            )
          `)
          .eq('conversation_id', conv.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get unread count
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('id', { count: 'exact' })
          .eq('conversation_id', conv.id)
          .neq('sender_id', user.id)
          .eq('is_deleted', false)
          .not('id', 'in', `(
            SELECT message_id FROM message_reads WHERE user_id = '${user.id}'
          )`);

        return {
          id: conv.id,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          last_message_at: conv.last_message_at,
          participants,
          last_message: lastMessage ? {
            content: lastMessage.content,
            sender_name: lastMessage.profiles?.full_name || 'Unknown',
            created_at: lastMessage.created_at
          } : undefined,
          unread_count: unreadCount || 0
        };
      })
    );

    return { success: true, data: conversationsWithMessages };
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return { success: false, error: error.message };
  }
}

export async function getMessages(conversationId: string) {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        message_type,
        media_url,
        created_at,
        profiles:sender_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const formattedMessages: Message[] = (messages || []).map(msg => ({
      id: msg.id,
      content: msg.content,
      message_type: msg.message_type,
      media_url: msg.media_url,
      created_at: msg.created_at,
      sender: {
        id: msg.profiles.id,
        username: msg.profiles.username,
        full_name: msg.profiles.full_name,
        avatar_url: msg.profiles.avatar_url
      },
      is_own_message: msg.profiles.id === user.id
    }));

    return { success: true, data: formattedMessages };
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return { success: false, error: error.message };
  }
}

export async function sendMessage(conversationId: string, content: string, messageType: 'text' | 'image' | 'video' = 'text', mediaUrl?: string) {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
        message_type: messageType,
        media_url: mediaUrl
      })
      .select(`
        id,
        content,
        message_type,
        media_url,
        created_at,
        profiles:sender_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;

    const formattedMessage: Message = {
      id: message.id,
      content: message.content,
      message_type: message.message_type,
      media_url: message.media_url,
      created_at: message.created_at,
      sender: {
        id: message.profiles.id,
        username: message.profiles.username,
        full_name: message.profiles.full_name,
        avatar_url: message.profiles.avatar_url
      },
      is_own_message: true
    };

    return { success: true, data: formattedMessage };
  } catch (error: any) {
    console.error('Error sending message:', error);
    return { success: false, error: error.message };
  }
}

export async function createDirectConversation(otherUserId: string) {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase.rpc('create_direct_conversation', { other_user: otherUserId });

    if (error) throw error;

    return { success: true, data: { id: data } };
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    return { success: false, error: error.message };
  }
}

export async function markMessagesAsRead(conversationId: string) {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get unread messages in this conversation
    const { data: unreadMessages } = await supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .not('id', 'in', `(
        SELECT message_id FROM message_reads WHERE user_id = '${user.id}'
      )`);

    if (unreadMessages && unreadMessages.length > 0) {
      const readRecords = unreadMessages.map(msg => ({
        message_id: msg.id,
        user_id: user.id
      }));

      const { error } = await supabase
        .from('message_reads')
        .insert(readRecords);

      if (error) throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error marking messages as read:', error);
    return { success: false, error: error.message };
  }
}

// Real-time subscription for messages
export function subscribeToMessages(conversationId: string, onNewMessage: (message: Message) => void) {
  if (!supabase) return null;

  return supabase
    .channel(`messages:${conversationId}`)
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, 
      async (payload) => {
        // Fetch the complete message with sender info
        const { data: message } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            message_type,
            media_url,
            created_at,
            profiles:sender_id (
              id,
              username,
              full_name,
              avatar_url
            )
          `)
          .eq('id', payload.new.id)
          .single();

        if (message) {
          const { data: { user } } = await supabase.auth.getUser();
          const formattedMessage: Message = {
            id: message.id,
            content: message.content,
            message_type: message.message_type,
            media_url: message.media_url,
            created_at: message.created_at,
            sender: {
              id: message.profiles.id,
              username: message.profiles.username,
              full_name: message.profiles.full_name,
              avatar_url: message.profiles.avatar_url
            },
            is_own_message: message.profiles.id === user?.id
          };
          onNewMessage(formattedMessage);
        }
      }
    )
    .subscribe();
}
