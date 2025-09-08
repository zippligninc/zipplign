-- Comprehensive database schema fix for Zipplign
-- This script fixes all database issues and optimizes performance

-- 1. Fix column name mismatch (spotify_preview_url -> music_preview_url)
DO $$ 
BEGIN
    -- Check if spotify_preview_url exists and music_preview_url doesn't
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'zippclips' AND column_name = 'spotify_preview_url'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'zippclips' AND column_name = 'music_preview_url'
    ) THEN
        ALTER TABLE zippclips RENAME COLUMN spotify_preview_url TO music_preview_url;
        COMMENT ON COLUMN zippclips.music_preview_url IS 'Local music preview URL for audio playback';
    END IF;
END $$;

-- 2. Fix drafts table if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'drafts' AND column_name = 'spotify_preview_url'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'drafts' AND column_name = 'music_preview_url'
    ) THEN
        ALTER TABLE drafts RENAME COLUMN spotify_preview_url TO music_preview_url;
        COMMENT ON COLUMN drafts.music_preview_url IS 'Local music preview URL for audio playback in drafts';
    END IF;
END $$;

-- 3. Add missing columns if they don't exist
ALTER TABLE zippclips ADD COLUMN IF NOT EXISTS music_preview_url TEXT;
ALTER TABLE zippclips ADD COLUMN IF NOT EXISTS parent_zippclip_id UUID REFERENCES zippclips(id) ON DELETE SET NULL;

-- 4. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_zippclips_created_at ON zippclips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zippclips_user_id ON zippclips(user_id);
CREATE INDEX IF NOT EXISTS idx_zippclips_media_type ON zippclips(media_type);
CREATE INDEX IF NOT EXISTS idx_zippclips_parent ON zippclips(parent_zippclip_id);
CREATE INDEX IF NOT EXISTS idx_zippclips_user_created ON zippclips(user_id, created_at DESC);

-- 5. Fix follows table indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- 6. Fix social action indexes
CREATE INDEX IF NOT EXISTS idx_likes_zippclip ON likes(zippclip_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_zippclip ON comments(zippclip_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_saves_zippclip ON saves(zippclip_id);
CREATE INDEX IF NOT EXISTS idx_saves_user ON saves(user_id);

-- 7. Fix profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- 8. Fix messaging indexes
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- 9. Fix creator stores indexes
CREATE INDEX IF NOT EXISTS idx_creator_stores_owner ON creator_stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_creator_stores_public ON creator_stores(is_public) WHERE is_public = true;

-- 10. Update table statistics for better query planning
ANALYZE zippclips;
ANALYZE follows;
ANALYZE likes;
ANALYZE comments;
ANALYZE saves;
ANALYZE profiles;
ANALYZE conversation_participants;
ANALYZE messages;
ANALYZE creator_stores;

-- 11. Fix RLS policies for better performance
-- Drop existing problematic policies
DROP POLICY IF EXISTS "profiles_read_authenticated" ON profiles;
DROP POLICY IF EXISTS "conversation_participants_read" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_insert" ON conversation_participants;

-- Create optimized RLS policies
CREATE POLICY "profiles_read_authenticated" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "conversation_participants_read" ON conversation_participants
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "conversation_participants_insert" ON conversation_participants
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- 12. Create missing RPC functions
CREATE OR REPLACE FUNCTION create_direct_conversation(other_user uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    conversation_id uuid;
BEGIN
    -- Create conversation
    INSERT INTO conversations (created_at, updated_at)
    VALUES (NOW(), NOW())
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

-- 13. Create view update function
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 14. Create trigger for conversation updates
DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
CREATE TRIGGER trigger_update_conversation_last_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

-- 15. Create unread count function
CREATE OR REPLACE FUNCTION get_unread_count(conversation_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    unread_count integer;
BEGIN
    SELECT COUNT(*)
    INTO unread_count
    FROM messages
    WHERE messages.conversation_id = get_unread_count.conversation_id
    AND messages.sender_id != auth.uid()
    AND messages.is_deleted = false
    AND messages.id NOT IN (
        SELECT message_id 
        FROM message_reads 
        WHERE user_id = auth.uid()
    );
    
    RETURN COALESCE(unread_count, 0);
END;
$$;
