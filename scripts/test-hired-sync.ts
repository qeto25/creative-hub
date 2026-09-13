import * as dataLayer from '../lib/dataLayer';
import { updateBookingStepAction } from '../app/actions/update-booking';

async function main() {
  console.log('=== TEST SYNC COUNTER HIRED ===\n');

  // 1. Ambil daftar profil awal
  const profilesBefore = await dataLayer.getProfiles({ includeTesters: true });
  if (!profilesBefore || profilesBefore.length === 0) {
    throw new Error('Tidak ada profil yang ditemukan');
  }

  const testProfile = profilesBefore[0];
  console.log(`Testing Talent: ${testProfile.full_name} (${testProfile.id})`);
  const initialHireCount = testProfile.hire_count || 0;
  console.log(`Initial hire_count: ${initialHireCount}`);

  // 2. Buat booking baru untuk talent ini
  const createRes = await dataLayer.createBooking({
    profileId: testProfile.id,
    talentName: testProfile.full_name,
    clientName: 'Tester Hired Counter',
    clientWhatsapp: '6281234567890',
    deadlineDate: '2026-10-01',
    projectBrief: 'Test counter hired sync',
    includeSourceFile: false,
    isRushOrder: false,
    estimatedTotal: 50000,
    dpAmount: 15000,
  });

  if (!createRes.success || !createRes.booking) {
    throw new Error(`Gagal membuat booking: ${createRes.error}`);
  }

  const booking = createRes.booking;
  console.log(`Created booking: ${booking.ticket_code} (ID: ${booking.id}), status: ${booking.status}`);

  // Profil sebelum selesai harus tetap memiliki initialHireCount
  const profileMid = await dataLayer.getProfileByIdOrSlug(testProfile.id);
  console.log(`hire_count before completion: ${profileMid?.hire_count}`);
  if (profileMid?.hire_count !== initialHireCount) {
    throw new Error(`Expected hire_count to remain ${initialHireCount}, but got ${profileMid?.hire_count}`);
  }

  // 3. Selesaikan tiket pesanan via updateBookingStepAction (step 5 / completed)
  console.log('\nMemperbarui status pesanan menjadi completed (Tahap 5)...');
  const updateRes = await updateBookingStepAction({
    bookingId: booking.id,
    stepProgress: 5,
    status: 'completed',
  });

  if (!updateRes.success || !updateRes.booking) {
    throw new Error(`Gagal update booking: ${updateRes.error}`);
  }

  console.log(`Booking updated: status=${updateRes.booking.status}, step_progress=${updateRes.booking.step_progress}`);

  // 4. Verifikasi counter bertambah +1 di getProfileByIdOrSlug
  const profileAfter = await dataLayer.getProfileByIdOrSlug(testProfile.id);
  console.log(`hire_count after completion (single profile): ${profileAfter?.hire_count}`);
  if ((profileAfter?.hire_count || 0) < initialHireCount + 1) {
    throw new Error(`Expected hire_count to be at least ${initialHireCount + 1}, got ${profileAfter?.hire_count}`);
  }

  // 5. Verifikasi counter bertambah +1 di getProfiles (katalog/direktori & kartu)
  const allProfilesAfter = await dataLayer.getProfiles({ includeTesters: true });
  const matchingProfileInList = allProfilesAfter.find((p) => p.id === testProfile.id);
  console.log(`hire_count after completion (in directory list): ${matchingProfileInList?.hire_count}`);
  if ((matchingProfileInList?.hire_count || 0) < initialHireCount + 1) {
    throw new Error(`Expected directory hire_count to be at least ${initialHireCount + 1}, got ${matchingProfileInList?.hire_count}`);
  }

  // 6. Pengujian khusus: Talent dengan 0 Hired naik menjadi 1x Hired
  console.log('\n--- Test 2: Talent dengan 0x Hired ---');
  const zeroTalent = profilesBefore.find((p) => (p.hire_count || 0) === 0) || {
    id: 'f1a23456-7890-4123-8123-000000000099',
    full_name: 'Talenta Baru Zero Hired',
    slug: 'talenta-baru-zero',
    hire_count: 0,
    base_price: 25000,
    skills: ['Canva Design'],
    role: 'member' as const,
  };

  // Pastikan profile terdaftar di snapshot demo
  await dataLayer.updateProfile(zeroTalent.id, zeroTalent);

  const initialZero = await dataLayer.getProfileByIdOrSlug(zeroTalent.id);
  console.log(`Initial zeroTalent hire_count: ${initialZero?.hire_count || 0}`);

  const createZeroBooking = await dataLayer.createBooking({
    profileId: zeroTalent.id,
    talentName: zeroTalent.full_name,
    clientName: 'Klien Pertama',
    clientWhatsapp: '628111222333',
    deadlineDate: '2026-10-15',
    projectBrief: 'Order perdana untuk talent baru',
    includeSourceFile: false,
    isRushOrder: false,
    estimatedTotal: 25000,
    dpAmount: 10000,
  });

  if (!createZeroBooking.success || !createZeroBooking.booking) {
    throw new Error('Gagal membuat booking untuk zeroTalent');
  }

  // Selesaikan order
  await updateBookingStepAction({
    bookingId: createZeroBooking.booking.id,
    stepProgress: 5,
    status: 'completed',
  });

  const afterZero = await dataLayer.getProfileByIdOrSlug(zeroTalent.id);
  console.log(`afterZero hire_count (single profile): ${afterZero?.hire_count}`);
  if (afterZero?.hire_count !== 1) {
    throw new Error(`Expected hire_count to become 1, but got ${afterZero?.hire_count}`);
  }

  const listAfterZero = await dataLayer.getProfiles({ includeTesters: true });
  const zeroInList = listAfterZero.find((p) => p.id === zeroTalent.id);
  console.log(`afterZero hire_count (in directory list): ${zeroInList?.hire_count}`);
  if (zeroInList?.hire_count !== 1) {
    throw new Error(`Expected directory hire_count to become 1, but got ${zeroInList?.hire_count}`);
  }

  console.log('\n✅ SEMUA PENGUJIAN SINKRONISASI COUNTER HIRED BERHASIL (PASSED)!');
}

main().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
