export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16">
      <div className="relative mb-6 flex h-14 w-14 items-center justify-center">
        <div className="absolute inset-0 rounded-2xl border-2 border-amber-500/20" />
        <div className="h-14 w-14 animate-spin rounded-2xl border-2 border-transparent border-t-amber-500" />
        <div className="h-4 w-4 rounded-full bg-amber-500/80 animate-pulse" />
      </div>
      <p className="text-xs font-medium tracking-wide text-zinc-400">
        Memuat data Creative Hub...
      </p>
    </div>
  );
}
