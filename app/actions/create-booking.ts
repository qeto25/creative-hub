'use server';

import { createClient } from '@/lib/supabase/server';
import { Booking } from '@/lib/types';
import { revalidatePath } from 'next/cache';

import { isDemoMode } from '@/lib/config';
import * as dataLayer from '@/lib/dataLayer';

export async function createBooking(payload: {
  profileId: string;
  talentName: string;
  clientName: string;
  clientWhatsapp: string;
  deadlineDate: string;
  projectBrief: string;
  includeSourceFile: boolean;
  isRushOrder: boolean;
  includeExtraRevision?: boolean;
  estimatedTotal: number;
  dpAmount: number;
}): Promise<{ success: boolean; booking?: Booking; error?: string }> {
  try {
    const profile = await dataLayer.getProfileByIdOrSlug(payload.profileId);
    if (!profile) {
      return { success: false, error: 'Profil talent tidak ditemukan.' };
    }
    const isDraft = Boolean(
      profile.is_tester ||
      (profile as any).published === false ||
      (profile as any).status === 'draft' ||
      profile.role === 'owner'
    );
    if (isDraft) {
      return { success: false, error: 'Profil talent ini masih dalam peninjauan dan belum menerima order.' };
    }

    // Generate ticket_code with format #CH-YYMM-[4-digit-random]
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const ticketCode = `#CH-${yy}${mm}-${randomDigits}`;

    const defaultHubFee = Math.round(payload.estimatedTotal * 0.25);
    const defaultTalentFee = payload.estimatedTotal - defaultHubFee;

    const newBooking: Booking = {
      id: `book-${Date.now()}`,
      ticket_code: ticketCode,
      profile_id: payload.profileId,
      talent_name: payload.talentName,
      client_name: payload.clientName.trim(),
      client_whatsapp: payload.clientWhatsapp.trim(),
      deadline_date: payload.deadlineDate,
      project_brief: payload.projectBrief.trim(),
      include_source_file: payload.includeSourceFile,
      is_rush_order: payload.isRushOrder,
      include_extra_revision: !!payload.includeExtraRevision,
      estimated_total: payload.estimatedTotal,
      dp_amount: payload.dpAmount,
      status: 'pending_dp',
      step_progress: 1,
      payout_status: 'unpaid',
      hub_fee: defaultHubFee,
      talent_fee: defaultTalentFee,
      created_at: new Date().toISOString(),
    };

    // Jika mode Demo, simpan ke snapshot demo
    if (isDemoMode()) {
      const demoRes = await dataLayer.createBooking(payload);
      if (!demoRes.success || !demoRes.booking) {
        return {
          success: false,
          error: demoRes.error || 'Gagal menyimpan pesanan di sistem demo.',
        };
      }
      try {
        revalidatePath('/dashboard/owner');
      } catch {
        // ignore outside request scope
      }
      return demoRes;
    }

    // Live Mode: Wajib insert ke Supabase dan WAJIB hentikan proses jika error != null
    try {
      const supabase = await createClient();
      const { data: dbInserted, error: insertError } = await supabase
        .from('bookings')
        .insert({
          ticket_code: newBooking.ticket_code,
          profile_id: newBooking.profile_id,
          talent_name: newBooking.talent_name,
          client_name: newBooking.client_name,
          client_whatsapp: newBooking.client_whatsapp,
          deadline_date: newBooking.deadline_date,
          project_brief: newBooking.project_brief,
          include_source_file: newBooking.include_source_file,
          is_rush_order: newBooking.is_rush_order,
          estimated_total: newBooking.estimated_total,
          dp_amount: newBooking.dp_amount,
          status: 'pending_dp',
        })
        .select()
        .single();

      if (insertError) {
        console.error('[createBooking] Supabase bookings insert error:', insertError.message);
        return {
          success: false,
          error: `Gagal menyimpan pesanan ke Supabase: ${insertError.message}`,
        };
      }

      if (!dbInserted) {
        return {
          success: false,
          error: 'Gagal membuat tiket pesanan: Database Supabase tidak merespons.',
        };
      }

      newBooking.id = dbInserted.id;
      try {
        revalidatePath('/dashboard/owner');
      } catch {
        // ignore outside request scope
      }

      return {
        success: true,
        booking: newBooking,
      };
    } catch (dbErr: any) {
      console.error('[createBooking] Supabase live booking exception:', dbErr);
      return {
        success: false,
        error: dbErr?.message || 'Terjadi kesalahan sistem saat menyimpan ke database Supabase.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Gagal membuat tiket pesanan.',
    };
  }
}
