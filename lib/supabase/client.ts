import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ernwownclpnkrtczvuci.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_D1BL6OKh4PlRvd-d7x04IA_Lln37TsP';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
