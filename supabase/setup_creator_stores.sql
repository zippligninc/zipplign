-- Creator Store Database Setup
-- Run this in Supabase SQL Editor to set up the creator store system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create creator_stores table
CREATE TABLE IF NOT EXISTS creator_stores (
  id uuid not null primary key default uuid_generate_v4(),
  user_id uuid references public.profiles on delete cascade not null,
  business_name text not null,
  business_type text default 'individual' CHECK (business_type IN ('individual', 'business')),
  description text,
  address text,
  email text,
  phone_number text,
  logo_url text,
  store_link text,
  is_public boolean default false,
  is_store_open boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  UNIQUE(user_id) -- One store per user
);

-- Create store_products table
CREATE TABLE IF NOT EXISTS store_products (
  id uuid not null primary key default uuid_generate_v4(),
  store_id uuid references public.creator_stores on delete cascade not null,
  name text not null,
  description text,
  price decimal(10,2),
  image_url text,
  category text default 'product' CHECK (category IN ('product', 'service')),
  is_available boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create store_orders table (for future use)
CREATE TABLE IF NOT EXISTS store_orders (
  id uuid not null primary key default uuid_generate_v4(),
  store_id uuid references public.creator_stores on delete cascade not null,
  customer_id uuid references public.profiles on delete cascade not null,
  product_id uuid references public.store_products on delete cascade not null,
  quantity integer default 1,
  total_amount decimal(10,2) not null,
  status text default 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  customer_info jsonb, -- Store customer contact info
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
ALTER TABLE creator_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for creator_stores
DROP POLICY IF EXISTS "Users can view public stores" ON creator_stores;
CREATE POLICY "Users can view public stores" ON creator_stores
  FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "Users can view their own store" ON creator_stores;
CREATE POLICY "Users can view their own store" ON creator_stores
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own store" ON creator_stores;
CREATE POLICY "Users can create their own store" ON creator_stores
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own store" ON creator_stores;
CREATE POLICY "Users can update their own store" ON creator_stores
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own store" ON creator_stores;
CREATE POLICY "Users can delete their own store" ON creator_stores
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for store_products
DROP POLICY IF EXISTS "Anyone can view products from public stores" ON store_products;
CREATE POLICY "Anyone can view products from public stores" ON store_products
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM creator_stores WHERE is_public = true
    )
  );

DROP POLICY IF EXISTS "Store owners can manage their products" ON store_products;
CREATE POLICY "Store owners can manage their products" ON store_products
  FOR ALL USING (
    store_id IN (
      SELECT id FROM creator_stores WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for store_orders
DROP POLICY IF EXISTS "Users can view their own orders" ON store_orders;
CREATE POLICY "Users can view their own orders" ON store_orders
  FOR SELECT USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Store owners can view orders for their store" ON store_orders;
CREATE POLICY "Store owners can view orders for their store" ON store_orders
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM creator_stores WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create orders" ON store_orders;
CREATE POLICY "Users can create orders" ON store_orders
  FOR INSERT WITH CHECK (customer_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_creator_stores_user_id ON creator_stores(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_stores_is_public ON creator_stores(is_public);
CREATE INDEX IF NOT EXISTS idx_creator_stores_business_name ON creator_stores(business_name);
CREATE INDEX IF NOT EXISTS idx_store_products_store_id ON store_products(store_id);
CREATE INDEX IF NOT EXISTS idx_store_products_category ON store_products(category);
CREATE INDEX IF NOT EXISTS idx_store_orders_store_id ON store_orders(store_id);
CREATE INDEX IF NOT EXISTS idx_store_orders_customer_id ON store_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_store_orders_status ON store_orders(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_creator_stores_updated_at ON creator_stores;
CREATE TRIGGER update_creator_stores_updated_at
  BEFORE UPDATE ON creator_stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_store_products_updated_at ON store_products;
CREATE TRIGGER update_store_products_updated_at
  BEFORE UPDATE ON store_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_store_orders_updated_at ON store_orders;
CREATE TRIGGER update_store_orders_updated_at
  BEFORE UPDATE ON store_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate store link
CREATE OR REPLACE FUNCTION generate_store_link(business_name text)
RETURNS text AS $$
BEGIN
  RETURN 'https://zipplign.vercel.app/store/' || lower(regexp_replace(business_name, '[^a-zA-Z0-9]', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Create function to get store with products count
CREATE OR REPLACE FUNCTION get_store_with_products_count(store_uuid uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  business_name text,
  business_type text,
  description text,
  address text,
  email text,
  phone_number text,
  logo_url text,
  store_link text,
  is_public boolean,
  is_store_open boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  products_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.*,
    COUNT(sp.id) as products_count
  FROM creator_stores cs
  LEFT JOIN store_products sp ON cs.id = sp.store_id AND sp.is_available = true
  WHERE cs.id = store_uuid
  GROUP BY cs.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
