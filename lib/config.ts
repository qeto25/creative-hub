/**
 * Creative Hub Application Configuration & Mode Helper
 * Mendukung pemisahan "Demo Mode vs Live Mode":
 * - 'demo': Membaca & menulis ke data snapshot lokal, 0 mutasi ke Supabase asli.
 * - 'live': Membaca & menulis langsung ke Supabase produksi.
 */

export type AppMode = 'demo' | 'live';

export function getAppMode(): AppMode {
  const mode = process.env.NEXT_PUBLIC_APP_MODE?.toLowerCase()?.trim();
  if (mode === 'live') {
    return 'live';
  }
  return 'demo';
}

export function isDemoMode(): boolean {
  return getAppMode() === 'demo';
}

export function isLiveMode(): boolean {
  return getAppMode() === 'live';
}
