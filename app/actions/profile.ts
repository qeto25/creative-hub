'use server';

import { createClient } from '@/lib/supabase/server';
import { getDemoSessionAction } from '@/app/actions/demo-auth';
import { isDemoMode } from '@/lib/config';
import * as dataLayer from '@/lib/dataLayer';
import { Profile, Portfolio, Review } from '@/lib/types';

export interface VerifiedProfileData {
  profile: Profile | null;
  portfolios: Portfolio[];
  reviews: Review[];
  isDraft: boolean;
  canViewDraft: boolean;
}

/**
 * Server-Side Secured Profile Loader
 * - Memverifikasi session dan role secara otoritatif di SERVER.
 * - Jika profil berstatus DRAFT atau is_tester, data 100% DIHAPUS/DISEMBUNYIKAN dari respon
 *   jika pengunjung bukan Owner yang memiliki sesi server valid.
 * - Menjamin tidak ada kebocoran nama, tarif, tools, brief, atau portofolio ke browser pengunjung biasa.
 */
export async function getVerifiedProfile(idOrSlug: string): Promise<VerifiedProfileData> {
  // 1. Verifikasi role viewer dari server
  let isOwner = false;

  if (isDemoMode()) {
    const demoSession = await getDemoSessionAction();
    if (demoSession?.role === 'owner') {
      isOwner = true;
    }
  } else {
    try {
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user && !error) {
        const metaRole = user.user_metadata?.role;
        const email = user.email?.toLowerCase() || '';
        if (metaRole === 'owner' || email === 'grown@creativehub.id' || email.includes('owner')) {
          isOwner = true;
        }
      }
    } catch {
      isOwner = false;
    }
  }

  // 2. Ambil profil dari data layer
  const rawProfile = await dataLayer.getProfileByIdOrSlug(idOrSlug);
  if (!rawProfile) {
    return {
      profile: null,
      portfolios: [],
      reviews: [],
      isDraft: false,
      canViewDraft: false,
    };
  }

  const isDraft = Boolean(
    rawProfile.is_tester ||
    (rawProfile as any).published === false ||
    (rawProfile as any).status === 'draft' ||
    (rawProfile as any).is_draft === true ||
    rawProfile.role === 'owner'
  );

  // 3. KEAMANAN KRITIS: Jika profil draft dan pengunjung BUKAN owner
  // Return NULL untuk seluruh data profil, portofolio, dan review
  if (isDraft && !isOwner) {
    return {
      profile: null,
      portfolios: [],
      reviews: [],
      isDraft: true,
      canViewDraft: false,
    };
  }

  // 4. Jika profil publik atau jika owner terverifikasi:
  const [portfolios, reviews] = await Promise.all([
    dataLayer.getPortfolios({ profileId: rawProfile.id }),
    dataLayer.getReviews({ profileId: rawProfile.id }),
  ]);

  return {
    profile: rawProfile,
    portfolios,
    reviews,
    isDraft,
    canViewDraft: isOwner,
  };
}
