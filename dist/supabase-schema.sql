-- =========================================================================
-- Supabase Database Schema for Sayali Banode Makeup Artist
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard)
-- =========================================================================

-- 1. APPOINTMENTS TABLE (Leads & Bookings)
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    event_date DATE NOT NULL,
    service TEXT NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Completed', 'Cancelled')),
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PORTFOLIO TABLE (Gallery Looks)
CREATE TABLE IF NOT EXISTS public.portfolio (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('bridal', 'reception', 'party', 'editorial', 'glam')),
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SERVICES TABLE (Bridal & Makeup Offerings)
CREATE TABLE IF NOT EXISTS public.services (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    icon TEXT DEFAULT '✨',
    description TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TESTIMONIALS / REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.testimonials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    rating INT DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    emoji TEXT DEFAULT '👰',
    text TEXT NOT NULL,
    status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BLOCKED DATES TABLE (Wedding Bookings & Leave)
CREATE TABLE IF NOT EXISTS public.blocked_dates (
    id SERIAL PRIMARY KEY,
    date_str DATE UNIQUE NOT NULL,
    reason TEXT DEFAULT 'Booked',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SITE SETTINGS TABLE (Artist info, bio, social links, contact)
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ POLICIES (Website Visitors)
CREATE POLICY "Public can view portfolio" ON public.portfolio FOR SELECT USING (true);
CREATE POLICY "Public can view services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Public can view approved testimonials" ON public.testimonials FOR SELECT USING (status = 'approved');
CREATE POLICY "Public can view blocked dates" ON public.blocked_dates FOR SELECT USING (true);
CREATE POLICY "Public can view settings" ON public.settings FOR SELECT USING (true);

-- PUBLIC INSERT POLICIES (Brides booking & leaving reviews)
CREATE POLICY "Public can submit appointments" ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can submit testimonials" ON public.testimonials FOR INSERT WITH CHECK (true);

-- FULL ACCESS FOR AUTHENTICATED / ANON ACCESS WITH KEY
-- (Allows Admin panel to read appointments, update status, and manage content)
CREATE POLICY "Full access for appointments" ON public.appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access for portfolio" ON public.portfolio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access for services" ON public.services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access for testimonials" ON public.testimonials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access for blocked_dates" ON public.blocked_dates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access for settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);

-- =========================================================================
-- INITIAL SEED DATA
-- =========================================================================

-- Seed Services
INSERT INTO public.services (id, title, icon, description, sort_order) VALUES
('s1', 'Bridal Makeup', '👰', 'Stunning, long-lasting bridal looks that make your special day unforgettable.', 1),
('s2', 'Engagement Makeup', '💍', 'Elegant and sophisticated looks for your engagement ceremony.', 2),
('s3', 'Reception Makeup', '✨', 'Glamorous makeup that photographs beautifully for your reception.', 3),
('s4', 'Party Makeup', '🎉', 'Bold and beautiful looks for parties and special occasions.', 4),
('s5', 'HD Makeup', '📸', 'Camera-ready, flawless makeup perfect for photography and videography.', 5),
('s6', 'Airbrush Makeup', '🎨', 'Lightweight, flawless finish that lasts all day and night.', 6),
('s7', 'Editorial Makeup', '📷', 'Creative, artistic looks for fashion shoots and editorials.', 7),
('s8', 'Fashion Shoot', '👗', 'High-fashion makeup for professional modeling and shoots.', 8),
('s9', 'Hair Styling', '💇', 'Professional hair styling to complete your perfect look.', 9)
ON CONFLICT (id) DO NOTHING;

-- Seed Portfolio
INSERT INTO public.portfolio (id, title, category, url) VALUES
('p1', 'Bridal Elegance', 'bridal', 'https://images.unsplash.com/photo-1684868265714-fd2300637c23'),
('p2', 'Traditional Bridal', 'bridal', 'https://images.unsplash.com/photo-1684868268327-7e5590bcfbd6'),
('p3', 'Classic Bridal', 'bridal', 'https://images.pexels.com/photos/30809480/pexels-photo-30809480.jpeg'),
('p4', 'Reception Glam', 'reception', 'https://images.pexels.com/photos/34955448/pexels-photo-34955448.jpeg'),
('p5', 'Party Glam', 'party', 'https://images.pexels.com/photos/5394050/pexels-photo-5394050.jpeg'),
('p6', 'Editorial Beauty', 'editorial', 'https://images.unsplash.com/photo-1548112129-b5cf67e9558d'),
('p7', 'Fashion Editorial', 'editorial', 'https://images.pexels.com/photos/31845455/pexels-photo-31845455.jpeg'),
('p8', 'Glamorous Look', 'glam', 'https://images.pexels.com/photos/5149734/pexels-photo-5149734.jpeg')
ON CONFLICT (id) DO NOTHING;

-- Seed Testimonials
INSERT INTO public.testimonials (id, name, rating, emoji, text, status, date) VALUES
('t1', 'Priya Sharma', 5, '👰', 'Sayali made me look absolutely stunning on my wedding day! Her attention to detail and professionalism is unmatched. Highly recommended!', 'approved', '2026-09-15'),
('t2', 'Ananya Patel', 5, '💕', 'Best makeup artist in Mumbai! My makeup stayed flawless throughout my reception. Thank you Sayali for making me feel so beautiful!', 'approved', '2026-09-20'),
('t3', 'Neha Desai', 5, '✨', 'I was so impressed with Sayali''s work. She understood exactly what I wanted and delivered beyond my expectations. Absolutely loved it!', 'approved', '2026-09-28'),
('t4', 'Kavya Reddy', 5, '👑', 'Sayali is a true artist! She made me look like a princess on my special day. Her skills and friendly nature make her the best choice!', 'approved', '2026-10-01')
ON CONFLICT (id) DO NOTHING;

-- Seed Settings
INSERT INTO public.settings (key, value) VALUES
('business', '{
  "siteTitle": "Sayali Banode Makeup Artist",
  "artistName": "Sayali Banode",
  "phone": "+91 7030477747",
  "whatsapp": "917030477747",
  "email": "sayali@example.com",
  "location": "Mumbai, Maharashtra",
  "instagram": "https://instagram.com/sayalibanodemakeup",
  "facebook": "https://facebook.com",
  "adminPassword": "admin",
  "experienceYears": "5+",
  "happyBrides": "500+"
}'::jsonb)
ON CONFLICT (key) DO NOTHING;
