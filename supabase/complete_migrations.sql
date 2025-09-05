-- Complete Database Migrations for Zipplign
-- Run this in Supabase SQL Editor to apply all missing features

-- ==============================================
-- 1. VIEWS COLUMN MIGRATION
-- ==============================================

-- Add views column to zippclips table
ALTER TABLE zippclips ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Update existing zippclips to have 0 views if NULL
UPDATE zippclips SET views = 0 WHERE views IS NULL;

-- Create index for better performance on view queries
CREATE INDEX IF NOT EXISTS idx_zippclips_views ON zippclips(views DESC);

-- ==============================================
-- 2. SAVES FUNCTIONALITY
-- ==============================================

-- Create saves table
CREATE TABLE IF NOT EXISTS saves (
  id uuid not null primary key default uuid_generate_v4(),
  user_id uuid references public.profiles on delete cascade not null,
  zippclip_id uuid references public.zippclips on delete cascade not null,
  created_at timestamp with time zone default now(),
  
  UNIQUE(user_id, zippclip_id)
);

-- Enable RLS for saves
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;

-- Saves policies
CREATE POLICY "Saves are viewable by everyone." ON saves
  FOR SELECT USING (true);

CREATE POLICY "Users can save zippclips." ON saves
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave zippclips." ON saves
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update save count
CREATE OR REPLACE FUNCTION update_zippclip_saves_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE zippclips 
    SET saves = saves + 1 
    WHERE id = NEW.zippclip_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE zippclips 
    SET saves = GREATEST(saves - 1, 0) 
    WHERE id = OLD.zippclip_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for save count updates
DROP TRIGGER IF EXISTS trigger_update_saves_count ON saves;
CREATE TRIGGER trigger_update_saves_count
  AFTER INSERT OR DELETE ON saves
  FOR EACH ROW EXECUTE FUNCTION update_zippclip_saves_count();

-- ==============================================
-- 3. MODERATION SCHEMA
-- ==============================================

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
  user_id uuid references public.profiles on delete cascade not null,
  content_type text not null,
  content_id uuid not null,
  violation_type text not null,
  severity text not null CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  action_taken text,
  created_at timestamp with time zone default now()
);

-- Enable RLS for moderation tables
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_violations ENABLE ROW LEVEL SECURITY;

-- Reports policies
CREATE POLICY "Users can view their own reports" ON reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Blocked users policies
CREATE POLICY "Users can view their own blocks" ON blocked_users
  FOR SELECT USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

CREATE POLICY "Users can block others" ON blocked_users
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock others" ON blocked_users
  FOR DELETE USING (auth.uid() = blocker_id);

-- ==============================================
-- 4. DRAFT SAVING SYSTEM
-- ==============================================

-- Create drafts table
CREATE TABLE IF NOT EXISTS drafts (
  id uuid not null primary key default uuid_generate_v4(),
  user_id uuid references public.profiles on delete cascade not null,
  title text,
  description text,
  media_url text,
  media_type text CHECK (media_type IN ('image', 'video')),
  song text,
  song_avatar_url text,
  filters_applied jsonb,
  effects_applied jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS for drafts
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;

-- Drafts policies
CREATE POLICY "Users can view their own drafts" ON drafts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create drafts" ON drafts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drafts" ON drafts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drafts" ON drafts
  FOR DELETE USING (auth.uid() = user_id);

-- ==============================================
-- 5. CREATOR STORE (if not already applied)
-- ==============================================

-- Creator Store Accounts Table
CREATE TABLE IF NOT EXISTS creator_stores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    business_type TEXT CHECK (business_type IN ('individual', 'business')) DEFAULT 'individual',
    description TEXT,
    address TEXT,
    email TEXT,
    phone_number TEXT,
    is_public BOOLEAN DEFAULT false,
    is_store_open BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products Table
CREATE TABLE IF NOT EXISTS store_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID REFERENCES creator_stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    category TEXT,
    image_url TEXT,
    stock_quantity INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services Table
CREATE TABLE IF NOT EXISTS store_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID REFERENCES creator_stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    category TEXT,
    image_url TEXT,
    duration_minutes INTEGER,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for creator store tables
ALTER TABLE creator_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_services ENABLE ROW LEVEL SECURITY;

-- Creator Store policies
CREATE POLICY "Users can view public creator stores" ON creator_stores
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can manage their own creator store" ON creator_stores
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view available products from public stores" ON store_products
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM creator_stores 
            WHERE creator_stores.id = store_products.store_id 
            AND creator_stores.is_public = true 
            AND creator_stores.is_store_open = true
        )
    );

CREATE POLICY "Store owners can manage their products" ON store_products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM creator_stores 
            WHERE creator_stores.id = store_products.store_id 
            AND creator_stores.user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can view available services from public stores" ON store_services
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM creator_stores 
            WHERE creator_stores.id = store_services.store_id 
            AND creator_stores.is_public = true 
            AND creator_stores.is_store_open = true
        )
    );

CREATE POLICY "Store owners can manage their services" ON store_services
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM creator_stores 
            WHERE creator_stores.id = store_services.store_id 
            AND creator_stores.user_id = auth.uid()
        )
    );

-- ==============================================
-- 6. PERFORMANCE INDEXES
-- ==============================================

-- Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saves_user_id ON saves(user_id);
CREATE INDEX IF NOT EXISTS idx_saves_zippclip_id ON saves(zippclip_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_content_type ON reports(content_type);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker_id ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_id ON blocked_users(blocked_id);
CREATE INDEX IF NOT EXISTS idx_drafts_user_id ON drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_stores_user_id ON creator_stores(user_id);
CREATE INDEX IF NOT EXISTS idx_store_products_store_id ON store_products(store_id);
CREATE INDEX IF NOT EXISTS idx_store_services_store_id ON store_services(store_id);

-- ==============================================
-- 7. UPDATE TRIGGERS
-- ==============================================

-- Function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updating timestamps
CREATE TRIGGER update_drafts_updated_at BEFORE UPDATE ON drafts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creator_stores_updated_at BEFORE UPDATE ON creator_stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_products_updated_at BEFORE UPDATE ON store_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_services_updated_at BEFORE UPDATE ON store_services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- MIGRATION COMPLETE
-- ==============================================

-- Success message
SELECT 'All migrations applied successfully!' as status;
