-- Check messaging permissions and RLS policies
-- Run this in Supabase SQL Editor while logged in as a user

-- 1. Check current user
SELECT 
    'Current User Check' as step,
    auth.uid() as current_user_id,
    auth.role() as current_role;

-- 2. Check if conversation_participants table exists and is accessible
SELECT 
    'Table Access Check' as step,
    COUNT(*) as total_participants
FROM conversation_participants;

-- 3. Check if we can see any participations for current user
SELECT 
    'User Participations Check' as step,
    COUNT(*) as user_participations
FROM conversation_participants 
WHERE user_id = auth.uid();

-- 4. Check conversations table access
SELECT 
    'Conversations Table Check' as step,
    COUNT(*) as total_conversations
FROM conversations;

-- 5. Check if RLS policies are blocking access
-- Try to select from conversation_participants with explicit user check
SELECT 
    'RLS Policy Check' as step,
    cp.conversation_id,
    cp.user_id,
    p.username,
    p.full_name
FROM conversation_participants cp
LEFT JOIN profiles p ON cp.user_id = p.id
WHERE cp.user_id = auth.uid()
   OR EXISTS (
       SELECT 1 FROM conversation_participants cp2 
       WHERE cp2.conversation_id = cp.conversation_id 
       AND cp2.user_id = auth.uid()
   );

-- 6. Test the exact query from the app
SELECT 
    'App Query Test' as step,
    cp.conversation_id,
    c.id,
    c.created_at,
    c.updated_at,
    c.last_message_at
FROM conversation_participants cp
LEFT JOIN conversations c ON cp.conversation_id = c.id
WHERE cp.user_id = auth.uid()
  AND cp.left_at IS NULL;

-- 7. Check profiles access
SELECT 
    'Profiles Access Check' as step,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN id = auth.uid() THEN 1 END) as current_user_profile
FROM profiles;
