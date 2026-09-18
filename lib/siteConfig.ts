/**
 * ============================================================
 * SITE CONFIG — Sentralisasi semua kontak & metadata brand
 * ============================================================
 * Edit file ini untuk mengubah nomor WA, email, dan copy brand
 * tanpa harus mencari di banyak file.
 */

export const SITE_CONFIG = {
  /** Nama brand yang ditampilkan */
  name: 'CREATIVE HUB',
  /** Tagline pendek di navbar */
  tagline: 'Agensi Kreatif Terkurasi',
  /** URL website live */
  url: 'https://creative-hub-sandy.vercel.app',
  /** Deskripsi singkat untuk SEO & footer */
  description:
    'Kolektif kurasi spesialis presentasi, editor video komersial, fotografer produk, dan arsitek UI/UX elit Indonesia dengan jaminan kepuasan dan transparansi DP.',
  /** Email kontak resmi */
  email: 'grown@creativehub.id',
  /** Nomor WhatsApp resmi (format internasional tanpa +) */
  whatsapp: '6285831041464',
  /** Pesan default untuk WhatsApp */
  whatsappMessage:
    'Halo%20Admin%20Creative%20Hub,%20saya%20ingin%20konsultasi%20proyek',
  /** Open Graph image untuk preview di sosmed */
  ogImage: '/og-image.png',
} as const;

/** Helper: generate full WhatsApp URL */
export function getWhatsAppUrl(customMessage?: string): string {
  const msg = customMessage ?? SITE_CONFIG.whatsappMessage;
  return `https://wa.me/${SITE_CONFIG.whatsapp}?text=${msg}`;
}
