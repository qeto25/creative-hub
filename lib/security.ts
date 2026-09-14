/**
 * Security Utilities: Input Sanitization, XSS Prevention, & Safe Error Shield
 * Dirancang ringan, zero-dependency, dan zero-overhead untuk menjaga kecepatan web.
 */

// 1. Pembersih String dari bahaya XSS dan Script Injection
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Hapus blok script
    .replace(/<[^>]+>/g, '') // Hapus tag HTML
    .replace(/[<>"'&]/g, (char) => {
      const escapeMap: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;',
      };
      return escapeMap[char] || char;
    })
    .trim();
}

// 2. Safe Error Masker (Mencegah Database Error / Stack Trace bocor ke publik)
export function maskError(error: unknown): string {
  if (process.env.NODE_ENV === 'development') {
    if (error instanceof Error) return error.message;
  }
  // Di production, selalu kembalikan pesan ramah tanpa membocorkan struktur internal server
  return 'Terjadi kendala teknis yang aman. Silakan coba beberapa saat lagi.';
}
