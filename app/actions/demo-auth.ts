'use server';

import { cookies } from 'next/headers';
import { isDemoMode } from '@/lib/config';

export interface DemoSessionData {
  role: 'owner' | 'member';
  user_id: string;
  name: string;
  email: string;
  isDemo: true;
}

/**
 * Server Action khusus login Demo
 * - Hanya aktif jika NEXT_PUBLIC_APP_MODE !== 'live' (isDemoMode() === true)
 * - Menetapkan session berbasis HttpOnly Cookie di server
 * - 100% diblokir jika aplikasi berjalan di mode live
 */
export async function loginDemoAction(role: 'owner' | 'member'): Promise<{
  success: boolean;
  error?: string;
  redirectUrl?: string;
  session?: DemoSessionData;
}> {
  // CRITICAL SECURITY CHECK:
  // Pastikan mekanisme ini benar-benar mati/tidak dapat dipakai saat NEXT_PUBLIC_APP_MODE=live
  if (!isDemoMode()) {
    return {
      success: false,
      error: 'Demo login tidak diizinkan saat aplikasi berjalan dalam mode live.',
    };
  }

  const sessionData: DemoSessionData = {
    role,
    user_id: role === 'owner' ? 'demo-owner-id' : 'demo-member-id',
    name: role === 'owner' ? 'Owner Grown (Demo)' : 'Devan Putra (Demo)',
    email: role === 'owner' ? 'grown@creativehub.id' : 'devan@creativehub.id',
    isDemo: true,
  };

  // Simpan dalam HttpOnly cookie di server (tidak bisa dimanipulasi via script klien)
  const cookieStore = await cookies();
  cookieStore.set('creativehub_demo_session', JSON.stringify(sessionData), {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  });

  const redirectUrl = role === 'owner' ? '/dashboard/owner' : '/dashboard/member';

  return {
    success: true,
    redirectUrl,
    session: sessionData,
  };
}

/**
 * Server Action untuk memverifikasi sesi demo di server
 */
export async function getDemoSessionAction(): Promise<DemoSessionData | null> {
  if (!isDemoMode()) {
    return null;
  }

  const cookieStore = await cookies();
  const rawCookie = cookieStore.get('creativehub_demo_session')?.value;
  if (!rawCookie) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(rawCookie));
    if (parsed?.isDemo && (parsed?.role === 'owner' || parsed?.role === 'member')) {
      return parsed as DemoSessionData;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Server Action untuk logout demo
 */
export async function logoutDemoAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('creativehub_demo_session');
}
