/**
 * Utility untuk masking dan formatting mata uang Rupiah Indonesia
 */

export function formatRupiah(value: number | string): string {
  if (value === undefined || value === null || value === '') return '';
  
  // Konversi ke string dan hapus semua karakter selain digit
  const stringValue = typeof value === 'number' ? Math.round(value).toString() : value.toString();
  const cleanDigits = stringValue.replace(/\D/g, '');
  
  if (!cleanDigits) return '';

  // Format dengan pemisah ribuan titik (.)
  return cleanDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function parseRupiah(value: string | number): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : Math.round(value);
  if (!value) return 0;
  
  // Hapus semua karakter non-digit
  const cleanDigits = value.toString().replace(/\D/g, '');
  if (!cleanDigits) return 0;
  
  const parsed = parseInt(cleanDigits, 10);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatRupiahDisplay(value: number | string): string {
  const formatted = formatRupiah(value);
  return formatted ? `Rp ${formatted}` : 'Rp 0';
}
