'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log server/render error internally
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-500">
        <AlertTriangle className="h-8 w-8" />
      </div>

      <h1 className="mb-2 text-2xl sm:text-3xl font-bold tracking-tight text-white">
        Terjadi Kendala Teknis
      </h1>
      <p className="mx-auto mb-8 max-w-md text-sm text-zinc-400">
        Sistem sedang mengalami kendala sementara saat memuat data halaman ini. Tim kami telah menerima pemberitahuan otomatis.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-zinc-950 transition-colors duration-200 hover:bg-amber-400"
        >
          <RotateCcw className="h-4 w-4" />
          Coba Muat Ulang
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-zinc-200 transition-colors duration-200 hover:border-zinc-700 hover:text-white"
        >
          <Home className="h-4 w-4" />
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
