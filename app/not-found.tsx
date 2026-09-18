import Link from 'next/link';
import { Compass, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-500">
        <Compass className="h-8 w-8" />
      </div>

      <span className="mb-2 inline-block rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
        Error 404
      </span>

      <h1 className="mb-2 text-2xl sm:text-3xl font-bold tracking-tight text-white">
        Halaman Tidak Ditemukan
      </h1>
      <p className="mx-auto mb-8 max-w-md text-sm text-zinc-400">
        Tautan yang Anda tuju mungkin telah dipindahkan, dihapus, atau alamat URL yang Anda masukkan salah.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-zinc-950 transition-colors duration-200 hover:bg-amber-400"
        >
          <Home className="h-4 w-4" />
          Beranda Utama
        </Link>
        <Link
          href="/freelancers"
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-zinc-200 transition-colors duration-200 hover:border-zinc-700 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Jelajahi Freelancer
        </Link>
      </div>
    </div>
  );
}
