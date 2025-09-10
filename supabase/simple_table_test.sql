-- Simple test to verify messaging tables exist and work
-- Run this in Supabase SQL Editor

-- 1. Check if tables exist
SELECT 
    table_name,
    'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('conversations', 'conversation_participants', 'messages', 'profiles')
ORDER BY table_name;

-- 2. Check current user
SELECT 
    'Current User Info' as test,
    auth.uid() as user_id,
    auth.role() as role;

-- 3. Try to access conversation_participants table (this should work now)
SELECT 
    'Table Access Test' as test,
    COUNT(*) as total_rows
FROM conversation_participants;

-- 4. Test inserting a simple conversation (if no error, tables work)
DO $$
DECLARE
    test_conv_id uuid;
    current_user_id uuid;
BEGIN
    -- Get current user
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE NOTICE 'No authenticated user found';
        RETURN;
    END IF;
    
    -- Create a test conversation
    INSERT INTO conversations (created_at, updated_at, last_message_at)
    VALUES (NOW(), NOW(), NOW())
    RETURNING id INTO test_conv_id;
    
    -- Add current user as participant
    INSERT INTO conversation_participants (conversation_id, user_id, joined_at)
    VALUES (test_conv_id, current_user_id, NOW());
    
    RAISE NOTICE 'SUCCESS: Test conversation created with ID: %', test_conv_id;
    RAISE NOTICE 'User % added as participant', current_user_id;
    
    -- Clean up the test data
    DELETE FROM conversation_participants WHERE conversation_id = test_conv_id;
    DELETE FROM conversations WHERE id = test_conv_id;
    
    RAISE NOTICE 'Test data cleaned up successfully';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: %', SQLERRM;
END $$;
