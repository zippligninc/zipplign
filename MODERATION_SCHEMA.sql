-- Content Moderation Schema
-- Run this in Supabase SQL Editor to add moderation functionality

-- Create reports table for content reporting
CREATE TABLE IF NOT EXISTS reports (
  id uuid not null primary key default uuid_generate_v4(),
  reporter_id uuid references public.profiles on delete cascade not null,
  reported_user_id uuid references public.profiles on delete cascade,
  content_type text not null CHECK (content_type IN ('zippclip', 'comment', 'profile', 'message')),
  content_id uuid not null,
  reason text not null CHECK (reason IN ('spam', 'harassment', 'inappropriate_content', 'fake_account', 'violence', 'copyright', 'other')),
  description text,
  status text default 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  reviewed_by uuid references public.profiles on delete set null,
  reviewed_at timestamp with time zone,
  resolution_notes text
);

-- Create blocked_users table for user blocking
CREATE TABLE IF NOT EXISTS blocked_users (
  id uuid not null primary key default uuid_generate_v4(),
  blocker_id uuid references public.profiles on delete cascade not null,
  blocked_id uuid references public.profiles on delete cascade not null,
  created_at timestamp with time zone default now(),
  reason text,
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- Create content_violations table for tracking violations
CREATE TABLE IF NOT EXISTS content_violations (
  id uuid not null primary key default uuid_generate_v4(),
  content_type text not null CHECK (content_type IN ('zippclip', 'comment', 'profile', 'message')),
  content_id uuid not null,
  violation_type text not null CHECK (violation_type IN ('spam', 'harassment', 'inappropriate_content', 'violence', 'copyright', 'fake_content')),
  severity text default 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  action_taken text CHECK (action_taken IN ('warning', 'content_removed', 'account_suspended', 'account_banned')),
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone,
  notes text
);

-- Create user_warnings table
CREATE TABLE IF NOT EXISTS user_warnings (
  id uuid not null primary key default uuid_generate_v4(),
  user_id uuid references public.profiles on delete cascade not null,
  warning_type text not null CHECK (warning_type IN ('community_guidelines', 'spam', 'inappropriate_content', 'harassment')),
  title text not null,
  message text not null,
  severity text default 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  acknowledged boolean default false,
  acknowledged_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_warnings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reports
DROP POLICY IF EXISTS "Users can view their own reports" ON reports;
CREATE POLICY "Users can view their own reports" ON reports
  FOR SELECT USING (reporter_id = auth.uid());

DROP POLICY IF EXISTS "Users can create reports" ON reports;
CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- RLS Policies for blocked_users
DROP POLICY IF EXISTS "Users can view their blocks" ON blocked_users;
CREATE POLICY "Users can view their blocks" ON blocked_users
  FOR SELECT USING (blocker_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their blocks" ON blocked_users;
CREATE POLICY "Users can manage their blocks" ON blocked_users
  FOR ALL USING (blocker_id = auth.uid());

-- RLS Policies for user_warnings
DROP POLICY IF EXISTS "Users can view their own warnings" ON user_warnings;
CREATE POLICY "Users can view their own warnings" ON user_warnings
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can acknowledge their warnings" ON user_warnings;
CREATE POLICY "Users can acknowledge their warnings" ON user_warnings
  FOR UPDATE USING (user_id = auth.uid());

-- Function to check if user is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(blocker_uuid uuid, blocked_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_users 
    WHERE blocker_id = blocker_uuid 
    AND blocked_id = blocked_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get content ownership
CREATE OR REPLACE FUNCTION get_content_owner(content_type_param text, content_id_param uuid)
RETURNS uuid AS $$
DECLARE
  owner_id uuid;
BEGIN
  CASE content_type_param
    WHEN 'zippclip' THEN
      SELECT user_id INTO owner_id FROM zippclips WHERE id = content_id_param;
    WHEN 'comment' THEN
      SELECT user_id INTO owner_id FROM comments WHERE id = content_id_param;
    WHEN 'profile' THEN
      owner_id := content_id_param; -- For profiles, content_id is the user_id
    ELSE
      owner_id := NULL;
  END CASE;
  
  RETURN owner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically populate reported_user_id
CREATE OR REPLACE FUNCTION populate_reported_user()
RETURNS TRIGGER AS $$
BEGIN
  NEW.reported_user_id := get_content_owner(NEW.content_type, NEW.content_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS populate_reported_user_trigger ON reports;
CREATE TRIGGER populate_reported_user_trigger
  BEFORE INSERT ON reports
  FOR EACH ROW EXECUTE FUNCTION populate_reported_user();

-- Update function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
