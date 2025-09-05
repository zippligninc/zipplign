-- Final Database Migrations for Zipplign
-- Run this script in Supabase SQL Editor to complete all database setup

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create views column for zippclips if it doesn't exist
ALTER TABLE zippclips ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Create index for views
CREATE INDEX IF NOT EXISTS idx_zippclips_views ON zippclips(views DESC);

-- Create saves table for save functionality
CREATE TABLE IF NOT EXISTS saves (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  zippclip_id uuid REFERENCES zippclips(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, zippclip_id)
);

-- Enable RLS for saves
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for saves
DROP POLICY IF EXISTS "Users can view their own saves" ON saves;
CREATE POLICY "Users can view their own saves" ON saves
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create saves" ON saves;
CREATE POLICY "Users can create saves" ON saves
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own saves" ON saves;
CREATE POLICY "Users can delete their own saves" ON saves
  FOR DELETE USING (user_id = auth.uid());

-- Create drafts table for draft functionality
CREATE TABLE IF NOT EXISTS drafts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text,
  description text,
  media_url text,
  media_type text CHECK (media_type IN ('image', 'video')),
  song text,
  song_avatar_url text,
  filters_applied jsonb,
  effects_applied jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for drafts
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for drafts
DROP POLICY IF EXISTS "Users can view their own drafts" ON drafts;
CREATE POLICY "Users can view their own drafts" ON drafts
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create drafts" ON drafts;
CREATE POLICY "Users can create drafts" ON drafts
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own drafts" ON drafts;
CREATE POLICY "Users can update their own drafts" ON drafts
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own drafts" ON drafts;
CREATE POLICY "Users can delete their own drafts" ON drafts
  FOR DELETE USING (user_id = auth.uid());

-- Create creator_stores table
CREATE TABLE IF NOT EXISTS creator_stores (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  business_name text NOT NULL,
  business_type text CHECK (business_type IN ('individual', 'business')) DEFAULT 'individual',
  description text,
  address text,
  email text,
  phone_number text,
  is_public boolean DEFAULT true,
  is_store_open boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Create store_products table
CREATE TABLE IF NOT EXISTS store_products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id uuid REFERENCES creator_stores(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  category text,
  image_url text,
  stock_quantity integer DEFAULT 0,
  is_available boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create store_services table
CREATE TABLE IF NOT EXISTS store_services (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id uuid REFERENCES creator_stores(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  category text,
  image_url text,
  duration_minutes integer,
  is_available boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for creator stores
ALTER TABLE creator_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_services ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for creator stores
DROP POLICY IF EXISTS "Public stores are viewable by everyone" ON creator_stores;
CREATE POLICY "Public stores are viewable by everyone" ON creator_stores
  FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "Users can manage their own stores" ON creator_stores;
CREATE POLICY "Users can manage their own stores" ON creator_stores
  FOR ALL USING (user_id = auth.uid());

-- Create RLS policies for store products
DROP POLICY IF EXISTS "Products are viewable for public stores" ON store_products;
CREATE POLICY "Products are viewable for public stores" ON store_products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM creator_stores 
      WHERE creator_stores.id = store_products.store_id 
      AND creator_stores.is_public = true 
      AND creator_stores.is_store_open = true
    )
  );

DROP POLICY IF EXISTS "Store owners can manage their products" ON store_products;
CREATE POLICY "Store owners can manage their products" ON store_products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM creator_stores 
      WHERE creator_stores.id = store_products.store_id 
      AND creator_stores.user_id = auth.uid()
    )
  );

-- Create RLS policies for store services
DROP POLICY IF EXISTS "Services are viewable for public stores" ON store_services;
CREATE POLICY "Services are viewable for public stores" ON store_services
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM creator_stores 
      WHERE creator_stores.id = store_services.store_id 
      AND creator_stores.is_public = true 
      AND creator_stores.is_store_open = true
    )
  );

DROP POLICY IF EXISTS "Store owners can manage their services" ON store_services;
CREATE POLICY "Store owners can manage their services" ON store_services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM creator_stores 
      WHERE creator_stores.id = store_services.store_id 
      AND creator_stores.user_id = auth.uid()
    )
  );

-- Create function to increment views
CREATE OR REPLACE FUNCTION increment_zippclip_views(zippclip_id uuid)
RETURNS INTEGER AS $$
DECLARE
  current_views INTEGER;
BEGIN
  -- Get current views
  SELECT views INTO current_views FROM zippclips WHERE id = zippclip_id;
  
  -- Increment views
  UPDATE zippclips SET views = COALESCE(views, 0) + 1 WHERE id = zippclip_id;
  
  -- Return new view count
  SELECT views INTO current_views FROM zippclips WHERE id = zippclip_id;
  RETURN COALESCE(current_views, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION increment_zippclip_views(uuid) TO authenticated;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_drafts_updated_at ON drafts;
CREATE TRIGGER update_drafts_updated_at
  BEFORE UPDATE ON drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_creator_stores_updated_at ON creator_stores;
CREATE TRIGGER update_creator_stores_updated_at
  BEFORE UPDATE ON creator_stores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_store_products_updated_at ON store_products;
CREATE TRIGGER update_store_products_updated_at
  BEFORE UPDATE ON store_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_store_services_updated_at ON store_services;
CREATE TRIGGER update_store_services_updated_at
  BEFORE UPDATE ON store_services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saves_user_id ON saves(user_id);
CREATE INDEX IF NOT EXISTS idx_saves_zippclip_id ON saves(zippclip_id);
CREATE INDEX IF NOT EXISTS idx_drafts_user_id ON drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_stores_user_id ON creator_stores(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_stores_public ON creator_stores(is_public, is_store_open);
CREATE INDEX IF NOT EXISTS idx_store_products_store_id ON store_products(store_id);
CREATE INDEX IF NOT EXISTS idx_store_services_store_id ON store_services(store_id);

-- Insert sample data for testing
INSERT INTO creator_stores (user_id, business_name, business_type, description, is_public, is_store_open)
SELECT 
  p.id,
  'Sample Store ' || p.username,
  'individual',
  'Welcome to my store!',
  true,
  true
FROM profiles p
WHERE p.username IS NOT NULL
LIMIT 3
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample products
INSERT INTO store_products (store_id, name, description, price, category, is_available)
SELECT 
  cs.id,
  'Sample Product ' || row_number() OVER (PARTITION BY cs.id),
  'This is a sample product description',
  19.99,
  'general',
  true
FROM creator_stores cs
LIMIT 5
ON CONFLICT DO NOTHING;

-- Insert sample services
INSERT INTO store_services (store_id, name, description, price, category, duration_minutes, is_available)
SELECT 
  cs.id,
  'Sample Service ' || row_number() OVER (PARTITION BY cs.id),
  'This is a sample service description',
  49.99,
  'consultation',
  60,
  true
FROM creator_stores cs
LIMIT 3
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Database migrations completed successfully!' as status;
