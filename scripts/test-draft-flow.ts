import { createBooking } from '../app/actions/create-booking';

async function runDraftSecurityTests() {
  console.log('=== PENGUJIAN KEAMANAN & PRIVASI PROFIL DRAFT ===\n');

  const draftId = 'f1a23456-7890-4123-8123-000000000005';
  const ownerCookie = `creativehub_demo_session=${encodeURIComponent(JSON.stringify({
    role: 'owner',
    user_id: 'demo-owner-id',
    name: 'Owner Grown (Demo)',
    email: 'grown@creativehub.id',
    isDemo: true,
  }))}`;
  const memberCookie = `creativehub_demo_session=${encodeURIComponent(JSON.stringify({
    role: 'member',
    user_id: 'demo-member-id',
    name: 'Devan Putra (Demo)',
    email: 'devan@creativehub.id',
    isDemo: true,
  }))}`;

  // Skenario 1: Setelah Logout / Tanpa Session (Pengunjung Publik)
  console.log('Skenario 1: Buka URL profil draft setelah logout (tanpa session)...');
  const loggedOutRes = await fetch(`http://localhost:3001/api/profile/${draftId}`);
  console.log('   Status Code:', loggedOutRes.status);
  const loggedOutBody = await loggedOutRes.text();
  if (loggedOutRes.status !== 404) {
    throw new Error(`GAGAL: Status diharapkan 404, tetapi mendapat ${loggedOutRes.status}`);
  }
  if (loggedOutBody.includes('Rian Syahputra') || loggedOutBody.includes('950000') || loggedOutBody.includes('Blender 4.0')) {
    throw new Error('GAGAL: Data draft bocor ke publik tanpa login!');
  }
  console.log('   ✅ Hasil: Data draft 100% tertutup dan aman (404 Profil belum tersedia).\n');

  // Skenario 2: Login Owner Valid
  console.log('Skenario 2: Login Owner valid membuka profil draft...');
  const ownerRes = await fetch(`http://localhost:3001/api/profile/${draftId}`, {
    headers: { Cookie: ownerCookie },
  });
  console.log('   Status Code:', ownerRes.status);
  const ownerJson = await ownerRes.json();
  if (ownerRes.status !== 200 || !ownerJson.profile || ownerJson.canViewDraft !== true) {
    throw new Error('GAGAL: Owner tidak dapat mengakses profil draft untuk mode peninjauan');
  }
  if (!ownerJson.profile.full_name.includes('Rian Syahputra')) {
    throw new Error('GAGAL: Data draft owner tidak sesuai');
  }
  console.log('   ✅ Hasil: Owner terverifikasi server dapat melihat draft dalam Mode Peninjauan.\n');

  // Skenario 3: Login Member (Bukan Owner)
  console.log('Skenario 3: Member membuka URL profil draft...');
  const memberRes = await fetch(`http://localhost:3001/api/profile/${draftId}`, {
    headers: { Cookie: memberCookie },
  });
  console.log('   Status Code:', memberRes.status);
  const memberBody = await memberRes.text();
  if (memberRes.status !== 404) {
    throw new Error(`GAGAL: Member seharusnya mendapat 404, tetapi mendapat ${memberRes.status}`);
  }
  if (memberBody.includes('Rian Syahputra')) {
    throw new Error('GAGAL: Member dapat mengintip data draft!');
  }
  console.log('   ✅ Hasil: Member ditolak dan data draft tidak dikirimkan.\n');

  // Skenario 4: Server Action createBooking pada talent draft
  console.log('Skenario 4: Percobaan booking ke profil draft...');
  const bookingAttempt = await createBooking({
    profileId: draftId,
    talentName: 'Rian Syahputra',
    clientName: 'Penyusup',
    clientWhatsapp: '081234567890',
    deadlineDate: '2026-10-01',
    projectBrief: 'Coba booking draft',
    includeSourceFile: false,
    isRushOrder: false,
    estimatedTotal: 950000,
    dpAmount: 285000,
  });
  console.log('   Hasil Booking:', bookingAttempt);
  if (bookingAttempt.success) {
    throw new Error('GAGAL: Order berhasil dibuat untuk profil draft!');
  }
  console.log('   ✅ Hasil: Server action menolak pemesanan profil draft dengan aman.\n');

  console.log('🎉 SEMUA SKENARIO UJI PRIVASI & KEAMANAN PROFIL DRAFT BERHASIL 100%!');
}

runDraftSecurityTests().catch((err) => {
  console.error('Error saat pengujian:', err);
  process.exit(1);
});
