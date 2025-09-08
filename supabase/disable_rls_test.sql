-- Temporarily disable RLS to test if that's the issue
-- Run this in Supabase SQL Editor

-- 1. Disable RLS temporarily
ALTER TABLE conversation_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads DISABLE ROW LEVEL SECURITY;

-- 2. Test basic access
SELECT 
    'RLS Disabled Test' as test,
    COUNT(*) as total_participants
FROM conversation_participants;

-- 3. Show this completed
SELECT 'RLS has been disabled for testing - try your app now' as result;

-- IMPORTANT: After testing, run this to re-enable RLS:
/*
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;
*/
