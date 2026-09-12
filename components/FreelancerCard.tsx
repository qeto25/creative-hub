'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, Briefcase, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Profile } from '@/lib/types';
import { formatRupiahDisplay } from '@/lib/utils/currency';

interface FreelancerCardProps {
  profile: Profile;
}

export default function FreelancerCard({ profile }: FreelancerCardProps) {
  const isSuspended = !!profile.is_suspended;
  const hasForcedPrice = profile.forced_price !== null && profile.forced_price !== undefined;
  const effectivePrice = hasForcedPrice ? profile.forced_price! : (profile.base_price || 20000);
  const formattedPrice = formatRupiahDisplay(effectivePrice);
  const currentStatus = profile.availability_status || (profile.is_available === false ? 'resting' : profile.is_working ? 'busy' : 'available');

  return (
    <Link href={`/freelancers/${profile.id}`} className="block h-full group focus:outline-none">
      <motion.div
        layoutId={`card-${profile.id}`}
        className={`relative flex flex-col h-full overflow-hidden rounded-2xl border bg-zinc-950/90 backdrop-blur-md transition-all duration-300 group-hover:border-amber-500/50 cursor-pointer shadow-lg ${
          isSuspended ? 'border-red-900/60 opacity-85' : 'border-zinc-800/90'
        }`}
        style={{ perspective: 1000 }}
        whileHover={{
          scale: 1.02,
          y: -4,
          boxShadow: isSuspended
            ? '0 0 25px rgba(239, 68, 68, 0.2), 0 15px 20px -5px rgba(0, 0, 0, 0.7)'
            : '0 0 25px rgba(234, 179, 8, 0.2), 0 15px 20px -5px rgba(0, 0, 0, 0.7)',
          transition: { type: 'spring', stiffness: 350, damping: 22 },
        }}
        whileTap={{ scale: 0.98 }}
      >
        {/* ========================================================================= */}
        {/* BAGIAN ATAS: FOTO FULL-BLEED BANNER COVER ASPECT-[4/4.8]                  */}
        {/* ========================================================================= */}
        <div className="relative w-full aspect-[4/4.8] overflow-hidden bg-zinc-900 rounded-t-2xl">
          <Image
            src={profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80'}
            alt={profile.full_name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            priority={false}
          />

          {/* Subtle Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/50 pointer-events-none" />

          {/* SANKSI / SUSPENSION OVERLAY JIKA DISUSPEND */}
          {isSuspended && (
            <div className="absolute inset-0 z-20 bg-zinc-950/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-3 text-center">
              <div className="w-9 h-9 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mb-1.5 shadow-lg">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-red-300">Talenta Nonaktif</span>
              <span className="text-[10px] text-red-400/90 mt-0.5 font-medium">Sedang Disanksi Owner</span>
            </div>
          )}

          {/* BADGE ATAS FOTO: STATUS (KIRI) & TOTAL ORDER (KANAN) */}
          <div className="absolute top-3 inset-x-3 flex justify-between items-center z-10">
            {/* Status Kiri */}
            {isSuspended ? (
              <div className="inline-flex items-center gap-1 rounded-full border border-red-500/70 bg-red-950/90 px-2 py-0.5 text-[10px] font-bold text-red-300 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse"></span>
                <span>⛔ Skors</span>
              </div>
            ) : currentStatus === 'resting' ? (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/50 bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                <span>Ujian/Rehat</span>
              </div>
            ) : currentStatus === 'busy' ? (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/50 bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex h-full w-full rounded-full bg-blue-500"></span>
                </span>
                <span>Ada Job Aktif</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                <span>Siap Order</span>
              </div>
            )}

            {/* Total Order Kanan */}
            <div className="text-[10px] bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-zinc-700/60 font-medium text-zinc-200 inline-flex items-center gap-1">
              <Briefcase className="h-2.5 w-2.5 text-amber-400" />
              <span>{profile.hire_count || 0}x Hired</span>
            </div>
          </div>

          {/* BADGE BAWAH FOTO: RATING BINTANG */}
          <div className="absolute bottom-3 left-3 z-10">
            <div className="flex items-center gap-1 rounded-md bg-black/70 px-2 py-0.5 text-[10px] sm:text-xs font-bold text-amber-300 backdrop-blur-md border border-amber-500/30">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>{(profile.rating || 5.0).toFixed(1)}</span>
              <span className="text-zinc-400 font-normal">({profile.review_count || 0})</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CARD BODY & BRANDING HARGA PELAJAR                                        */}
        {/* ========================================================================= */}
        <div className="p-3.5 space-y-2 bg-zinc-950 rounded-b-2xl border-x border-b border-zinc-800/80 flex flex-col justify-between flex-1">
          <div>
            {/* Nama Talent */}
            <div className="flex items-center justify-between gap-1">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide group-hover:text-amber-400 transition-colors truncate">
                {profile.full_name}
              </h3>
              <Sparkles className="h-3.5 w-3.5 text-amber-400/40 group-hover:text-amber-400 transition-colors shrink-0" />
            </div>

            {/* Skills Tags */}
            <div className="mt-1.5 flex flex-wrap gap-1">
              {(profile.skills || []).slice(0, 2).map((skill, index) => (
                <span
                  key={index}
                  className="text-[11px] bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-zinc-300 truncate max-w-[120px]"
                >
                  {skill}
                </span>
              ))}
              {(profile.skills || []).length > 2 && (
                <span className="text-[11px] bg-zinc-900/60 px-1.5 py-0.5 rounded border border-zinc-800/80 text-zinc-500">
                  +{profile.skills.length - 2}
                </span>
              )}
            </div>
          </div>

          {/* Footer Harga Ramah Kantong */}
          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-1">
            {isSuspended ? (
              <>
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase tracking-wider text-red-400 font-medium truncate">
                    Status Akun
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-red-400 tracking-tight truncate">
                    Ditangguhkan
                  </span>
                </div>
                <div className="flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-300 shrink-0">
                  <span>Nonaktif</span>
                </div>
              </>
            ) : hasForcedPrice && profile.forced_price === 0 ? (
              <>
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase tracking-wider text-amber-400 font-medium truncate">
                    Kompensasi Sanksi
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-emerald-400 tracking-tight truncate">
                    Rp 0 (Gratis)
                  </span>
                </div>
                <div className="flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300 shrink-0">
                  <span>Khusus</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-medium truncate">
                    {hasForcedPrice ? 'Tarif Khusus' : 'Harga Pelajar Mulai Dari'}
                  </span>
                  <span className={`text-xs sm:text-sm font-extrabold tracking-tight truncate ${hasForcedPrice ? 'text-red-400' : 'text-amber-400'}`}>
                    {formattedPrice}
                  </span>
                </div>

                <div className="flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300 shrink-0">
                  <CheckCircle2 className="h-2.5 w-2.5 text-amber-400" />
                  <span>DP {profile.dp_percentage || 30}%</span>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
