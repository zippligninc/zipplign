-- Comprehensive messaging debug and fix script
-- Run this in Supabase SQL Editor

-- 1. Check if messaging tables exist
SELECT 
    'Table Check' as step,
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.tables 
WHERE table_name IN ('conversations', 'conversation_participants', 'messages', 'profiles')
    AND table_schema = 'public'
ORDER BY table_name;

-- 2. Check profiles data quality
SELECT 
    '2. Profiles Check' as step,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN full_name IS NOT NULL AND full_name != '' THEN 1 END) as has_full_name,
    COUNT(CASE WHEN username IS NOT NULL AND username != '' THEN 1 END) as has_username,
    COUNT(CASE WHEN (full_name IS NOT NULL AND full_name != '') OR (username IS NOT NULL AND username != '') THEN 1 END) as has_displayable_name
FROM profiles;

-- 3. Show sample profiles
SELECT 
    '3. Sample Profiles' as step,
    id,
    username,
    full_name,
    CASE 
        WHEN full_name IS NOT NULL AND full_name != '' THEN full_name
        WHEN username IS NOT NULL AND username != '' THEN username
        ELSE 'NO_NAME'
    END as display_name,
    updated_at
FROM profiles 
ORDER BY updated_at DESC NULLS LAST
LIMIT 5;

-- 4. Check existing conversations
SELECT 
    '4. Conversations Check' as step,
    c.id as conversation_id,
    c.created_at,
    COUNT(cp.user_id) as participant_count,
    STRING_AGG(
        COALESCE(p.full_name, p.username, 'NO_NAME'), 
        ', ' ORDER BY p.full_name, p.username
    ) as participant_names
FROM conversations c
LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id AND cp.left_at IS NULL
LEFT JOIN profiles p ON cp.user_id = p.id
GROUP BY c.id, c.created_at
ORDER BY c.created_at DESC;

-- 5. Check conversation participants details
SELECT 
    '5. Participants Details' as step,
    cp.conversation_id,
    cp.user_id,
    p.username,
    p.full_name,
    CASE 
        WHEN p.full_name IS NOT NULL AND p.full_name != '' THEN p.full_name
        WHEN p.username IS NOT NULL AND p.username != '' THEN p.username
        ELSE 'NO_NAME'
    END as display_name,
    cp.left_at
FROM conversation_participants cp
LEFT JOIN profiles p ON cp.user_id = p.id
ORDER BY cp.conversation_id, cp.joined_at;

-- 6. Create tables if they don't exist
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

-- 7. Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;

-- 8. Create better RLS policies
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

-- 9. First, let's see your user IDs so you can create a test conversation
SELECT 
    '9. Available Users for Test Conversation' as step,
    id,
    username,
    full_name,
    CASE 
        WHEN full_name IS NOT NULL AND full_name != '' THEN full_name
        WHEN username IS NOT NULL AND username != '' THEN username
        ELSE 'NO_NAME'
    END as display_name
FROM profiles 
ORDER BY updated_at DESC NULLS LAST
LIMIT 10;

-- 10. Create a test conversation with your actual users
-- INSTRUCTIONS: 
-- 1. Look at the user IDs from the query above
-- 2. Pick any two user IDs 
-- 3. Replace the UUIDs below with those actual user IDs
-- 4. Uncomment the block below and run it

/*
-- Uncomment this block and replace with real user IDs to create a test conversation
DO $$
DECLARE
    user1_id uuid := 'REPLACE_WITH_FIRST_USER_ID';  -- Replace this with actual ID
    user2_id uuid := 'REPLACE_WITH_SECOND_USER_ID'; -- Replace this with actual ID
    conv_id uuid;
BEGIN
    -- Create conversation
    INSERT INTO conversations (created_at, updated_at, last_message_at)
    VALUES (NOW(), NOW(), NOW())
    RETURNING id INTO conv_id;
    
    -- Add participants
    INSERT INTO conversation_participants (conversation_id, user_id, joined_at)
    VALUES 
        (conv_id, user1_id, NOW()),
        (conv_id, user2_id, NOW());
    
    -- Add a test message
    INSERT INTO messages (conversation_id, sender_id, content, created_at)
    VALUES (conv_id, user1_id, 'Hello! This is a test message to check if participant names work properly.', NOW());
    
    RAISE NOTICE 'Test conversation created with ID: %', conv_id;
    RAISE NOTICE 'You can now check your inbox in the app!';
END $$;
*/

-- 10. Final check - show what we have now
SELECT 
    '10. Final Check' as step,
    c.id as conversation_id,
    STRING_AGG(
        COALESCE(p.full_name, p.username, 'NO_NAME'), 
        ' & ' ORDER BY p.full_name, p.username
    ) as conversation_display_name,
    COUNT(cp.user_id) as participant_count
FROM conversations c
LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id AND cp.left_at IS NULL
LEFT JOIN profiles p ON cp.user_id = p.id
GROUP BY c.id
ORDER BY c.created_at DESC;
