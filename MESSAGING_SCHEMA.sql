-- Direct Messaging Schema
-- Run this in Supabase SQL Editor to add messaging functionality

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
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;
CREATE POLICY "Users can view conversations they participate in" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants 
      WHERE conversation_id = conversations.id 
      AND user_id = auth.uid()
      AND left_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update conversations they participate in" ON conversations;
CREATE POLICY "Users can update conversations they participate in" ON conversations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversation_participants 
      WHERE conversation_id = conversations.id 
      AND user_id = auth.uid()
      AND left_at IS NULL
    )
  );

-- RLS Policies for conversation_participants
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON conversation_participants;
CREATE POLICY "Users can view participants of their conversations" ON conversation_participants
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM conversation_participants cp 
      WHERE cp.conversation_id = conversation_participants.conversation_id 
      AND cp.user_id = auth.uid()
      AND cp.left_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can add participants to conversations" ON conversation_participants;
CREATE POLICY "Users can add participants to conversations" ON conversation_participants
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM conversation_participants 
        WHERE conversation_id = conversation_participants.conversation_id 
        AND user_id = auth.uid()
        AND is_admin = true
        AND left_at IS NULL
      )
    )
  );

-- RLS Policies for messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants 
      WHERE conversation_id = messages.conversation_id 
      AND user_id = auth.uid()
      AND left_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;
CREATE POLICY "Users can send messages to their conversations" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversation_participants 
      WHERE conversation_id = messages.conversation_id 
      AND user_id = auth.uid()
      AND left_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (sender_id = auth.uid());

-- RLS Policies for message_reads
DROP POLICY IF EXISTS "Users can view read status of their conversations" ON message_reads;
CREATE POLICY "Users can view read status of their conversations" ON message_reads
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
      WHERE m.id = message_reads.message_id
      AND cp.user_id = auth.uid()
      AND cp.left_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can mark messages as read" ON message_reads;
CREATE POLICY "Users can mark messages as read" ON message_reads
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
      WHERE m.id = message_reads.message_id
      AND cp.user_id = auth.uid()
      AND cp.left_at IS NULL
    )
  );

-- Functions and triggers for updating conversation timestamps
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET updated_at = NOW(), last_message_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_conversation_on_message ON messages;
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

-- Function to create or get direct conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_direct_conversation(user1_id uuid, user2_id uuid)
RETURNS uuid AS $$
DECLARE
  conv_id uuid;
BEGIN
  -- Check if conversation already exists between these two users
  SELECT c.id INTO conv_id
  FROM conversations c
  WHERE EXISTS (
    SELECT 1 FROM conversation_participants cp1 
    WHERE cp1.conversation_id = c.id AND cp1.user_id = user1_id AND cp1.left_at IS NULL
  ) AND EXISTS (
    SELECT 1 FROM conversation_participants cp2 
    WHERE cp2.conversation_id = c.id AND cp2.user_id = user2_id AND cp2.left_at IS NULL
  ) AND (
    SELECT COUNT(*) FROM conversation_participants cp 
    WHERE cp.conversation_id = c.id AND cp.left_at IS NULL
  ) = 2;

  -- If no conversation exists, create one
  IF conv_id IS NULL THEN
    INSERT INTO conversations DEFAULT VALUES RETURNING id INTO conv_id;
    
    -- Add both participants
    INSERT INTO conversation_participants (conversation_id, user_id) 
    VALUES (conv_id, user1_id), (conv_id, user2_id);
  END IF;

  RETURN conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
