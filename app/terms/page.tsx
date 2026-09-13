import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle2, ShieldCheck, HelpCircle } from 'lucide-react';

export const metadata = {
  title: 'Syarat & Ketentuan Layanan | Creative Hub',
  description: 'Syarat, ketentuan layanan, alur pengerjaan, dan sistem DP pada platform Creative Hub.',
};

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Beranda</span>
        </Link>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">
          <FileText className="h-4 w-4" />
          <span>Terms & Order Guidelines</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Syarat & Ketentuan Layanan
        </h1>
        <p className="text-xs text-zinc-500 mt-2">
          Terakhir diperbarui: 13 September 2026
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 space-y-6 text-xs sm:text-sm text-zinc-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-amber-400" />
            1. Ketentuan Umum Pemesanan
          </h2>
          <p>
            Creative Hub adalah platform kolektif talenta kreatif pelajar dan mahasiswa yang menyediakan jasa desain presentasi, video editing, fotografi, dan UI design dengan tarif transparan dan ramah pelajar. Seluruh transaksi dan penerbitan tiket pesanan dikoordinasikan secara resmi melalui platform.
          </p>
        </section>

        <section id="dp-amanah" className="space-y-2 border-y border-zinc-800/80 py-4">
          <h2 className="text-base font-bold text-amber-400 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            2. Sistem DP Transparan (Komitmen Pengerjaan)
          </h2>
          <p>
            Untuk memastikan komitmen waktu dan jadwal pengerjaan talent:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
            <li>
              Setiap pesanan wajib melakukan pembayaran <strong>Uang Muka (DP)</strong> sesuai persentase yang tertera pada profil talent (umumnya 30% - 50%).
            </li>
            <li>
              Pengerjaan draf baru dimulai (Tahap 2) setelah pembayaran DP diverifikasi oleh Owner Agensi.
            </li>
            <li>
              Pelunasan sisa biaya dilakukan setelah draf selesai ditinjau (Tahap 4) sebelum penyerahan master file final kualitas penuh.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">
            3. Jatah Revisi & Biaya Tambahan
          </h2>
          <p>
            Setiap paket standar mencakup jatah revisi minor gratis sesuai keterangan profil kreator (umumnya 1x revisi minor). Revisi minor mencakup koreksi teks, pergantian warna minor, atau penyesuaian tata letak kecil. Perubahan konsep mendasar atau permintaan tambahan setelah jatah habis dikenakan biaya per-revisi yang telah tertera transparan.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">
            4. Hak Cipta & Deliverable File
          </h2>
          <p>
            Setelah pelunasan diselesaikan sepenuhnya, hak pakai atas karya visual diserahkan kepada pemesan. Ketersediaan file mentahan (Canva edit link / PPTX mentah / Project file) disesuaikan dengan opsi tambahan paket yang dipilih saat pemesanan.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-amber-400" />
            5. Bantuan & Layanan Pelanggan
          </h2>
          <p>
            Apabila ada kendala dalam proses pelacakan tiket atau pengerjaan, silakan gunakan nomor tiket di menu <strong>Lacak Proyek</strong> atau hubungi Admin resmi Creative Hub via WhatsApp concierge.
          </p>
        </section>
      </div>
    </div>
  );
}
