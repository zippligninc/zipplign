-- Fix Cover Photo Storage Issues
-- Run this in Supabase SQL Editor to fix cover photo uploads

-- 1. Ensure zippclips storage bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('zippclips', 'zippclips', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Anyone can view zippclips media" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload zippclips media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own zippclips media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own zippclips media" ON storage.objects;

-- 3. Create proper storage policies for zippclips (including cover photos)
-- Allow anyone to view zippclips media
CREATE POLICY "Anyone can view zippclips media" ON storage.objects
  FOR SELECT USING (bucket_id = 'zippclips');

-- Allow authenticated users to upload zippclips media to their own folder
CREATE POLICY "Users can upload zippclips media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'zippclips' 
    AND auth.role() = 'authenticated'
    AND (
      auth.uid()::text = (storage.foldername(name))[1] OR
      (storage.foldername(name))[1] = 'covers' AND auth.uid()::text = (storage.foldername(name))[2]
    )
  );

-- Allow users to update their own zippclips media
CREATE POLICY "Users can update their own zippclips media" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'zippclips' 
    AND (
      auth.uid()::text = (storage.foldername(name))[1] OR
      (storage.foldername(name))[1] = 'covers' AND auth.uid()::text = (storage.foldername(name))[2]
    )
  );

-- Allow users to delete their own zippclips media
CREATE POLICY "Users can delete their own zippclips media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'zippclips' 
    AND (
      auth.uid()::text = (storage.foldername(name))[1] OR
      (storage.foldername(name))[1] = 'covers' AND auth.uid()::text = (storage.foldername(name))[2]
    )
  );

-- 4. Ensure profiles table has cover_url column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- 5. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_cover_url ON profiles(cover_url) WHERE cover_url IS NOT NULL;
