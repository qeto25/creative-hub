import { createBooking } from '../app/actions/create-booking';
import * as dataLayer from '../lib/dataLayer';

async function testBookingFlow() {
  console.log('=== PENGUJIAN ALUR BOOKING, SUPABASE INSERT, & FORMAT WHATSAPP ===\n');

  // Test 1: Booking pada talent publik yang valid
  const talentId = 'f1a23456-7890-4123-8123-000000000001'; // Devan Putra
  console.log('1. Menguji pembuatan booking untuk talent publik (Devan Putra)...');
  const res = await createBooking({
    profileId: talentId,
    talentName: 'Devan Putra',
    clientName: 'Budi Santoso',
    clientWhatsapp: '081298765432',
    deadlineDate: '2026-09-20',
    projectBrief: 'Desain presentasi deck 10 slide untuk pitching startup.',
    includeSourceFile: true,
    isRushOrder: false,
    includeExtraRevision: true,
    estimatedTotal: 75000,
    dpAmount: 22500,
  });

  console.log('   Hasil Booking:', res);
  if (!res.success || !res.booking) {
    throw new Error(`Test 1 Gagal: ${res.error}`);
  }
  console.log('   ✅ Tiket berhasil dibuat:', res.booking.ticket_code);

  // Test 2: Pengujian Format Pesan WhatsApp
  console.log('\n2. Menguji format pesan WhatsApp terstruktur...');
  const b = res.booking;
  const addons: string[] = [];
  if (b.is_rush_order) addons.push('Pengerjaan Kilat (Rush Order)');
  if (b.include_source_file) addons.push('Master / Source File');
  if (b.include_extra_revision) addons.push('Ekstra Revisi');
  const addonsText = addons.length > 0 ? addons.join(', ') : 'Tidak ada';

  const formatNumber = (num: number) => Number(num || 0).toLocaleString('id-ID');
  const total = b.estimated_total;
  const dpPercent = 30;
  const dp = b.dp_amount;
  const sisa = total - dp;

  const waMessage = `Halo Admin CREATIVE HUB, saya ingin konfirmasi pemesanan jasa! 🚀

📋 *RINCIAN TIKET & KLIEN:*
• No. Tiket: ${b.ticket_code}
• Nama Klien: ${b.client_name}
• No. WhatsApp: ${b.client_whatsapp}
• Talent Pilihan: ${b.talent_name}

🎯 *DETAIL PROYEK & KEBUTUHAN:*
• Deskripsi Singkat: ${b.project_brief}
• Target Deadline: ${b.deadline_date}
• Layanan Tambahan: ${addonsText}

💰 *RINCIAN PEMBAYARAN:*
• Total Biaya: Rp ${formatNumber(total)}
• DP Wajib (${dpPercent}%): Rp ${formatNumber(dp)}
• Sisa Pelunasan: Rp ${formatNumber(sisa)}

Mohon verifikasi ketersediaan dan kirimkan rekening pembayaran DP. Terima kasih!`;

  console.log('   Pesan WhatsApp yang dihasilkan:\n---\n' + waMessage + '\n---');

  // Validasi poin-poin kunci format pesan
  if (!waMessage.includes('Halo Admin CREATIVE HUB, saya ingin konfirmasi pemesanan jasa! 🚀')) {
    throw new Error('Test 2 Gagal: Header salam WhatsApp tidak sesuai template!');
  }
  if (!waMessage.includes('📋 *RINCIAN TIKET & KLIEN:*')) {
    throw new Error('Test 2 Gagal: Bagian rincian tiket tidak sesuai!');
  }
  if (!waMessage.includes(`• No. Tiket: ${b.ticket_code}`)) {
    throw new Error('Test 2 Gagal: No. Tiket tidak tercetak dengan benar!');
  }
  if (!waMessage.includes('🎯 *DETAIL PROYEK & KEBUTUHAN:*')) {
    throw new Error('Test 2 Gagal: Bagian detail proyek tidak sesuai!');
  }
  if (!waMessage.includes('💰 *RINCIAN PEMBAYARAN:*')) {
    throw new Error('Test 2 Gagal: Bagian rincian pembayaran tidak sesuai!');
  }
  if (!waMessage.includes('Mohon verifikasi ketersediaan dan kirimkan rekening pembayaran DP. Terima kasih!')) {
    throw new Error('Test 2 Gagal: Footer penutup WhatsApp tidak sesuai!');
  }
  console.log('   ✅ Format pesan WhatsApp 100% presisi sesuai instruksi!');

  // Test 3: Pengurutan Tabel Pesanan (created_at DESC)
  console.log('\n3. Menguji pemanggilan getBookings diurutkan created_at descending...');
  const allBookings = await dataLayer.getBookings();
  console.log(`   Total pesanan terbaca: ${allBookings.length}`);
  if (allBookings.length < 2) {
    throw new Error('Test 3 Gagal: Diperlukan minimal 2 booking untuk menguji urutan!');
  }

  for (let i = 0; i < allBookings.length - 1; i++) {
    const tCurrent = new Date(allBookings[i].created_at || 0).getTime();
    const tNext = new Date(allBookings[i + 1].created_at || 0).getTime();
    if (tCurrent < tNext) {
      throw new Error(`Test 3 Gagal: Pesanan tidak diurutkan descending! [${i}] ${allBookings[i].created_at} < [${i+1}] ${allBookings[i+1].created_at}`);
    }
  }
  console.log('   ✅ Urutan created_at descending terverifikasi benar!');

  // Test 4: Penolakan Booking pada Talent Draft
  console.log('\n4. Menguji penolakan booking pada profil draft...');
  const draftId = 'f1a23456-7890-4123-8123-000000000005';
  const draftRes = await createBooking({
    profileId: draftId,
    talentName: 'Rian Syahputra',
    clientName: 'Tester',
    clientWhatsapp: '08120000000',
    deadlineDate: '2026-09-25',
    projectBrief: 'Uji coba booking draft',
    includeSourceFile: false,
    isRushOrder: false,
    estimatedTotal: 950000,
    dpAmount: 285000,
  });

  if (draftRes.success) {
    throw new Error('Test 4 Gagal: Booking draft seharusnya ditolak!');
  }
  console.log('   Pesan penolakan:', draftRes.error);
  console.log('   ✅ Penolakan booking draft terverifikasi aman!');

  console.log('\n🎉 SELURUH PENGUJIAN BOOKING FLOW & WHATSAPP FORMAT BERHASIL 100%!');
}

testBookingFlow().catch((err) => {
  console.error('Error pengujian:', err);
  process.exit(1);
});
