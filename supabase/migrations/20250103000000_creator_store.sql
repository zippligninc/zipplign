-- Creator Store Database Schema
-- Created: Sept 3rd, 2025

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
    is_public BOOLEAN DEFAULT false, -- Only name/business name visible to public
    is_store_open BOOLEAN DEFAULT false, -- Open Creator Store YES or NO
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
    duration_minutes INTEGER, -- Service duration in minutes
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Store Categories
CREATE TABLE IF NOT EXISTS store_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO store_categories (name, description, icon) VALUES
('Fashion', 'Clothing, accessories, and style items', 'shirt'),
('Art & Crafts', 'Handmade items, artwork, and creative products', 'palette'),
('Digital Products', 'Software, templates, and digital downloads', 'download'),
('Food & Beverage', 'Local food items and beverages', 'coffee'),
('Health & Beauty', 'Wellness and beauty products', 'heart'),
('Electronics', 'Tech gadgets and electronic devices', 'smartphone'),
('Home & Garden', 'Home decor and gardening items', 'home'),
('Services', 'Professional and personal services', 'briefcase'),
('Education', 'Courses, tutorials, and educational content', 'book'),
('Entertainment', 'Music, videos, and entertainment content', 'music')
ON CONFLICT (name) DO NOTHING;

-- Store Orders Table
CREATE TABLE IF NOT EXISTS store_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    store_id UUID REFERENCES creator_stores(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')) DEFAULT 'pending',
    shipping_address JSONB,
    payment_method TEXT,
    payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES store_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES store_products(id) ON DELETE CASCADE,
    service_id UUID REFERENCES store_services(id) ON DELETE CASCADE,
    item_type TEXT CHECK (item_type IN ('product', 'service')) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Store Reviews Table
CREATE TABLE IF NOT EXISTS store_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID REFERENCES creator_stores(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES store_orders(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    review_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Store Analytics Table
CREATE TABLE IF NOT EXISTS store_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID REFERENCES creator_stores(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    product_views INTEGER DEFAULT 0,
    service_views INTEGER DEFAULT 0,
    orders_count INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_creator_stores_user_id ON creator_stores(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_stores_is_public ON creator_stores(is_public);
CREATE INDEX IF NOT EXISTS idx_creator_stores_is_store_open ON creator_stores(is_store_open);
CREATE INDEX IF NOT EXISTS idx_store_products_store_id ON store_products(store_id);
CREATE INDEX IF NOT EXISTS idx_store_products_category ON store_products(category);
CREATE INDEX IF NOT EXISTS idx_store_services_store_id ON store_services(store_id);
CREATE INDEX IF NOT EXISTS idx_store_services_category ON store_services(category);
CREATE INDEX IF NOT EXISTS idx_store_orders_buyer_id ON store_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_store_orders_store_id ON store_orders(store_id);
CREATE INDEX IF NOT EXISTS idx_store_reviews_store_id ON store_reviews(store_id);
CREATE INDEX IF NOT EXISTS idx_store_analytics_store_id ON store_analytics(store_id);
CREATE INDEX IF NOT EXISTS idx_store_analytics_date ON store_analytics(date);

-- Row Level Security (RLS) Policies
ALTER TABLE creator_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_analytics ENABLE ROW LEVEL SECURITY;

-- Creator Stores Policies
CREATE POLICY "Users can view public creator stores" ON creator_stores
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can manage their own creator store" ON creator_stores
    FOR ALL USING (auth.uid() = user_id);

-- Store Products Policies
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

-- Store Services Policies
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

-- Store Orders Policies
CREATE POLICY "Users can view their own orders" ON store_orders
    FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Store owners can view orders for their store" ON store_orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM creator_stores 
            WHERE creator_stores.id = store_orders.store_id 
            AND creator_stores.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create orders" ON store_orders
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Store Reviews Policies
CREATE POLICY "Anyone can view reviews for public stores" ON store_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM creator_stores 
            WHERE creator_stores.id = store_reviews.store_id 
            AND creator_stores.is_public = true
        )
    );

CREATE POLICY "Users can create reviews for their purchases" ON store_reviews
    FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Store Analytics Policies
CREATE POLICY "Store owners can view their analytics" ON store_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM creator_stores 
            WHERE creator_stores.id = store_analytics.store_id 
            AND creator_stores.user_id = auth.uid()
        )
    );

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updating timestamps
CREATE TRIGGER update_creator_stores_updated_at BEFORE UPDATE ON creator_stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_products_updated_at BEFORE UPDATE ON store_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_services_updated_at BEFORE UPDATE ON store_services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_orders_updated_at BEFORE UPDATE ON store_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_reviews_updated_at BEFORE UPDATE ON store_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
