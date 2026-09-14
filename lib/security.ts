/**
 * Security Utilities: Input Sanitization, Safe URL Validation, & Safe Error Shield
 * Dirancang aman dari CodeQL alerts (zero regex backtracking, zero multi-character vulnerabilities)
 */

// 1. Pembersih String dari bahaya XSS dan Script Injection berbasis Entity Encoding
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

// 2. Validator URL Aman untuk Tag <img> dan <a> (Cegah javascript: XSS / DOM Injection)
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  // Hanya izinkan protokol web aman (http://, https://) atau path relatif (/)
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
    return trimmed;
  }
  return '';
}

// 3. Safe Error Masker (Mencegah Database Error / Stack Trace bocor ke publik)
export function maskError(error: unknown): string {
  if (process.env.NODE_ENV === 'development') {
    if (error instanceof Error) return error.message;
  }
  return 'Terjadi kendala teknis yang aman. Silakan coba beberapa saat lagi.';
}
