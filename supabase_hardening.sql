-- ==============================================================================
-- CREATIVE HUB — HARDENING PATCH
-- Jalankan di Supabase SQL Editor SETELAH supabase_schema.sql.
-- Idempoten: aman dijalankan berulang.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. BOOKINGS: hentikan kebocoran PII
--    Policy lama "Public can track bookings by ticket code" memakai USING (TRUE)
--    => anon key bisa membaca SELURUH baris: nama klien, nomor WhatsApp, brief,
--    nilai proyek. Diganti dengan RPC yang hanya mengembalikan 1 tiket + kolom aman.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can track bookings by ticket code" ON public.bookings;

CREATE OR REPLACE FUNCTION public.track_booking(p_ticket TEXT)
RETURNS TABLE (
  ticket_code            TEXT,
  talent_name            TEXT,
  client_name            TEXT,
  status                 TEXT,
  deadline_date          DATE,
  project_brief          TEXT,
  include_source_file    BOOLEAN,
  include_extra_revision BOOLEAN,
  is_rush_order          BOOLEAN,
  estimated_total        NUMERIC,
  dp_amount              NUMERIC,
  step_progress          INTEGER,
  created_at             TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.ticket_code, b.talent_name, b.client_name, b.status, b.deadline_date,
         b.project_brief, b.include_source_file, b.include_extra_revision,
         b.is_rush_order, b.estimated_total, b.dp_amount, b.step_progress, b.created_at
  FROM public.bookings b
  WHERE upper(b.ticket_code) = upper(trim(p_ticket))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.track_booking(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_booking(TEXT) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 2. REVIEWS: hanya boleh dari booking yang benar-benar selesai
--    Policy lama WITH CHECK (TRUE) => siapa pun bisa menyuntik review palsu
--    (rating 5 bintang tanpa pernah order).
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Insert verified reviews" ON public.reviews;

CREATE POLICY "Insert verified reviews"
ON public.reviews FOR INSERT
WITH CHECK (
  booking_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = reviews.booking_id
      AND b.status = 'completed'
      AND coalesce(b.has_reviewed, FALSE) = FALSE
  )
);

-- ------------------------------------------------------------------------------
-- 3. STORAGE: upload hanya ke folder milik sendiri
--    Policy lama cuma cek auth.role()='authenticated' => member A bisa menimpa
--    folder member B.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can upload assets" ON storage.objects;

CREATE POLICY "Authenticated users can upload assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'portfolio-assets'
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ------------------------------------------------------------------------------
-- 4. CATATAN: jalankan juga di Dashboard, bukan SQL
--    - Authentication > Signups: matikan "Allow new users to sign up" kalau
--      akun member hanya dibuat owner lewat adminCreateMember.
--    - Storage > portfolio-assets: set file size limit 5 MB + allowed MIME
--      image/jpeg,image/png,image/webp,image/gif.
-- ------------------------------------------------------------------------------