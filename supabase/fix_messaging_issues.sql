-- Fix messaging issues and create test data
-- Run this in Supabase SQL Editor

-- 1. First, let's make sure the tables exist and have proper structure
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

-- 2. Enable RLS if not already enabled
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;

-- 3. Create better RLS policies
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

DROP POLICY IF EXISTS "Users can view participants of their conversations" ON conversation_participants;
CREATE POLICY "Users can view participants of their conversations" ON conversation_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp 
      WHERE cp.conversation_id = conversation_participants.conversation_id 
      AND cp.user_id = auth.uid()
      AND cp.left_at IS NULL
    )
  );

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

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- 5. Create or update the direct conversation function
CREATE OR REPLACE FUNCTION create_direct_conversation(other_user uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    conversation_id uuid;
    existing_conv_id uuid;
BEGIN
    -- Check if conversation already exists between these two users
    SELECT c.id INTO existing_conv_id
    FROM conversations c
    WHERE EXISTS (
        SELECT 1 FROM conversation_participants cp1 
        WHERE cp1.conversation_id = c.id 
        AND cp1.user_id = auth.uid() 
        AND cp1.left_at IS NULL
    ) AND EXISTS (
        SELECT 1 FROM conversation_participants cp2 
        WHERE cp2.conversation_id = c.id 
        AND cp2.user_id = other_user 
        AND cp2.left_at IS NULL
    ) AND (
        SELECT COUNT(*) FROM conversation_participants cp 
        WHERE cp.conversation_id = c.id 
        AND cp.left_at IS NULL
    ) = 2;

    -- If conversation exists, return it
    IF existing_conv_id IS NOT NULL THEN
        RETURN existing_conv_id;
    END IF;

    -- Create new conversation
    INSERT INTO conversations (created_at, updated_at, last_message_at)
    VALUES (NOW(), NOW(), NOW())
    RETURNING id INTO conversation_id;
    
    -- Add current user as participant
    INSERT INTO conversation_participants (conversation_id, user_id, joined_at)
    VALUES (conversation_id, auth.uid(), NOW());
    
    -- Add other user as participant
    INSERT INTO conversation_participants (conversation_id, user_id, joined_at)
    VALUES (conversation_id, other_user, NOW());
    
    RETURN conversation_id;
END;
$$;

-- 6. Function to check if user profiles have proper data
CREATE OR REPLACE FUNCTION check_user_profiles()
RETURNS TABLE(
    user_id uuid,
    username text,
    full_name text,
    avatar_url text,
    has_name boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.username,
        p.full_name,
        p.avatar_url,
        (p.full_name IS NOT NULL AND p.full_name != '') OR (p.username IS NOT NULL AND p.username != '') as has_name
    FROM profiles p
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Check current conversations and their participants
CREATE OR REPLACE FUNCTION debug_conversations()
RETURNS TABLE(
    conversation_id uuid,
    participant_count bigint,
    participant_names text[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        COUNT(cp.user_id) as participant_count,
        ARRAY_AGG(COALESCE(p.full_name, p.username, 'No Name')) as participant_names
    FROM conversations c
    LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id AND cp.left_at IS NULL
    LEFT JOIN profiles p ON cp.user_id = p.id
    GROUP BY c.id
    ORDER BY c.last_message_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
