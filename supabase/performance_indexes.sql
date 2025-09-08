-- Performance optimization indexes for Zipplign
-- Run these in your Supabase SQL editor to improve query performance

-- Index for zippclips queries (most common)
CREATE INDEX IF NOT EXISTS idx_zippclips_created_at ON zippclips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zippclips_user_id ON zippclips(user_id);
CREATE INDEX IF NOT EXISTS idx_zippclips_media_type ON zippclips(media_type);

-- Composite index for user feed queries
CREATE INDEX IF NOT EXISTS idx_zippclips_user_created ON zippclips(user_id, created_at DESC);

-- Index for follows table
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- Index for likes table
CREATE INDEX IF NOT EXISTS idx_likes_zippclip ON likes(zippclip_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);

-- Index for comments table
CREATE INDEX IF NOT EXISTS idx_comments_zippclip ON comments(zippclip_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);

-- Index for saves table
CREATE INDEX IF NOT EXISTS idx_saves_zippclip ON saves(zippclip_id);
CREATE INDEX IF NOT EXISTS idx_saves_user ON saves(user_id);

-- Index for profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Index for conversations and messaging
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- Index for creator stores
CREATE INDEX IF NOT EXISTS idx_creator_stores_owner ON creator_stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_creator_stores_public ON creator_stores(is_public) WHERE is_public = true;

-- Analyze tables to update statistics
ANALYZE zippclips;
ANALYZE follows;
ANALYZE likes;
ANALYZE comments;
ANALYZE saves;
ANALYZE profiles;
ANALYZE conversation_participants;
ANALYZE messages;
ANALYZE creator_stores;
