'use server';

import { createClient } from '@/lib/supabase/server';
import { Review } from '@/lib/types';
import { MOCK_BOOKINGS } from '@/lib/data/mock-data';
import { revalidatePath } from 'next/cache';

function normalizePhone(phone: string): string {
  // Strip all non-digit characters
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    return '62' + digits.slice(1);
  }
  return digits;
}

export async function submitReview(payload: {
  profileId: string;
  ticketCode: string;
  clientWhatsapp: string;
  rating: number;
  comment: string;
}): Promise<{ success: boolean; review?: Review; error?: string }> {
  try {
    const cleanTicket = payload.ticketCode.trim().toUpperCase();
    const cleanWhatsapp = normalizePhone(payload.clientWhatsapp.trim());
    const cleanRating = Math.min(5, Math.max(1, Math.round(payload.rating)));
    const cleanComment = payload.comment.trim();

    if (!cleanTicket || !cleanWhatsapp) {
      return {
        success: false,
        error: 'Nomor tiket pesanan dan nomor WhatsApp wajib diisi.',
      };
    }

    if (!cleanComment) {
      return {
        success: false,
        error: 'Mohon tuliskan ulasan atau testimoni pengerjaan.',
      };
    }

    const supabase = createClient();
    let foundBooking: any = null;

    // 1. Cek di tabel bookings Supabase
    try {
      const { data: dbBooking } = await supabase
        .from('bookings')
        .select('*')
        .ilike('ticket_code', cleanTicket)
        .maybeSingle();

      if (dbBooking) {
        foundBooking = dbBooking;
      }
    } catch (e) {
      // Supabase connection or table issue, will fallback to mock bookings
      console.warn('Supabase booking query note:', e);
    }

    // 2. Fallback cek ke MOCK_BOOKINGS jika belum ada di database riil
    if (!foundBooking) {
      const mockMatch = MOCK_BOOKINGS.find(
        (b) => b.ticket_code.toUpperCase() === cleanTicket
      );
      if (mockMatch) {
        foundBooking = { ...mockMatch };
      }
    }

    // 3. Validasi Keberadaan Tiket
    if (!foundBooking) {
      return {
        success: false,
        error: 'Ulasan gagal: Tiket tidak valid, nomor WA salah, atau pesanan belum berstatus Selesai (Completed).',
      };
    }

    // 4. Validasi Nomor WhatsApp
    const bookingPhone = normalizePhone(foundBooking.client_whatsapp || '');
    if (bookingPhone !== cleanWhatsapp) {
      return {
        success: false,
        error: 'Ulasan gagal: Tiket tidak valid, nomor WA salah, atau pesanan belum berstatus Selesai (Completed).',
      };
    }

    // 5. Validasi Kecocokan Talent / Profile ID
    if (foundBooking.profile_id && foundBooking.profile_id !== payload.profileId) {
      return {
        success: false,
        error: 'Ulasan gagal: Tiket ini terdaftar untuk talent lain dalam agensi.',
      };
    }

    // 6. Validasi Status Pemesanan Wajib 'completed'
    if (foundBooking.status !== 'completed') {
      return {
        success: false,
        error: 'Ulasan gagal: Tiket tidak valid, nomor WA salah, atau pesanan belum berstatus Selesai (Completed).',
      };
    }

    // 7. Validasi Apakah Tiket Sudah Pernah Dipakai Review
    if (foundBooking.has_reviewed) {
      return {
        success: false,
        error: 'Ulasan gagal: Tiket ini sudah pernah digunakan untuk memberikan ulasan.',
      };
    }

    // 8. Sukses: Buat object Review
    const newReview: Review = {
      id: `rev-${Date.now()}`,
      booking_id: foundBooking.id,
      profile_id: payload.profileId,
      client_name: foundBooking.client_name,
      rating: cleanRating,
      comment: cleanComment,
      created_at: new Date().toISOString(),
    };

    // 9. Simpan ke Supabase jika terhubung
    try {
      const { data: insertedReview, error: insertErr } = await supabase
        .from('reviews')
        .insert({
          booking_id: foundBooking.id.startsWith('b') ? null : foundBooking.id,
          profile_id: payload.profileId,
          client_name: foundBooking.client_name,
          rating: cleanRating,
          comment: cleanComment,
        })
        .select()
        .single();

      if (!insertErr && insertedReview) {
        newReview.id = insertedReview.id;
      }

      // Tandai has_reviewed = true pada bookings
      await supabase
        .from('bookings')
        .update({ has_reviewed: true })
        .eq('id', foundBooking.id);

      // Recalculate Rating & Review Count di tabel profiles
      const { data: allReviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('profile_id', payload.profileId);

      if (allReviews && allReviews.length > 0) {
        const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        await supabase
          .from('profiles')
          .update({
            rating: Math.round(avg * 10) / 10,
            review_count: allReviews.length,
          })
          .eq('id', payload.profileId);
      }
    } catch (dbErr) {
      console.warn('Database review sync note:', dbErr);
    }

    // Tandai juga di memori mock data untuk sesi pengujian
    const mockRef = MOCK_BOOKINGS.find((b) => b.ticket_code.toUpperCase() === cleanTicket);
    if (mockRef) {
      mockRef.has_reviewed = true;
    }

    revalidatePath(`/freelancers/${payload.profileId}`);
    revalidatePath('/freelancers');
    revalidatePath('/');
    revalidatePath('/dashboard/owner');

    return {
      success: true,
      review: newReview,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Terjadi kesalahan sistem saat memvalidasi ulasan.',
    };
  }
}
