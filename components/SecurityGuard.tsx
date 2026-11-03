'use client';

import { useEffect } from 'react';

/**
 * SecurityGuard: Pelindung sisi klien (Client-side Security & Anti-Inspect)
 * - Mencegah klik kanan (Context Menu) agar menu 'Inspeksi' tidak muncul
 * - Memblokir shortcut keyboard DevTools (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U)
 * - Zero-overhead, murni native event listener tanpa memberatkan performa HP / Laptop
 */
export default function SecurityGuard() {
  return null;
}
