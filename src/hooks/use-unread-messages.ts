'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = async () => {
    try {
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's conversations
      const { data: userParticipations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id)
        .is('left_at', null);

      if (!userParticipations || userParticipations.length === 0) {
        setUnreadCount(0);
        return;
      }

      const conversationIds = userParticipations.map(p => p.conversation_id);

      // Get all messages in user's conversations that they haven't sent
      const { data: allMessages } = await supabase
        .from('messages')
        .select('id')
        .in('conversation_id', conversationIds)
        .neq('sender_id', user.id)
        .eq('is_deleted', false);

      // Get messages the user has read
      const { data: readMessages } = await supabase
        .from('message_reads')
        .select('message_id')
        .eq('user_id', user.id);

      const readMessageIds = new Set((readMessages || []).map(r => r.message_id));
      const unreadMessages = (allMessages || []).filter(m => !readMessageIds.has(m.id));

      setUnreadCount(unreadMessages.length);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    // Set up real-time subscription for new messages
    if (!supabase) return;

    const channel = supabase
      .channel('unread-messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages'
        }, 
        () => {
          fetchUnreadCount();
        }
      )
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'message_reads'
        }, 
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { unreadCount, loading, refreshUnreadCount: fetchUnreadCount };
}
