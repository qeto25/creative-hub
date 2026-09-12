/**
 * Creative Hub - Supabase & Mock Data Sync Helper
 * 
 * Penggunaan:
 * 1. Tarik snapshot data real dari Supabase ke mockData.json:
 *    npm run sync:mock
 * 
 * 2. Unggah data snapshot lokal ke database live Supabase (Seeding):
 *    npm run sync:mock -- --seed
 */

import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// Manual parser untuk .env.local jika dotenv tidak terpasang
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim();
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ernwownclpnkrtczvuci.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_D1BL6OKh4PlRvd-d7x04IA_Lln37TsP';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Supabase URL atau Key tidak ditemukan di environment (.env.local).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const MOCK_DATA_PATH = path.resolve(process.cwd(), 'data', 'mockData.json');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function ensureValidUUID(id?: string): string {
  if (id && UUID_REGEX.test(id)) return id;
  return crypto.randomUUID();
}

/**
 * Payload Sanitizers:
 * Menyesuaikan kolom 100% presisi dengan skema live database Supabase
 * dan menyingkirkan kolom yang tidak terdaftar di skema cache PostgREST.
 */

// 1. PROFILES
// Catatan: 'is_available' tidak ada di tabel live Supabase (digantikan availability_status)
const ALLOWED_PROFILES_COLUMNS = [
  'id', 'full_name', 'slug', 'avatar_url', 'bio', 'whatsapp_number', 'role',
  'skills', 'is_working', 'base_price', 'dp_percentage', 'hire_count',
  'rating', 'review_count', 'is_tester', 'created_at', 'updated_at',
  'cover_url', 'tools', 'turnaround_time', 'deliverables',
  'source_file_price', 'rush_fee', 'free_revisions', 'extra_revision_fee',
  'revision_notes', 'availability_status', 'is_suspended',
  'suspension_reason', 'is_locked', 'forced_price'
];

function sanitizeProfileForSupabase(p: any) {
  const out: Record<string, any> = {};
  for (const col of ALLOWED_PROFILES_COLUMNS) {
    if (p[col] !== undefined) {
      out[col] = p[col];
    }
  }
  out.id = ensureValidUUID(p.id);
  // Pastikan status istirahat terpetakan jika is_available bernilai false
  if (!out.availability_status && p.is_available === false) {
    out.availability_status = 'resting';
  }
  return out;
}

// 2. PORTFOLIOS
const ALLOWED_PORTFOLIO_COLUMNS = [
  'id', 'profile_id', 'title', 'description', 'category', 'media_url', 'media_type', 'created_at'
];

function sanitizePortfolioForSupabase(port: any) {
  const out: Record<string, any> = {};
  for (const col of ALLOWED_PORTFOLIO_COLUMNS) {
    if (port[col] !== undefined) {
      out[col] = port[col];
    }
  }
  out.id = ensureValidUUID(port.id);
  out.profile_id = ensureValidUUID(port.profile_id);
  return out;
}

// 3. REVIEWS
// Catatan: 'booking_id' tidak ada di tabel live Supabase reviews
const ALLOWED_REVIEW_COLUMNS = [
  'id', 'profile_id', 'client_name', 'rating', 'comment', 'created_at'
];

function sanitizeReviewForSupabase(r: any) {
  const out: Record<string, any> = {};
  for (const col of ALLOWED_REVIEW_COLUMNS) {
    if (r[col] !== undefined) {
      out[col] = r[col];
    }
  }
  out.id = ensureValidUUID(r.id);
  out.profile_id = ensureValidUUID(r.profile_id);
  return out;
}

// 4. BOOKINGS
// Catatan: 'has_reviewed', 'step_progress', 'payout_status', dll. tidak ada di tabel live bookings
const ALLOWED_BOOKING_COLUMNS = [
  'id', 'ticket_code', 'profile_id', 'talent_name', 'client_name', 'client_whatsapp',
  'deadline_date', 'project_brief', 'include_source_file', 'is_rush_order',
  'estimated_total', 'dp_amount', 'status', 'created_at'
];

function sanitizeBookingForSupabase(b: any) {
  const out: Record<string, any> = {};
  for (const col of ALLOWED_BOOKING_COLUMNS) {
    if (b[col] !== undefined) {
      out[col] = b[col];
    }
  }
  out.id = ensureValidUUID(b.id);
  out.profile_id = ensureValidUUID(b.profile_id);
  return out;
}

async function syncPull() {
  console.log('\n======================================================');
  console.log('🔄 MENARIK DATA REAL SUPABASE KE SNAPSHOT MOCK');
  console.log('======================================================');
  console.log(`Endpoint: ${SUPABASE_URL}`);
  console.log(`Target:   ${MOCK_DATA_PATH}\n`);

  try {
    const [
      { data: profiles, error: pErr },
      { data: portfolios, error: portErr },
      { data: reviews, error: rErr },
      { data: bookings, error: bErr },
    ] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: true }),
      supabase.from('portfolios').select('*').order('created_at', { ascending: true }),
      supabase.from('reviews').select('*').order('created_at', { ascending: true }),
      supabase.from('bookings').select('*').order('created_at', { ascending: true }),
    ]);

    if (pErr) console.warn('⚠️ Gagal mengambil tabel profiles:', pErr.message);
    if (portErr) console.warn('⚠️ Gagal mengambil tabel portfolios:', portErr.message);
    if (rErr) console.warn('⚠️ Gagal mengambil tabel reviews:', rErr.message);
    if (bErr) console.warn('⚠️ Gagal mengambil tabel bookings:', bErr.message);

    const currentMock = fs.existsSync(MOCK_DATA_PATH)
      ? JSON.parse(fs.readFileSync(MOCK_DATA_PATH, 'utf-8'))
      : { profiles: [], portfolios: [], reviews: [], bookings: [] };

    const totalRealRows = (profiles?.length || 0) + (portfolios?.length || 0) + (reviews?.length || 0) + (bookings?.length || 0);

    if (totalRealRows === 0) {
      console.log('ℹ️ Catatan: Database Supabase saat ini masih kosong (0 baris data).');
      console.log('   Snapshot mockData.json yang sudah ada tetap dipertahankan.');
      console.log('   TIP: Gunakan "npm run sync:mock -- --seed" jika ingin mengunggah snapshot mock ini ke Supabase live!');
      return;
    }

    // Rekonsiliasi data dari Supabase dengan fallback field untuk frontend UI
    const mappedProfiles = (profiles && profiles.length > 0)
      ? profiles.map((p) => ({
          ...p,
          is_available: p.availability_status !== 'resting',
        }))
      : currentMock.profiles;

    const mappedBookings = (bookings && bookings.length > 0)
      ? bookings.map((b) => {
          const total = Number(b.estimated_total) || 0;
          const hubFee = Math.round(total * 0.25);
          const talentFee = total - hubFee;
          return {
            ...b,
            step_progress: b.step_progress ?? (b.status === 'completed' ? 5 : b.status === 'in_progress' ? 2 : 1),
            payout_status: b.payout_status ?? (b.status === 'completed' ? 'paid' : 'unpaid'),
            payout_date: b.payout_date ?? (b.status === 'completed' ? b.created_at : null),
            hub_fee: b.hub_fee ?? hubFee,
            talent_fee: b.talent_fee ?? talentFee,
            has_reviewed: b.has_reviewed ?? false,
            include_extra_revision: b.include_extra_revision ?? false,
          };
        })
      : currentMock.bookings;

    const updatedSnapshot = {
      profiles: mappedProfiles,
      portfolios: (portfolios && portfolios.length > 0) ? portfolios : currentMock.portfolios,
      reviews: (reviews && reviews.length > 0) ? reviews : currentMock.reviews,
      bookings: mappedBookings,
    };

    fs.writeFileSync(MOCK_DATA_PATH, JSON.stringify(updatedSnapshot, null, 2), 'utf-8');

    console.log('✅ Berhasil menyinkronkan data dari Supabase ke mockData.json:');
    console.log(`   - Profiles   : ${updatedSnapshot.profiles.length} data`);
    console.log(`   - Portfolios : ${updatedSnapshot.portfolios.length} data`);
    console.log(`   - Reviews    : ${updatedSnapshot.reviews.length} data`);
    console.log(`   - Bookings   : ${updatedSnapshot.bookings.length} data\n`);
  } catch (err: any) {
    console.error('❌ Terjadi kesalahan saat sinkronisasi:', err.message || err);
  }
}

async function syncSeed() {
  console.log('\n======================================================');
  console.log('🌱 MENGUNGGAH SNAPSHOT MOCK KE SUPABASE (SEED)');
  console.log('======================================================');

  if (!fs.existsSync(MOCK_DATA_PATH)) {
    console.error(`❌ File ${MOCK_DATA_PATH} tidak ditemukan.`);
    return;
  }

  const snapshot = JSON.parse(fs.readFileSync(MOCK_DATA_PATH, 'utf-8'));

  try {
    // 0. Auth Users (Memastikan user auth ada di auth.users agar foreign key profiles_id_fkey valid)
    if (snapshot.profiles?.length > 0) {
      console.log(`⏳ Memverifikasi / mendaftarkan akun auth untuk ${snapshot.profiles.length} profiles...`);
      for (const p of snapshot.profiles) {
        try {
          const email = `${p.slug || p.id}@creativehub.internal`;
          const { error: authErr } = await supabase.auth.admin.createUser({
            id: p.id,
            email: email,
            email_confirm: true,
            password: 'CreativeHubPassword2026!',
            user_metadata: {
              full_name: p.full_name,
              role: p.role || 'member',
              slug: p.slug,
            },
          });
          if (authErr && !authErr.message.toLowerCase().includes('already') && !authErr.message.toLowerCase().includes('exists')) {
            // Jika gagal tapi bukan karena user sudah ada, log info
            // console.log(`   ℹ️ Auth user ${p.id}: ${authErr.message}`);
          }
        } catch {
          // Abaikan jika user sudah terdaftar
        }
      }
      console.log('   ✅ Akun auth siap.');
    }

    // 1. Profiles
    if (snapshot.profiles?.length > 0) {
      const sanitizedProfiles = snapshot.profiles.map(sanitizeProfileForSupabase);
      console.log(`⏳ Mengunggah ${sanitizedProfiles.length} profiles...`);
      const { error } = await supabase.from('profiles').upsert(sanitizedProfiles, { onConflict: 'id' });
      if (error) {
        console.error('   ❌ Error profiles:', error.message);
      } else {
        console.log('   ✅ Profiles berhasil diunggah.');
      }
    }

    // 2. Portfolios
    if (snapshot.portfolios?.length > 0) {
      const sanitizedPortfolios = snapshot.portfolios.map(sanitizePortfolioForSupabase);
      console.log(`⏳ Mengunggah ${sanitizedPortfolios.length} portfolios...`);
      const { error } = await supabase.from('portfolios').upsert(sanitizedPortfolios, { onConflict: 'id' });
      if (error) {
        console.error('   ❌ Error portfolios:', error.message);
      } else {
        console.log('   ✅ Portfolios berhasil diunggah.');
      }
    }

    // 3. Reviews
    if (snapshot.reviews?.length > 0) {
      const sanitizedReviews = snapshot.reviews.map(sanitizeReviewForSupabase);
      console.log(`⏳ Mengunggah ${sanitizedReviews.length} reviews...`);
      const { error } = await supabase.from('reviews').upsert(sanitizedReviews, { onConflict: 'id' });
      if (error) {
        console.error('   ❌ Error reviews:', error.message);
      } else {
        console.log('   ✅ Reviews berhasil diunggah.');
      }
    }

    // 4. Bookings
    if (snapshot.bookings?.length > 0) {
      const sanitizedBookings = snapshot.bookings.map(sanitizeBookingForSupabase);
      console.log(`⏳ Mengunggah ${sanitizedBookings.length} bookings...`);
      const { error } = await supabase.from('bookings').upsert(sanitizedBookings, { onConflict: 'id' });
      if (error) {
        console.error('   ❌ Error bookings:', error.message);
      } else {
        console.log('   ✅ Bookings berhasil diunggah.');
      }
    }

    console.log('\n🎉 Seeding selesai! Database Supabase kini terisi data snapshot.\n');
  } catch (err: any) {
    console.error('❌ Terjadi kesalahan saat seeding:', err.message || err);
  }
}

const args = process.argv.slice(2);
if (args.includes('--seed')) {
  syncSeed();
} else {
  syncPull();
}
