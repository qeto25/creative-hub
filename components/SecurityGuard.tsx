'use client';

import { useEffect } from 'react';

/**
 * SecurityGuard: Pelindung sisi klien (Client-side Security & Anti-Inspect)
 * - Mencegah klik kanan (Context Menu) agar menu 'Inspeksi' tidak muncul
 * - Memblokir shortcut keyboard DevTools (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U)
 * - Zero-overhead, murni native event listener tanpa memberatkan performa HP / Laptop
 */
export default function SecurityGuard() {
  useEffect(() => {
    // 1. Matikan Klik Kanan (Kecuali pada input / textarea agar user tetap bisa paste)
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return; // Izinkan klik kanan di dalam input jika butuh paste
      }
      e.preventDefault();
    };

    // 2. Blokir Shortcut DevTools & View Source
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+I (Inspect), Ctrl+Shift+J (Console), Ctrl+Shift+C (Inspect Element)
      if (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) {
        e.preventDefault();
        return false;
      }

      // Ctrl+U (View Page Source)
      if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        return false;
      }

      // Ctrl+S (Save page)
      if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        return false;
      }
    };

    // 3. Security Banner di Console
    try {
      const logBanner = console.info || console.warn;
      logBanner(
        '%c🛡️ CREATIVE HUB SECURITY SHIELD ACTIVE %c\nSistem keamanan aktif. Dilarang melakukan rekayasa balik atau eksploitasi.',
        'background: #f59e0b; color: #000; font-weight: bold; font-size: 14px; padding: 4px 8px; border-radius: 4px;',
        'color: #9ca3af; font-size: 12px;'
      );
    } catch {
      // safe fallback
    }

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return null;
}
