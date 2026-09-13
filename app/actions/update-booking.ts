'use server';

import { revalidatePath } from 'next/cache';
import * as dataLayer from '@/lib/dataLayer';
import { Booking, BookingStatus } from '@/lib/types';

/**
 * Server Action: Update Status & Tahap Progres Booking
 * - Otomatis melakukan update status / step progress di database
 * - Otomatis memicu revalidatePath('/freelancers') dan revalidatePath('/') saat status selesai
 */
export async function updateBookingStepAction(params: {
  bookingId: string;
  stepProgress?: 1 | 2 | 3 | 4 | 5;
  status?: BookingStatus;
}): Promise<{ success: boolean; booking?: Booking | null; error?: string }> {
  try {
    const updates: Partial<Booking> = {};
    if (params.stepProgress !== undefined) {
      updates.step_progress = params.stepProgress;
    }
    if (params.status !== undefined) {
      updates.status = params.status;
    }

    const updated = await dataLayer.updateBooking(params.bookingId, updates);
    if (!updated) {
      return { success: false, error: 'Gagal memperbarui data pesanan.' };
    }

    // Revalidate paths jika pesanan selesai agar counter dan kartu talent langsung sinkron
    if (updates.status === 'completed' || (updates.status as any) === 'selesai' || updates.step_progress === 5) {
      try {
        revalidatePath('/freelancers');
        revalidatePath('/');
        if (updated.profile_id) {
          revalidatePath(`/freelancers/${updated.profile_id}`);
        }
        revalidatePath('/dashboard/owner');
        revalidatePath('/dashboard/member');
      } catch {
        // Abaikan jika dipanggil di luar konteks request
      }
    }

    return { success: true, booking: updated };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Terjadi kesalahan sistem saat update pesanan.' };
  }
}
