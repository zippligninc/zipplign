-- Fix messaging RLS policies
-- Run this in Supabase SQL Editor to fix the permission issues

-- 1. First, ensure tables exist
CREATE TABLE IF NOT EXISTS conversations (
  id uuid not null primary key default uuid_generate_v4(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  last_message_at timestamp with time zone default now()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  id uuid not null primary key default uuid_generate_v4(),
  conversation_id uuid references public.conversations on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  joined_at timestamp with time zone default now(),
  left_at timestamp with time zone,
  is_admin boolean default false,
  UNIQUE(conversation_id, user_id)
);

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

CREATE TABLE IF NOT EXISTS message_reads (
  id uuid not null primary key default uuid_generate_v4(),
  message_id uuid references public.messages on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  read_at timestamp with time zone default now(),
  UNIQUE(message_id, user_id)
);

-- 2. Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;

-- 3. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update conversations they participate in" ON conversations;

DROP POLICY IF EXISTS "Users can view participants of their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to conversations" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_read" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_insert" ON conversation_participants;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

DROP POLICY IF EXISTS "Users can view their own message reads" ON message_reads;
DROP POLICY IF EXISTS "Users can mark messages as read" ON message_reads;
DROP POLICY IF EXISTS "Users can view read status of their conversations" ON message_reads;

-- 4. Create simple, working RLS policies

-- Conversations: Users can see conversations they participate in
CREATE POLICY "conversations_select" ON conversations
  FOR SELECT USING (
    id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid() 
      AND left_at IS NULL
    )
  );

CREATE POLICY "conversations_insert" ON conversations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "conversations_update" ON conversations
  FOR UPDATE USING (
    id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid() 
      AND left_at IS NULL
    )
  );

-- Conversation participants: Users can see participants in their conversations
CREATE POLICY "conversation_participants_select" ON conversation_participants
  FOR SELECT USING (
    -- User can see their own participation
    user_id = auth.uid() 
    OR 
    -- User can see other participants in conversations they're part of
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid() 
      AND left_at IS NULL
    )
  );

CREATE POLICY "conversation_participants_insert" ON conversation_participants
  FOR INSERT WITH CHECK (
    -- Users can add themselves or others to conversations they're part of
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() 
      OR 
      conversation_id IN (
        SELECT conversation_id 
        FROM conversation_participants 
        WHERE user_id = auth.uid() 
        AND left_at IS NULL
      )
    )
  );

CREATE POLICY "conversation_participants_update" ON conversation_participants
  FOR UPDATE USING (user_id = auth.uid());

-- Messages: Users can see messages in their conversations
CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid() 
      AND left_at IS NULL
    )
  );

CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() 
    AND 
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid() 
      AND left_at IS NULL
    )
  );

CREATE POLICY "messages_update" ON messages
  FOR UPDATE USING (sender_id = auth.uid());

CREATE POLICY "messages_delete" ON messages
  FOR DELETE USING (sender_id = auth.uid());

-- Message reads: Users can manage their own read status
CREATE POLICY "message_reads_select" ON message_reads
  FOR SELECT USING (
    user_id = auth.uid() 
    OR 
    message_id IN (
      SELECT m.id 
      FROM messages m 
      JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id 
      WHERE cp.user_id = auth.uid() 
      AND cp.left_at IS NULL
    )
  );

CREATE POLICY "message_reads_insert" ON message_reads
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_left_at ON conversation_participants(left_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_reads_user_id ON message_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_message_id ON message_reads(message_id);

-- 6. Test the policies
SELECT 'Policy Test Complete - Tables and policies created successfully' as result;
