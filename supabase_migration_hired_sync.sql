-- ==============================================================================
-- CREATIVE HUB - SUPABASE MIGRATION: HIRED COUNT & PAYOUT PERSISTENCE
-- ==============================================================================

-- 1. Tambahkan kolom pendukung alur kerja dan keuangan ke tabel bookings
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS step_progress INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS payout_status TEXT DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS payout_date TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS hub_fee NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS talent_fee NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS has_reviewed BOOLEAN DEFAULT FALSE;

-- 2. Buat index untuk performa pencarian status & profile_id
CREATE INDEX IF NOT EXISTS idx_bookings_profile_id_status 
ON public.bookings (profile_id, status);

-- 3. Function & Trigger Idempoten: Sinkronisasi profiles.hire_count secara otomatis
CREATE OR REPLACE FUNCTION public.sync_talent_hire_count()
RETURNS TRIGGER AS $$
DECLARE
    target_profile_id UUID;
BEGIN
    -- Tangani profile_id baru (INSERT / UPDATE)
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        target_profile_id := NEW.profile_id;
        IF target_profile_id IS NOT NULL THEN
            UPDATE public.profiles
            SET hire_count = (
                SELECT COUNT(*)::integer
                FROM public.bookings
                WHERE profile_id = target_profile_id
                  AND (status = 'completed' OR status ILIKE '%selesai%')
            ),
            updated_at = NOW()
            WHERE id = target_profile_id;
        END IF;
    END IF;

    -- Tangani profile_id lama jika terjadi DELETE atau pergantian talent saat UPDATE
    IF (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.profile_id IS DISTINCT FROM NEW.profile_id)) THEN
        target_profile_id := OLD.profile_id;
        IF target_profile_id IS NOT NULL THEN
            UPDATE public.profiles
            SET hire_count = (
                SELECT COUNT(*)::integer
                FROM public.bookings
                WHERE profile_id = target_profile_id
                  AND (status = 'completed' OR status ILIKE '%selesai%')
            ),
            updated_at = NOW()
            WHERE id = target_profile_id;
        END IF;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pasang trigger pada tabel bookings
DROP TRIGGER IF EXISTS trigger_sync_talent_hire_count ON public.bookings;
CREATE TRIGGER trigger_sync_talent_hire_count
AFTER INSERT OR UPDATE OR DELETE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.sync_talent_hire_count();

-- 4. View Agregat Publik yang Aman untuk Menghitung Order Selesai
CREATE OR REPLACE VIEW public.talent_hired_counts WITH (security_invoker = false) AS
SELECT 
    b.profile_id,
    COUNT(*)::integer AS completed_count
FROM public.bookings b
WHERE (b.status = 'completed' OR b.status ILIKE '%selesai%')
  AND b.profile_id IS NOT NULL
GROUP BY b.profile_id;

GRANT SELECT ON public.talent_hired_counts TO anon, authenticated, service_role;

-- 5. Pastikan ketiga tiket order untuk talent asep tersimpan sebagai 'completed' & 'paid'
UPDATE public.bookings
SET status = 'completed',
    step_progress = 5,
    payout_status = 'paid',
    payout_date = COALESCE(payout_date, NOW())
WHERE ticket_code IN ('#CH-2609-2238', '#CH-2609-5158', '#CH-2609-5642');

-- 6. Jalankan sinkronisasi hitungan hire_count satu kali untuk seluruh profil yang ada
UPDATE public.profiles p
SET hire_count = COALESCE((
    SELECT COUNT(*)::integer
    FROM public.bookings b
    WHERE b.profile_id = p.id
      AND (b.status = 'completed' OR b.status ILIKE '%selesai%')
), 0),
updated_at = NOW();
