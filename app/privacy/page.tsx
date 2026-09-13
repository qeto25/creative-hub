import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, EyeOff } from 'lucide-react';

export const metadata = {
  title: 'Kebijakan Privasi | Creative Hub',
  description: 'Kebijakan privasi dan perlindungan data pengguna platform Creative Hub.',
};

export default function PrivacyPolicyPage() {
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
          <ShieldCheck className="h-4 w-4" />
          <span>Privacy & Data Protection</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Kebijakan Privasi
        </h1>
        <p className="text-xs text-zinc-500 mt-2">
          Terakhir diperbarui: 13 September 2026
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 space-y-6 text-xs sm:text-sm text-zinc-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-400" />
            1. Komitmen Perlindungan Privasi
          </h2>
          <p>
            Creative Hub berkomitmen menjaga kerahasiaan data pribadi klien dan seluruh anggota kolektif talenta kreatif. Informasi yang Anda berikan hanya digunakan untuk keperluan koordinasi pengerjaan proyek, verifikasi pembayaran DP/pelunasan, dan penerbitan tiket pelacakan pesanan.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <EyeOff className="h-4 w-4 text-amber-400" />
            2. Sistem Satu Pintu & Proteksi Kontak
          </h2>
          <p>
            Demi keamanan transaksi dan kepatuhan standar mutu agensi:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-zinc-400">
            <li>Nomor telepon / WhatsApp klien tidak dibagikan secara terbuka kepada publik maupun dashboard bebas member.</li>
            <li>Seluruh koordinasi brief awal, validasi DP, dan revisi terpusat melalui Admin/Owner Agensi resmi.</li>
            <li>Kontak talent pelajar dilindungi dan hanya digunakan oleh pengelola agensi untuk penyaluran penugasan.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">
            3. Pengumpulan & Penggunaan Data
          </h2>
          <p>
            Data yang kami kumpulkan meliputi nama pemesan, kontak WhatsApp untuk update proyek, deskripsi brief pengerjaan, file referensi desain, dan bukti transfer pembayaran. Kami tidak pernah menjual atau membagikan data ini kepada pihak ketiga yang tidak berwenang.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">
            4. Keamanan Penyimpanan Portofolio
          </h2>
          <p>
            Karya portofolio yang ditampilkan pada platform merupakan hasil karya yang telah diizinkan oleh pembuatnya dan klien terkait. Jika ada karya yang bersifat konfidensial (NDA), pemesan dapat meminta tim kami untuk tidak mempublikasikan hasil kerja ke showcase publik.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">
            5. Kontak & Pertanyaan Privasi
          </h2>
          <p>
            Jika Anda memiliki pertanyaan mengenai kebijakan privasi atau ingin memperbarui informasi data pesanan Anda, silakan hubungi kami di{' '}
            <strong className="text-amber-400">grown@creativehub.id</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
