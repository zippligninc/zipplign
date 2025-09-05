-- Clean Database Schema for Zipper Social Features
-- Run this in your Supabase SQL Editor

-- First, enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in correct order to handle dependencies)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS follows CASCADE;

-- Ensure profiles table exists with correct structure
CREATE TABLE IF NOT EXISTS profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  bio text,
  constraint username_length check (char_length(username) >= 3)
);

-- Enable RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
CREATE POLICY "Users can insert their own profile." ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
CREATE POLICY "Users can update own profile." ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Ensure zippclips table exists with correct structure
CREATE TABLE IF NOT EXISTS zippclips (
  id uuid not null primary key default uuid_generate_v4(),
  user_id uuid references public.profiles on delete cascade not null,
  created_at timestamp with time zone default now(),
  description text,
  media_url text,
  media_type text default 'image',
  likes integer default 0,
  comments integer default 0,
  saves integer default 0,
  shares integer default 0,
  song text,
  song_avatar_url text
);

-- Enable RLS for zippclips
ALTER TABLE zippclips ENABLE ROW LEVEL SECURITY;

-- Zippclips policies
DROP POLICY IF EXISTS "Zippclips are viewable by everyone." ON zippclips;
CREATE POLICY "Zippclips are viewable by everyone." ON zippclips
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own zippclips." ON zippclips;
CREATE POLICY "Users can insert their own zippclips." ON zippclips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own zippclips." ON zippclips;
CREATE POLICY "Users can update their own zippclips." ON zippclips
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own zippclips." ON zippclips;
CREATE POLICY "Users can delete their own zippclips." ON zippclips
  FOR DELETE USING (auth.uid() = user_id);

-- Create likes table
CREATE TABLE likes (
  id uuid not null primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  zippclip_id uuid references public.zippclips(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  UNIQUE(user_id, zippclip_id)
);

-- Enable RLS for likes
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Likes policies
CREATE POLICY "Likes are viewable by everyone." ON likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like zippclips." ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike zippclips." ON likes
  FOR DELETE USING (auth.uid() = user_id);

-- Create comments table with UUID
CREATE TABLE comments (
  id uuid not null primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  zippclip_id uuid references public.zippclips(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS for comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Comments policies
CREATE POLICY "Comments are viewable by everyone." ON comments
  FOR SELECT USING (true);

CREATE POLICY "Users can create comments." ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments." ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments." ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- Create follows table
CREATE TABLE follows (
  id uuid not null primary key default uuid_generate_v4(),
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable RLS for follows
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Follows policies
CREATE POLICY "Follows are viewable by everyone." ON follows
  FOR SELECT USING (true);

CREATE POLICY "Users can follow others." ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others." ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- Create notifications table (UUID for comment_id to match comments.id)
CREATE TABLE notifications (
  id uuid not null primary key default uuid_generate_v4(),
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  actor_id uuid references public.profiles(id) on delete cascade not null,
  type text not null CHECK (type IN ('like', 'comment', 'follow', 'share')),
  zippclip_id uuid references public.zippclips(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  content text,
  read boolean default false,
  created_at timestamp with time zone default now()
);

-- Enable RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications." ON notifications
  FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "System can create notifications." ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications." ON notifications
  FOR UPDATE USING (auth.uid() = recipient_id);

-- Create function for updating like counts
CREATE OR REPLACE FUNCTION update_zippclip_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE zippclips 
    SET likes = likes + 1 
    WHERE id = NEW.zippclip_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE zippclips 
    SET likes = GREATEST(likes - 1, 0) 
    WHERE id = OLD.zippclip_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for like count updates
DROP TRIGGER IF EXISTS trigger_update_likes_count ON likes;
CREATE TRIGGER trigger_update_likes_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_zippclip_likes_count();

-- Create function for updating comment counts
CREATE OR REPLACE FUNCTION update_zippclip_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE zippclips 
    SET comments = comments + 1 
    WHERE id = NEW.zippclip_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE zippclips 
    SET comments = GREATEST(comments - 1, 0) 
    WHERE id = OLD.zippclip_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for comment count updates
DROP TRIGGER IF EXISTS trigger_update_comments_count ON comments;
CREATE TRIGGER trigger_update_comments_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_zippclip_comments_count();

-- Create storage bucket for media files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('zippclips', 'zippclips', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Anyone can view zippclips media" ON storage.objects;
CREATE POLICY "Anyone can view zippclips media" ON storage.objects
  FOR SELECT USING (bucket_id = 'zippclips');

DROP POLICY IF EXISTS "Authenticated users can upload zippclips media" ON storage.objects;
CREATE POLICY "Authenticated users can upload zippclips media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'zippclips' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own zippclips media" ON storage.objects;
CREATE POLICY "Users can update their own zippclips media" ON storage.objects
  FOR UPDATE USING (bucket_id = 'zippclips' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own zippclips media" ON storage.objects;
CREATE POLICY "Users can delete their own zippclips media" ON storage.objects
  FOR DELETE USING (bucket_id = 'zippclips' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function for auto-creating profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, avatar_url)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ language plpgsql security definer;

-- Create trigger for auto-creating profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
