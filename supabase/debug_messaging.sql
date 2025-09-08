-- Debug messaging system
-- Run this in Supabase SQL Editor to check your data

-- 1. Check if messaging tables exist
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('conversations', 'conversation_participants', 'messages', 'profiles')
ORDER BY table_name, ordinal_position;

-- 2. Check profiles data
SELECT 
    id,
    username,
    full_name,
    avatar_url,
    created_at,
    CASE 
        WHEN full_name IS NOT NULL AND full_name != '' THEN 'HAS_FULL_NAME'
        WHEN username IS NOT NULL AND username != '' THEN 'HAS_USERNAME'
        ELSE 'NO_NAME_DATA'
    END as name_status
FROM profiles 
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check conversations
SELECT 
    c.id as conversation_id,
    c.created_at,
    c.last_message_at,
    COUNT(cp.user_id) as participant_count,
    STRING_AGG(COALESCE(p.full_name, p.username, 'NO_NAME'), ', ') as participant_names
FROM conversations c
LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id AND cp.left_at IS NULL
LEFT JOIN profiles p ON cp.user_id = p.id
GROUP BY c.id, c.created_at, c.last_message_at
ORDER BY c.last_message_at DESC;

-- 4. Check conversation participants with full details
SELECT 
    cp.conversation_id,
    cp.user_id,
    p.username,
    p.full_name,
    cp.joined_at,
    cp.left_at
FROM conversation_participants cp
LEFT JOIN profiles p ON cp.user_id = p.id
ORDER BY cp.conversation_id, cp.joined_at;

-- 5. Check messages
SELECT 
    m.id,
    m.conversation_id,
    m.content,
    p.username as sender_username,
    p.full_name as sender_full_name,
    m.created_at
FROM messages m
LEFT JOIN profiles p ON m.sender_id = p.id
ORDER BY m.created_at DESC
LIMIT 10;

-- 6. Create a test conversation (uncomment and modify user IDs as needed)
/*
-- Replace these UUIDs with actual user IDs from your profiles table
DO $$
DECLARE
    user1_id uuid := 'YOUR_USER_ID_1_HERE';
    user2_id uuid := 'YOUR_USER_ID_2_HERE';
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
    VALUES (conv_id, user1_id, 'Hello! This is a test message.', NOW());
    
    RAISE NOTICE 'Test conversation created with ID: %', conv_id;
END $$;
*/
