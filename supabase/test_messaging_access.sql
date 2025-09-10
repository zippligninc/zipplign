-- Simple test to check messaging table access
-- Run this while logged in as a user in Supabase SQL Editor

-- 1. Check current user
SELECT 
    'Current User' as test,
    auth.uid() as user_id,
    auth.role() as role;

-- 2. Test conversation_participants table access
SELECT 
    'Conversation Participants Table Test' as test,
    COUNT(*) as total_rows
FROM conversation_participants;

-- 3. Test if we can query our own participations
SELECT 
    'User Participations Test' as test,
    COUNT(*) as user_participations,
    auth.uid() as current_user
FROM conversation_participants 
WHERE user_id = auth.uid();

-- 4. Test conversations table access
SELECT 
    'Conversations Table Test' as test,
    COUNT(*) as total_conversations
FROM conversations;

-- 5. Test the exact query from the app
SELECT 
    'App Query Test' as test,
    conversation_id,
    user_id,
    joined_at,
    left_at
FROM conversation_participants
WHERE user_id = auth.uid()
  AND left_at IS NULL
LIMIT 5;
