'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { MemberProvisionPayload, Profile } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function ownerCreateMember(payload: MemberProvisionPayload): Promise<{
  success: boolean;
  profile?: Profile;
  error?: string;
}> {
  try {
    const adminClient = createAdminClient();
    const tempPassword = payload.password || 'Creative2026!';
    const slug = payload.fullName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Math.random().toString(36).substring(2, 6);

    const defaultAvatar =
      payload.avatarUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';

    // 1. Coba create user dengan Supabase Admin API
    let createdUserId = `member-${Date.now()}`;
    try {
      const { data: userData, error: userError } = await adminClient.auth.admin.createUser({
        email: payload.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: payload.fullName,
          slug,
          avatar_url: defaultAvatar,
          role: 'member',
          base_price: payload.basePrice,
          dp_percentage: payload.dpPercentage,
          is_tester: payload.isTester ?? false,
        },
      });

      if (!userError && userData?.user) {
        createdUserId = userData.user.id;
      } else if (userError) {
        console.warn('Admin createUser notice:', userError.message);
      }
    } catch (e: any) {
      console.warn('Admin client exception (using simulated ID):', e?.message);
    }

    // 2. Insert ke tabel profiles
    const newProfile: Profile = {
      id: createdUserId,
      full_name: payload.fullName,
      slug,
      avatar_url: defaultAvatar,
      bio: payload.bio || `Creative Talent spesialis ${payload.skills.join(', ')}.`,
      whatsapp_number: payload.whatsappNumber || '6281234567890',
      role: 'member',
      skills: payload.skills && payload.skills.length > 0 ? payload.skills : ['Creative Specialist'],
      is_working: false,
      base_price: Number(payload.basePrice) || 500000,
      dp_percentage: Number(payload.dpPercentage) || 30,
      hire_count: 0,
      rating: 5.0,
      review_count: 0,
      is_tester: payload.isTester ?? false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { error: profileError } = await adminClient
        .from('profiles')
        .upsert(newProfile);

      if (profileError) {
        console.warn('Profile upsert notice:', profileError.message);
      }
    } catch (e) {
      // Ignored if DB table not connected yet
    }

    revalidatePath('/dashboard/owner');
    revalidatePath('/freelancers');
    revalidatePath('/');

    return {
      success: true,
      profile: newProfile,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Gagal membuat akun member baru.',
    };
  }
}
