/**
 * Script untuk membuat dan mengaktifkan akun Owner di Supabase Auth & Tabel Profiles
 * Akun:
 * - Email: grown@creativehub.id
 * - Password: password153712 (153712)
 * - Role: owner
 * - Full Name: Owner Grown
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim();
          if (!process.env[key]) process.env[key] = val;
        }
      }
    }
  }
}

loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ernwownclpnkrtczvuci.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env.local!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const OWNER_EMAIL = 'grown@creativehub.id';
const OWNER_PASSWORD = '153712';
const OWNER_NAME = 'Owner Grown';
const OWNER_SLUG = 'owner-grown';

async function createOrUpdateOwner() {
  console.log('\n======================================================');
  console.log('🚀 PROSES PEMBUATAN / UPDATE AKUN OWNER SUPABASE');
  console.log('======================================================');
  console.log(`Endpoint: ${SUPABASE_URL}`);
  console.log(`Email:    ${OWNER_EMAIL}`);
  console.log(`Role:     owner\n`);

  try {
    let userId: string | null = null;

    // 1. Cek apakah user sudah ada di auth
    const { data: usersData, error: listErr } = await supabase.auth.admin.listUsers();
    if (listErr) {
      console.warn('⚠️ Gagal mengambil daftar user auth:', listErr.message);
    }

    const existingUser = usersData?.users?.find((u) => u.email?.toLowerCase() === OWNER_EMAIL.toLowerCase());

    if (existingUser) {
      console.log(`ℹ️ Akun auth ${OWNER_EMAIL} sudah terdaftar (ID: ${existingUser.id}). Mengupdate password & metadata...`);
      userId = existingUser.id;
      const { error: updateErr } = await supabase.auth.admin.updateUserById(userId, {
        password: OWNER_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: OWNER_NAME,
          role: 'owner',
          slug: OWNER_SLUG,
        },
      });

      if (updateErr) {
        console.error('❌ Gagal mengupdate akun auth:', updateErr.message);
        return;
      }
      console.log('✅ Akun auth berhasil diperbarui.');
    } else {
      console.log(`⏳ Membuat akun auth baru untuk ${OWNER_EMAIL}...`);
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: OWNER_EMAIL,
        password: OWNER_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: OWNER_NAME,
          role: 'owner',
          slug: OWNER_SLUG,
        },
      });

      if (createErr || !newUser?.user) {
        console.error('❌ Gagal membuat akun auth:', createErr?.message);
        return;
      }
      userId = newUser.user.id;
      console.log(`✅ Akun auth berhasil dibuat (ID: ${userId}).`);
    }

    // 2. Pastikan tabel profiles terisi dengan profil Owner
    if (userId) {
      console.log(`⏳ Menyinkronkan profil di tabel public.profiles...`);
      const ownerProfile = {
        id: userId,
        full_name: OWNER_NAME,
        slug: OWNER_SLUG,
        role: 'owner',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
        bio: 'Owner & Creative Director of Creative Hub Agency.',
        whatsapp_number: process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || '6285831041464',
        skills: ['Creative Director', 'Project Management', 'Business Strategist'],
        is_working: false,
        base_price: 0,
        dp_percentage: 30,
        hire_count: 0,
        rating: 5.0,
        review_count: 0,
        is_tester: false,
        availability_status: 'available',
        updated_at: new Date().toISOString(),
      };

      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert(ownerProfile, { onConflict: 'id' });

      if (profileErr) {
        console.error('❌ Gagal menyimpan profil owner:', profileErr.message);
      } else {
        console.log('✅ Record tabel public.profiles untuk Owner Grown berhasil di-upsert!');
      }
    }

    console.log('\n🎉 AKUN OWNER AKTIF DAN SIAP DIGUNAKAN!');
    console.log('   Username / Email : grown (atau grown@creativehub.id)');
    console.log('   Password         : 153712');
    console.log('   Role             : owner');
    console.log('   Target Dashboard : /dashboard/owner\n');
  } catch (err: any) {
    console.error('❌ Terjadi error pada skrip create-owner:', err.message || err);
  }
}

createOrUpdateOwner();
