-- Draft Saving Schema for Zipplign
-- This schema adds draft functionality for incomplete Zippclips

-- Create drafts table
CREATE TABLE IF NOT EXISTS drafts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  description TEXT,
  song TEXT,
  song_avatar_url TEXT,
  location_data JSONB,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user drafts
CREATE INDEX IF NOT EXISTS idx_drafts_user_id ON drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_drafts_created_at ON drafts(created_at DESC);

-- Enable RLS
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for drafts
CREATE POLICY "Users can view their own drafts" ON drafts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own drafts" ON drafts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drafts" ON drafts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drafts" ON drafts
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_drafts_updated_at_trigger
  BEFORE UPDATE ON drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_drafts_updated_at();

-- Add draft_id to zippclips table for reference
ALTER TABLE zippclips ADD COLUMN IF NOT EXISTS draft_id UUID REFERENCES drafts(id) ON DELETE SET NULL;
