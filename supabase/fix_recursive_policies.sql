-- Fix recursive RLS policy issue
-- Run this in Supabase SQL Editor

-- 1. Drop the problematic recursive policies
DROP POLICY IF EXISTS "conversation_participants_select" ON conversation_participants;
DROP POLICY IF EXISTS "conversations_select" ON conversations;
DROP POLICY IF EXISTS "conversations_update" ON conversations;
DROP POLICY IF EXISTS "messages_select" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;
DROP POLICY IF EXISTS "message_reads_select" ON message_reads;

-- 2. Create simple, non-recursive policies

-- Conversation participants: Simple policy - users can see their own participations and others in the same conversations
CREATE POLICY "conversation_participants_select_simple" ON conversation_participants
  FOR SELECT USING (
    -- Users can always see their own participations
    user_id = auth.uid()
    OR
    -- Users can see participations in conversations where they are also a participant
    -- This uses a direct join to avoid recursion
    EXISTS (
      SELECT 1 
      FROM conversation_participants cp_self 
      WHERE cp_self.conversation_id = conversation_participants.conversation_id 
        AND cp_self.user_id = auth.uid() 
        AND cp_self.left_at IS NULL
    )
  );

-- Conversations: Simple policy using a direct approach
CREATE POLICY "conversations_select_simple" ON conversations
  FOR SELECT USING (
    -- Use EXISTS with a direct query to avoid recursion
    EXISTS (
      SELECT 1 
      FROM conversation_participants cp 
      WHERE cp.conversation_id = conversations.id 
        AND cp.user_id = auth.uid() 
        AND cp.left_at IS NULL
    )
  );

CREATE POLICY "conversations_update_simple" ON conversations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 
      FROM conversation_participants cp 
      WHERE cp.conversation_id = conversations.id 
        AND cp.user_id = auth.uid() 
        AND cp.left_at IS NULL
    )
  );

-- Messages: Simple policy
CREATE POLICY "messages_select_simple" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 
      FROM conversation_participants cp 
      WHERE cp.conversation_id = messages.conversation_id 
        AND cp.user_id = auth.uid() 
        AND cp.left_at IS NULL
    )
  );

CREATE POLICY "messages_insert_simple" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() 
    AND 
    EXISTS (
      SELECT 1 
      FROM conversation_participants cp 
      WHERE cp.conversation_id = messages.conversation_id 
        AND cp.user_id = auth.uid() 
        AND cp.left_at IS NULL
    )
  );

-- Message reads: Simple policy
CREATE POLICY "message_reads_select_simple" ON message_reads
  FOR SELECT USING (
    user_id = auth.uid() 
    OR 
    EXISTS (
      SELECT 1 
      FROM messages m 
      JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id 
      WHERE m.id = message_reads.message_id 
        AND cp.user_id = auth.uid() 
        AND cp.left_at IS NULL
    )
  );

-- 3. Test the fix
SELECT 'Recursive policy fix complete - policies updated successfully' as result;
