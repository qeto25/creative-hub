import { createBrowserClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ernwownclpnkrtczvuci.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_D1BL6OKh4PlRvd-d7x04IA_Lln37TsP';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Public Client: Bebas dari clock skew / token session browser
 * Digunakan untuk pembacaan data publik (portofolio, direktori freelancer, counter order selesai)
 * Menghindari error 'JWT issued at future' saat waktu sistem klien berbeda dengan waktu server.
 */
export function createPublicClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ernwownclpnkrtczvuci.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_D1BL6OKh4PlRvd-d7x04IA_Lln37TsP';

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
