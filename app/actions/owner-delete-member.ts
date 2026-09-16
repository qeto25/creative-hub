'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getDemoSessionAction } from '@/app/actions/demo-auth';
import { isDemoMode } from '@/lib/config';
import { getDemoSnapshot, saveDemoSnapshot } from '@/lib/mockData';

export async function ownerDeleteMember(profileId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const isDemo = isDemoMode();

    if (!isDemo) {
      // 1. Verifikasi role Owner di Supabase Auth
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Akses ditolak. Anda harus login terlebih dahulu.' };
      }
      const metaRole = user.user_metadata?.role;
      const email = user.email?.toLowerCase() || '';
      if (metaRole !== 'owner' && email !== 'grown@creativehub.id' && !email.includes('owner')) {
        return { success: false, error: 'Akses ditolak. Hanya Owner yang berwenang menghapus member.' };
      }

      const adminClient = createAdminClient();

      // 2. Hapus dari tabel profiles terlebih dahulu
      const { error: profileError } = await adminClient
        .from('profiles')
        .delete()
        .eq('id', profileId);

      if (profileError) {
        console.warn('[DeleteMember] Profile delete error:', profileError.message);
      }

      // 3. Hapus dari Supabase Auth (user auth account)
      try {
        const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(profileId);
        if (authDeleteError) {
          console.warn('[DeleteMember] Auth delete notice:', authDeleteError.message);
        }
      } catch (e: any) {
        console.warn('[DeleteMember] Auth delete exception:', e?.message);
      }
    } else {
      // Demo Mode: Verifikasi wewenang Owner dari HttpOnly session
      const demoSession = await getDemoSessionAction();
      if (!demoSession || demoSession.role !== 'owner') {
        return { success: false, error: 'Akses ditolak. Hanya Owner yang berwenang menghapus member.' };
      }

      // Update server-side memory snapshot in demo mode
      const snapshot = getDemoSnapshot();
      snapshot.profiles = snapshot.profiles.filter((p) => p.id !== profileId);
      snapshot.portfolios = snapshot.portfolios.filter((p) => p.profile_id !== profileId);
      saveDemoSnapshot(snapshot);
    }

    // 4. Revalidate cache halaman terkait
    revalidatePath('/dashboard/owner');
    revalidatePath('/freelancers');
    revalidatePath('/');

    return { success: true };
  } catch (error: any) {
    console.error('[DeleteMember] Unexpected error:', error);
    return {
      success: false,
      error: error?.message || 'Gagal menghapus member. Coba lagi.',
    };
  }
}
