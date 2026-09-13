import { isDemoMode } from '@/lib/config';
import { getDemoSnapshot, saveDemoSnapshot } from '@/lib/mockData';
import { createClient } from '@/lib/supabase/client';
import { Profile, Portfolio, Review, Booking, BookingStatus } from '@/lib/types';

/**
 * Creative Hub Unified Data Layer
 * 
 * Abstraksi sentral untuk membedakan Demo Mode vs Live Mode:
 * - Jika Demo: Semua operasi baca/tulis HANYA menggunakan snapshot lokal (0 mutasi ke Supabase).
 * - Jika Live: Mengambil dan menulis data secara langsung ke Supabase produksi.
 */

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ============================================================================
// 1. PROFILES DATA ACCESS
// ============================================================================

export async function getProfiles(options?: {
  includeTesters?: boolean;
  skill?: string;
}): Promise<Profile[]> {
  if (isDemoMode()) {
    const snapshot = getDemoSnapshot();
    let result = snapshot.profiles;
    if (!options?.includeTesters) {
      result = result.filter((p) => !p.is_tester);
    }
    if (options?.skill && options.skill !== 'Semua') {
      const s = options.skill.toLowerCase();
      result = result.filter((p) => p.skills.some((sk) => sk.toLowerCase().includes(s)));
    }
    return result;
  }

  // Live Supabase
  try {
    const supabase = createClient();
    let query = supabase.from('profiles').select('*');
    if (!options?.includeTesters) {
      query = query.eq('is_tester', false);
    }
    query = query.order('rating', { ascending: false });
    const { data, error } = await query;
    if (error) {
      console.warn('[DataLayer] Error fetching profiles from Supabase:', error.message);
      return [];
    }
    let result = ((data as any[]) || []).map((p) => ({
      ...p,
      is_available: p.availability_status !== 'resting' && p.is_available !== false,
    })) as Profile[];
    if (options?.skill && options.skill !== 'Semua') {
      const s = options.skill.toLowerCase();
      result = result.filter((p) => p.skills?.some((sk) => sk.toLowerCase().includes(s)));
    }
    return result;
  } catch (err) {
    console.error('[DataLayer] Live profiles exception:', err);
    return [];
  }
}

export async function getProfileByIdOrSlug(idOrSlug: string): Promise<Profile | null> {
  if (isDemoMode()) {
    const snapshot = getDemoSnapshot();
    const found = snapshot.profiles.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
    return found || null;
  }

  // Live Supabase
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
      .maybeSingle();

    if (error) {
      console.warn('[DataLayer] Error fetching profile by ID/slug:', error.message);
      return null;
    }
    if (!data) return null;
    return {
      ...data,
      is_available: data.availability_status !== 'resting' && data.is_available !== false,
    } as Profile;
  } catch (err) {
    console.error('[DataLayer] Live profile fetch exception:', err);
    return null;
  }
}

export async function updateProfile(id: string, updates: Partial<Profile>): Promise<Profile | null> {
  if (isDemoMode()) {
    const snapshot = getDemoSnapshot();
    let updatedProfile: Profile | null = null;
    snapshot.profiles = snapshot.profiles.map((p) => {
      if (p.id === id) {
        updatedProfile = { ...p, ...updates, updated_at: new Date().toISOString() };
        return updatedProfile;
      }
      return p;
    });
    saveDemoSnapshot(snapshot);
    return updatedProfile;
  }

  // Live Supabase
  try {
    const supabase = createClient();
    // Exclude is_available from live DB payload because live table uses availability_status
    const { is_available, ...safeUpdates } = updates;
    if (is_available !== undefined && !safeUpdates.availability_status) {
      safeUpdates.availability_status = is_available ? 'available' : 'resting';
    }
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...safeUpdates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('[DataLayer] Live update profile error:', error.message);
      return null;
    }
    return (data as Profile) || null;
  } catch (err) {
    console.error('[DataLayer] Live profile update exception:', err);
    return null;
  }
}

// ============================================================================
// 2. PORTFOLIOS DATA ACCESS
// ============================================================================

export async function getPortfolios(options?: {
  profileId?: string;
  category?: string;
}): Promise<Portfolio[]> {
  if (isDemoMode()) {
    const snapshot = getDemoSnapshot();
    let result = snapshot.portfolios;
    if (options?.profileId) {
      result = result.filter((p) => p.profile_id === options.profileId);
    }
    if (options?.category && options.category !== 'Semua') {
      result = result.filter((p) => p.category.toLowerCase() === options.category!.toLowerCase());
    }
    // Filter out draft/tester portfolios if general showcase
    if (!options?.profileId) {
      result = result.filter((p) => {
        const prof = snapshot.profiles.find((pr) => pr.id === p.profile_id);
        return !prof?.is_tester && prof?.role !== 'owner';
      });
    }
    // Populate profile attribution
    return result.map((port) => ({
      ...port,
      profile: snapshot.profiles.find((pr) => pr.id === port.profile_id),
    }));
  }

  // Live Supabase
  try {
    const supabase = createClient();
    let query = supabase.from('portfolios').select('*, profile:profiles(id, full_name, slug, avatar_url, is_working, is_tester)');
    if (options?.profileId) {
      query = query.eq('profile_id', options.profileId);
    }
    if (options?.category && options.category !== 'Semua') {
      query = query.eq('category', options.category);
    }
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.warn('[DataLayer] Live portfolios fetch error:', error.message);
      return [];
    }
    let list = (data as any[]) || [];
    if (!options?.profileId) {
      list = list.filter((p) => !p.profile?.is_tester);
    }
    return list as Portfolio[];
  } catch (err) {
    console.error('[DataLayer] Live portfolios exception:', err);
    return [];
  }
}

export async function createPortfolio(portfolio: Omit<Portfolio, 'id' | 'created_at'>): Promise<Portfolio | null> {
  const newPort: Portfolio = {
    ...portfolio,
    id: generateUUID(),
    created_at: new Date().toISOString(),
  };

  if (isDemoMode()) {
    const snapshot = getDemoSnapshot();
    snapshot.portfolios.unshift(newPort);
    saveDemoSnapshot(snapshot);
    return newPort;
  }

  // Live Supabase
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('portfolios')
      .insert({
        profile_id: portfolio.profile_id,
        title: portfolio.title,
        description: portfolio.description,
        category: portfolio.category,
        media_url: portfolio.media_url,
        media_type: portfolio.media_type,
      })
      .select()
      .single();

    if (error) {
      console.error('[DataLayer] Live portfolio insert error:', error.message);
      return null;
    }
    return data as Portfolio;
  } catch (err) {
    console.error('[DataLayer] Live portfolio insert exception:', err);
    return null;
  }
}

export async function deletePortfolio(id: string): Promise<boolean> {
  if (isDemoMode()) {
    const snapshot = getDemoSnapshot();
    snapshot.portfolios = snapshot.portfolios.filter((p) => p.id !== id);
    saveDemoSnapshot(snapshot);
    return true;
  }

  // Live Supabase
  try {
    const supabase = createClient();
    const { error } = await supabase.from('portfolios').delete().eq('id', id);
    return !error;
  } catch (err) {
    console.error('[DataLayer] Live delete portfolio error:', err);
    return false;
  }
}

// ============================================================================
// 3. REVIEWS DATA ACCESS
// ============================================================================

export async function getReviews(options?: { profileId?: string }): Promise<Review[]> {
  if (isDemoMode()) {
    const snapshot = getDemoSnapshot();
    let result = snapshot.reviews;
    if (options?.profileId) {
      result = result.filter((r) => r.profile_id === options.profileId);
    }
    return result;
  }

  // Live Supabase
  try {
    const supabase = createClient();
    let query = supabase.from('reviews').select('*');
    if (options?.profileId) {
      query = query.eq('profile_id', options.profileId);
    }
    query = query.order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) {
      console.warn('[DataLayer] Live reviews fetch error:', error.message);
      return [];
    }
    return (data as Review[]) || [];
  } catch (err) {
    console.error('[DataLayer] Live reviews exception:', err);
    return [];
  }
}

export async function submitReview(payload: {
  profileId: string;
  ticketCode: string;
  clientWhatsapp: string;
  rating: number;
  comment: string;
}): Promise<{ success: boolean; review?: Review; error?: string }> {
  const cleanTicket = payload.ticketCode.trim().toUpperCase();
  const cleanPhone = payload.clientWhatsapp.replace(/\D/g, '');
  const cleanRating = Math.min(5, Math.max(1, Math.round(payload.rating)));

  if (isDemoMode()) {
    const snapshot = getDemoSnapshot();
    // Validasi tiket
    const booking = snapshot.bookings.find(
      (b) => b.ticket_code.toUpperCase() === cleanTicket && b.profile_id === payload.profileId
    );

    if (!booking) {
      return { success: false, error: 'Tiket pesanan tidak ditemukan untuk talent ini.' };
    }

    const bookingPhone = (booking.client_whatsapp || '').replace(/\D/g, '');
    if (bookingPhone && cleanPhone && !bookingPhone.endsWith(cleanPhone.slice(-4))) {
      return { success: false, error: 'Nomor WhatsApp tidak cocok dengan data pemesanan tiket ini.' };
    }

    const newReview: Review = {
      id: generateUUID(),
      booking_id: booking.id,
      profile_id: payload.profileId,
      client_name: booking.client_name,
      rating: cleanRating,
      comment: payload.comment.trim(),
      created_at: new Date().toISOString(),
    };

    snapshot.reviews.unshift(newReview);
    // Tandai tiket has_reviewed
    booking.has_reviewed = true;
    saveDemoSnapshot(snapshot);

    return { success: true, review: newReview };
  }

  // Live Supabase
  try {
    const supabase = createClient();
    // 1. Verifikasi booking
    const { data: dbBooking, error: bErr } = await supabase
      .from('bookings')
      .select('*')
      .ilike('ticket_code', cleanTicket)
      .eq('profile_id', payload.profileId)
      .maybeSingle();

    if (bErr || !dbBooking) {
      return { success: false, error: 'Tiket pesanan tidak ditemukan di database.' };
    }

    const bookingPhone = (dbBooking.client_whatsapp || '').replace(/\D/g, '');
    if (bookingPhone && cleanPhone && !bookingPhone.endsWith(cleanPhone.slice(-4))) {
      return { success: false, error: 'Nomor WhatsApp tidak sesuai dengan data pemesanan.' };
    }

    // 2. Insert Review (tanpa kolom yang tidak ada di skema live)
    const { data: dbReview, error: rErr } = await supabase
      .from('reviews')
      .insert({
        profile_id: payload.profileId,
        client_name: dbBooking.client_name,
        rating: cleanRating,
        comment: payload.comment.trim(),
      })
      .select()
      .single();

    if (rErr) {
      return { success: false, error: rErr.message };
    }

    // 3. Mark booking as reviewed jika kolom ada (abaikan jika tidak ada)
    try {
      await supabase.from('bookings').update({ has_reviewed: true }).eq('id', dbBooking.id);
    } catch {
      // ignore
    }

    return { success: true, review: dbReview as Review };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal menyimpan ulasan.' };
  }
}

// ============================================================================
// 4. BOOKINGS DATA ACCESS
// ============================================================================

export async function getBookings(options?: {
  profileId?: string;
  status?: BookingStatus;
}): Promise<Booking[]> {
  if (isDemoMode()) {
    const snapshot = getDemoSnapshot();
    let result = snapshot.bookings;
    if (options?.profileId) {
      result = result.filter((b) => b.profile_id === options.profileId);
    }
    if (options?.status) {
      result = result.filter((b) => b.status === options.status);
    }
    return result;
  }

  // Live Supabase
  try {
    const supabase = createClient();
    let query = supabase.from('bookings').select('*');
    if (options?.profileId) {
      query = query.eq('profile_id', options.profileId);
    }
    if (options?.status) {
      query = query.eq('status', options.status);
    }
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.warn('[DataLayer] Live bookings fetch error:', error.message);
      return [];
    }
    return (data as Booking[]) || [];
  } catch (err) {
    console.error('[DataLayer] Live bookings exception:', err);
    return [];
  }
}

export async function getBookingByTicket(ticketCode: string): Promise<Booking | null> {
  const cleanTicket = ticketCode.trim().toUpperCase();

  if (isDemoMode()) {
    const snapshot = getDemoSnapshot();
    const found = snapshot.bookings.find((b) => b.ticket_code.toUpperCase() === cleanTicket);
    return found || null;
  }

  // Live Supabase
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .ilike('ticket_code', cleanTicket)
      .maybeSingle();

    if (error) {
      console.warn('[DataLayer] Live ticket lookup error:', error.message);
      return null;
    }
    return (data as Booking) || null;
  } catch (err) {
    console.error('[DataLayer] Live ticket lookup exception:', err);
    return null;
  }
}

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
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  const ticketCode = `#CH-${yy}${mm}-${randomDigits}`;

  const defaultHubFee = Math.round(payload.estimatedTotal * 0.25);
  const defaultTalentFee = payload.estimatedTotal - defaultHubFee;

  const newBooking: Booking = {
    id: generateUUID(),
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
    has_reviewed: false,
    created_at: new Date().toISOString(),
  };

  if (isDemoMode()) {
    const snapshot = getDemoSnapshot();
    snapshot.bookings.unshift(newBooking);
    saveDemoSnapshot(snapshot);
    return { success: true, booking: newBooking };
  }

  // Live Supabase
  try {
    const supabase = createClient();
    // Hanya masukkan kolom yang ada di tabel live bookings
    const { data, error } = await supabase
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

    if (error) {
      console.error('[DataLayer] Live booking creation error:', error.message);
      return { success: false, error: error.message };
    }
    return {
      success: true,
      booking: {
        ...(data as any),
        step_progress: 1,
        payout_status: 'unpaid',
        hub_fee: defaultHubFee,
        talent_fee: defaultTalentFee,
        has_reviewed: false,
        include_extra_revision: payload.includeExtraRevision || false,
      } as Booking,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal membuat pesanan.' };
  }
}

export async function updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | null> {
  if (isDemoMode()) {
    const snapshot = getDemoSnapshot();
    let updatedBooking: Booking | null = null;
    snapshot.bookings = snapshot.bookings.map((b) => {
      if (b.id === id) {
        updatedBooking = { ...b, ...updates };
        return updatedBooking;
      }
      return b;
    });
    saveDemoSnapshot(snapshot);
    return updatedBooking;
  }

  // Live Supabase
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('[DataLayer] Live update booking error:', error.message);
      return null;
    }
    return (data as Booking) || null;
  } catch (err) {
    console.error('[DataLayer] Live update booking exception:', err);
    return null;
  }
}

export async function updateBookingsMass(
  updatesFn: (booking: Booking) => Partial<Booking>,
  filterFn?: (booking: Booking) => boolean
): Promise<Booking[]> {
  if (isDemoMode()) {
    const snapshot = getDemoSnapshot();
    snapshot.bookings = snapshot.bookings.map((b) => {
      if (!filterFn || filterFn(b)) {
        const partial = updatesFn(b);
        return { ...b, ...partial };
      }
      return b;
    });
    saveDemoSnapshot(snapshot);
    return snapshot.bookings;
  }

  // Live Supabase
  try {
    const supabase = createClient();
    const { data: allBookings, error: fetchErr } = await supabase.from('bookings').select('*');
    if (fetchErr || !allBookings) {
      console.error('[DataLayer] Live mass update fetch error:', fetchErr?.message);
      return [];
    }

    const promises = (allBookings as Booking[])
      .filter((b) => !filterFn || filterFn(b))
      .map((b) => {
        const patch = updatesFn(b);
        return supabase.from('bookings').update(patch).eq('id', b.id);
      });

    await Promise.all(promises);

    const { data: refreshed } = await supabase.from('bookings').select('*');
    return (refreshed as Booking[]) || [];
  } catch (err) {
    console.error('[DataLayer] Live mass update exception:', err);
    return [];
  }
}
