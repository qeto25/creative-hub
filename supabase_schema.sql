-- ==============================================================================
-- CREATIVE HUB SUPABASE DATABASE SCHEMA, STORAGE, & RLS POLICIES
-- ==============================================================================

-- 1. Ekstensi UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    whatsapp_number TEXT DEFAULT '6281234567890',
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
    skills TEXT[] DEFAULT '{}',
    is_working BOOLEAN DEFAULT FALSE,
    base_price NUMERIC DEFAULT 0,
    dp_percentage INTEGER DEFAULT 30 CHECK (dp_percentage >= 0 AND dp_percentage <= 100),
    hire_count INTEGER DEFAULT 0,
    rating NUMERIC DEFAULT 5.0,
    review_count INTEGER DEFAULT 0,
    is_tester BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL PORTFOLIOS
CREATE TABLE IF NOT EXISTS public.portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- e.g. 'PPT Specialist', 'Video Editor', 'Fotografi', 'UI Designer'
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'embed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL REVIEWS (Client Review System)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    client_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. FUNCTION & TRIGGER: RECALCULATE RATING & REVIEW_COUNT DI PROFILES
CREATE OR REPLACE FUNCTION public.recalculate_profile_rating()
RETURNS TRIGGER AS $$
DECLARE
    target_id UUID;
    new_avg NUMERIC;
    new_count INTEGER;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_id := OLD.profile_id;
    ELSE
        target_id := NEW.profile_id;
    END IF;

    SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 5.0), COUNT(id)
    INTO new_avg, new_count
    FROM public.reviews
    WHERE profile_id = target_id;

    UPDATE public.profiles
    SET rating = new_avg,
        review_count = new_count,
        updated_at = NOW()
    WHERE id = target_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_recalculate_rating ON public.reviews;
CREATE TRIGGER trigger_recalculate_rating
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.recalculate_profile_rating();

-- 6. FUNCTION & TRIGGER: AUTO INSERT PROFILE SAAT USER SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        full_name,
        slug,
        avatar_url,
        role,
        skills,
        is_working,
        base_price,
        dp_percentage,
        is_tester
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Creative Member'),
        COALESCE(NEW.raw_user_meta_data->>'slug', 'member-' || SUBSTRING(NEW.id::text, 1, 8)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'member'),
        ARRAY['Creative Talent'],
        FALSE,
        COALESCE((NEW.raw_user_meta_data->>'base_price')::numeric, 500000),
        COALESCE((NEW.raw_user_meta_data->>'dp_percentage')::integer, 30),
        COALESCE((NEW.raw_user_meta_data->>'is_tester')::boolean, FALSE)
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Helper function: Memeriksa apakah current user adalah Owner
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'owner'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. POLICIES UNTUK TABEL PROFILES
-- Public & Member dapat melihat profile yang BUKAN tester, atau Owner bisa melihat SEMUA profile (termasuk tester)
DROP POLICY IF EXISTS "Profiles are readable by everyone or owner" ON public.profiles;
CREATE POLICY "Profiles are readable by everyone or owner"
ON public.profiles FOR SELECT
USING (
    is_tester = FALSE 
    OR auth.uid() = id 
    OR public.is_owner()
);

-- Member hanya boleh mengupdate profil miliknya sendiri (kecuali role & is_tester)
DROP POLICY IF EXISTS "Members can update their own profile" ON public.profiles;
CREATE POLICY "Members can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Owner memiliki wewenang penuh (SELECT, INSERT, UPDATE, DELETE) di tabel profiles
DROP POLICY IF EXISTS "Owner has full access on profiles" ON public.profiles;
CREATE POLICY "Owner has full access on profiles"
ON public.profiles FOR ALL
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- 9. POLICIES UNTUK TABEL PORTFOLIOS
-- Publik dapat melihat portofolio milik profile yang aktif
DROP POLICY IF EXISTS "Portfolios are viewable by public" ON public.portfolios;
CREATE POLICY "Portfolios are viewable by public"
ON public.portfolios FOR SELECT
USING (TRUE);

-- Member dapat menambah, mengedit, menghapus portofolio miliknya sendiri
DROP POLICY IF EXISTS "Members can manage their own portfolios" ON public.portfolios;
CREATE POLICY "Members can manage their own portfolios"
ON public.portfolios FOR ALL
USING (auth.uid() = profile_id OR public.is_owner())
WITH CHECK (auth.uid() = profile_id OR public.is_owner());

-- 10. POLICIES UNTUK TABEL REVIEWS
-- Siapapun dapat melihat review
DROP POLICY IF EXISTS "Reviews are viewable by public" ON public.reviews;
CREATE POLICY "Reviews are viewable by public"
ON public.reviews FOR SELECT
USING (TRUE);

-- Pengunjung / Klien dapat menambahkan review baru
DROP POLICY IF EXISTS "Public can insert reviews" ON public.reviews;
CREATE POLICY "Public can insert reviews"
ON public.reviews FOR INSERT
WITH CHECK (TRUE);

-- 11. SETUP SUPABASE STORAGE BUCKET 'portfolio-assets'
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-assets', 'portfolio-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policy: Public Read
DROP POLICY IF EXISTS "Public can view portfolio assets" ON storage.objects;
CREATE POLICY "Public can view portfolio assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolio-assets');

-- Storage Policy: Authenticated User can upload to their own folder
DROP POLICY IF EXISTS "Authenticated users can upload assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload assets"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'portfolio-assets'
    AND auth.role() = 'authenticated'
);

-- Storage Policy: Users can update/delete their own assets
DROP POLICY IF EXISTS "Users can update their own assets" ON storage.objects;
CREATE POLICY "Users can update their own assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'portfolio-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own assets" ON storage.objects;
CREATE POLICY "Users can delete their own assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'portfolio-assets' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_owner()));

-- 12. EXTENSIONS & BOOKING SYSTEM MIGRATION (ARCHITECTURAL UPDATE)
-- 12.1. Pastikan kolom pendukung di tabel profiles lengkap dengan default tarif pelajar:
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cover_url TEXT,
ADD COLUMN IF NOT EXISTS tools TEXT[] DEFAULT '{"Canva", "CapCut", "PowerPoint"}',
ADD COLUMN IF NOT EXISTS turnaround_time TEXT DEFAULT '2-3 Hari Kerja',
ADD COLUMN IF NOT EXISTS deliverables TEXT[] DEFAULT '{"High-Res JPG/PNG", "PDF"}',
ADD COLUMN IF NOT EXISTS base_price NUMERIC DEFAULT 20000,
ADD COLUMN IF NOT EXISTS dp_percentage NUMERIC DEFAULT 30,
ADD COLUMN IF NOT EXISTS source_file_price NUMERIC DEFAULT 5000,
ADD COLUMN IF NOT EXISTS rush_fee NUMERIC DEFAULT 10000,
ADD COLUMN IF NOT EXISTS free_revisions INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS extra_revision_fee NUMERIC DEFAULT 3000,
ADD COLUMN IF NOT EXISTS revision_notes TEXT DEFAULT '1x revisi minor gratis',
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'available',
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS forced_price INTEGER DEFAULT NULL;

-- 12.2. Buat tabel bookings (Sistem Tiket & Riwayat Order):
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_code TEXT UNIQUE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  talent_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_whatsapp TEXT NOT NULL,
  deadline_date DATE NOT NULL,
  project_brief TEXT NOT NULL,
  include_source_file BOOLEAN DEFAULT FALSE,
  is_rush_order BOOLEAN DEFAULT FALSE,
  estimated_total NUMERIC NOT NULL,
  dp_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_dp' CHECK (status IN ('pending_dp', 'in_progress', 'completed', 'cancelled')),
  has_reviewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pastikan kolom pendukung bagi hasil dan workflow ada di tabel bookings:
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS has_reviewed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS step_progress INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS payout_status TEXT DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS hub_fee NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS talent_fee NUMERIC DEFAULT NULL;

-- 12.3. RLS untuk tabel bookings:
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert bookings" ON public.bookings;
CREATE POLICY "Public insert bookings" 
ON public.bookings FOR INSERT 
WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Public read bookings" ON public.bookings;
CREATE POLICY "Public read bookings"
ON public.bookings FOR SELECT
USING (TRUE);

DROP POLICY IF EXISTS "Owner full access bookings" ON public.bookings;
CREATE POLICY "Owner full access bookings" 
ON public.bookings FOR ALL 
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- 12.4. Buat tabel reviews dengan validasi tiket & RLS:
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pastikan kolom booking_id ada di tabel reviews jika tabel sudah dibuat sebelumnya
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read reviews" ON public.reviews;
CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Insert verified reviews" ON public.reviews;
CREATE POLICY "Insert verified reviews" ON public.reviews FOR INSERT WITH CHECK (TRUE);

-- 13. SPRINT EXPANSIONS: Tracking, File Handover, & Payouts on Bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS final_file_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS step_progress INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS payout_status TEXT DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS payout_date TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS include_extra_revision BOOLEAN DEFAULT FALSE;

-- Publik diizinkan membaca booking untuk pelacakan tiket (/track)
DROP POLICY IF EXISTS "Public can track bookings by ticket code" ON public.bookings;
CREATE POLICY "Public can track bookings by ticket code" 
ON public.bookings FOR SELECT 
USING (TRUE);



