-- Messaging System Setup
-- Run this in Supabase SQL Editor to set up the complete messaging system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid not null primary key default uuid_generate_v4(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  last_message_at timestamp with time zone default now()
);

-- Create conversation participants table
CREATE TABLE IF NOT EXISTS conversation_participants (
  id uuid not null primary key default uuid_generate_v4(),
  conversation_id uuid references public.conversations on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  joined_at timestamp with time zone default now(),
  left_at timestamp with time zone,
  is_admin boolean default false,
  UNIQUE(conversation_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid not null primary key default uuid_generate_v4(),
  conversation_id uuid references public.conversations on delete cascade not null,
  sender_id uuid references public.profiles on delete cascade not null,
  content text,
  message_type text default 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'file')),
  media_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  edited_at timestamp with time zone,
  reply_to_id uuid references public.messages on delete set null,
  is_deleted boolean default false
);

-- Create message_reads table to track read status
CREATE TABLE IF NOT EXISTS message_reads (
  id uuid not null primary key default uuid_generate_v4(),
  message_id uuid references public.messages on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  read_at timestamp with time zone default now(),
  UNIQUE(message_id, user_id)
);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (
    id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for conversation_participants
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON conversation_participants;
CREATE POLICY "Users can view participants in their conversations" ON conversation_participants
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can add participants to their conversations" ON conversation_participants;
CREATE POLICY "Users can add participants to their conversations" ON conversation_participants
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;
CREATE POLICY "Users can send messages to their conversations" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (sender_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;
CREATE POLICY "Users can delete their own messages" ON messages
  FOR DELETE USING (sender_id = auth.uid());

-- RLS Policies for message_reads
DROP POLICY IF EXISTS "Users can view their own message reads" ON message_reads;
CREATE POLICY "Users can view their own message reads" ON message_reads
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can mark messages as read" ON message_reads;
CREATE POLICY "Users can mark messages as read" ON message_reads
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_reads_user_id ON message_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_message_id ON message_reads(message_id);

-- Create function to update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET last_message_at = NEW.created_at,
      updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update conversation timestamp when new message is added
DROP TRIGGER IF EXISTS update_conversation_on_new_message ON messages;
CREATE TRIGGER update_conversation_on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- Create function to get unread message count for a conversation
CREATE OR REPLACE FUNCTION get_unread_count(conv_id uuid, user_uuid uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM messages m
    LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = user_uuid
    WHERE m.conversation_id = conv_id
      AND m.sender_id != user_uuid
      AND mr.id IS NULL
      AND m.is_deleted = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
