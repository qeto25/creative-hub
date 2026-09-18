'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Star,
  Briefcase,
  CheckCircle2,
  MessageSquare,
  ArrowLeft,
  Sparkles,
  Clock,
  ShieldCheck,
  Calculator,
  PlusCircle,
  Wrench,
  Package,
  RotateCcw,
  Zap,
  FileCode,
  Share2,
  Check,
} from 'lucide-react';
import { Profile, Portfolio, Review, Booking } from '@/lib/types';
import * as dataLayer from '@/lib/dataLayer';
import { formatRupiah, parseRupiah, formatRupiahDisplay } from '@/lib/utils/currency';
import ReviewModal from '@/components/ReviewModal';
import BookingModal from '@/components/BookingModal';
import { getTalentStatus } from '@/lib/utils/status';
import { getVerifiedProfile } from '@/app/actions/profile';

export default function FreelancerDetailPage() {
  const params = useParams();
  const profileId = params?.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isDraft, setIsDraft] = useState(false);
  const [canViewDraft, setCanViewDraft] = useState(false);
  const [loading, setLoading] = useState(true);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [activeMediaFilter, setActiveMediaFilter] = useState<'all' | 'image' | 'video'>('all');
  const [copiedShare, setCopiedShare] = useState(false);

  // Interactive DP Calculator State: initialized safely with fallback
  const [customProjectCost, setCustomProjectCost] = useState<number>(20000);
  const [costInput, setCostInput] = useState<string>('20.000');

  // Load data via server-verified action (guarantees zero draft leak without valid owner server session)
  useEffect(() => {
    async function fetchLiveData() {
      try {
        const res = await getVerifiedProfile(profileId);
        setIsDraft(res.isDraft);
        setCanViewDraft(res.canViewDraft);
        if (res.profile) {
          setProfile(res.profile);
          setPortfolios(res.portfolios);
          setReviews(res.reviews);
        } else {
          setProfile(null);
          setPortfolios([]);
          setReviews([]);
        }
      } catch (err) {
        console.warn('[FreelancerDetailPage] getVerifiedProfile error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLiveData();
  }, [profileId]);

  // Sync customProjectCost if base_price or forced_price changes
  useEffect(() => {
    if (!profile) return;
    const cost = profile.forced_price !== null && profile.forced_price !== undefined
      ? profile.forced_price
      : (profile.base_price || 20000);
    setCustomProjectCost(cost);
    setCostInput(formatRupiah(cost));
  }, [profile?.base_price, profile?.forced_price]);

  const filteredPortfolios = useMemo(() => {
    if (activeMediaFilter === 'all') return portfolios;
    return portfolios.filter((p) => p.media_type === activeMediaFilter);
  }, [portfolios, activeMediaFilter]);

  const handleNewReview = (newReview: Review) => {
    setReviews((prev) => [newReview, ...prev]);
  };

  const handleShare = async () => {
    if (!profile) return;
    const shareData = {
      title: `${profile.full_name} - Creative Hub`,
      text: `Lihat profil kreator ${profile.full_name} di Creative Hub!`,
      url: typeof window !== 'undefined' ? window.location.href : '',
    };
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // user cancelled share
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  // Status & Suspension Guards (Called AFTER all hooks)
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-zinc-400">Memuat profil kreator...</p>
        </div>
      </div>
    );
  }

  // Privasi Profil Draft: Jika profil draft dan pengunjung BUKAN owner terverifikasi server
  if (isDraft && !canViewDraft) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-4 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 backdrop-blur-md shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Profil Belum Tersedia</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Profil kreator ini masih dalam tahap peninjauan internal dan belum dipublikasikan untuk umum. Silakan telusuri talenta terverifikasi kami di Direktori Talent.
          </p>
          <div className="pt-2">
            <Link
              href="/freelancers"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl transition shadow-gold-glow cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Direktori Talent</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold text-white">Profil Tidak Ditemukan</h2>
          <p className="text-xs text-zinc-400">Kreator dengan identitas ini belum terdaftar atau telah dinonaktifkan.</p>
          <Link href="/freelancers" className="inline-block px-4 py-2 text-xs font-semibold bg-amber-500 text-black rounded-xl">Kembali ke Direktori</Link>
        </div>
      </div>
    );
  }

  const isSuspended = !!profile.is_suspended;
  const statusMeta = getTalentStatus({
    availabilityStatus: profile.availability_status,
    isWorking: profile.is_working,
    isAvailable: profile.is_available,
    isSuspended: profile.is_suspended,
  });
  const isResting = statusMeta.key === 'resting';
  const isBusy = statusMeta.key === 'busy';
  const hasForcedPrice = profile.forced_price !== null && profile.forced_price !== undefined;
  const effectiveBasePrice = hasForcedPrice ? profile.forced_price! : (profile.base_price || 20000);
  const formattedBasePrice = hasForcedPrice && profile.forced_price === 0
    ? 'Rp 0 (Kompensasi)'
    : formatRupiahDisplay(effectiveBasePrice);

  const calculatedDp = Math.round((customProjectCost * (profile.dp_percentage || 30)) / 100);
  const calculatedRemaining = customProjectCost - calculatedDp;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12 pb-24 sm:pb-8">
      {/* Back button & Owner Draft Preview Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/freelancers"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Direktori Talent</span>
        </Link>

        {isDraft && canViewDraft && (
          <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 px-3.5 py-1.5 text-[11px] font-bold text-amber-300 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Mode Peninjauan Owner: Profil ini belum dipublikasikan untuk umum</span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. TALENT HEADER WITH LUXURY COVER BANNER & SHARED ELEMENT ANIMATION      */}
      {/* ========================================================================= */}
      <motion.div
        layoutId={`card-${profile.id}`}
        className="rounded-3xl border border-zinc-800 bg-zinc-900/90 backdrop-blur-md relative overflow-hidden shadow-xl"
      >
        {/* BACKGROUND COVER BANNER */}
        <div className="relative h-48 sm:h-64 lg:h-72 w-full overflow-hidden bg-zinc-950">
          {profile.cover_url ? (
            <Image
              src={profile.cover_url}
              alt={`${profile.full_name} Cover`}
              fill
              priority
              sizes="(max-width: 1200px) 96vw, 1200px"
              className="object-cover object-center"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950" />
          )}
          {/* Dark luxury gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-zinc-950/40" />
          <div className="absolute top-0 right-0 h-full w-1/2 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
        </div>

        {/* PROFILE BODY OVERLAY */}
        <div className="relative z-10 px-6 sm:px-8 lg:px-10 pb-10 -mt-24 sm:-mt-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Avatar Photo with matching layoutId & mobile compact bounds */}
            <div className="lg:col-span-4 h-64 sm:h-80 lg:aspect-[4/5] lg:h-auto rounded-2xl overflow-hidden bg-zinc-950 border-2 border-zinc-700/80 relative shadow-xl">
              <Image
                src={profile.avatar_url}
                alt={profile.full_name}
                fill
                priority
                sizes="(max-width: 64rem) 320px, 400px"
                className="object-cover object-top"
              />
              {/* Live Indicator on Top */}
              <div className="absolute top-4 left-4 z-10">
                <div className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md shadow-md ${statusMeta.badgeClass}`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${statusMeta.dotClass}`}></span>
                  <span>{statusMeta.label}</span>
                </div>
              </div>
            </div>

            {/* Talent Information & Bio */}
            <div className="lg:col-span-8 flex flex-col justify-between h-full space-y-6 pt-2">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-wide">
                        {profile.full_name}
                      </h1>
                      <button
                        type="button"
                        onClick={handleShare}
                        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700/80 bg-zinc-800/80 px-3 py-1 text-xs font-semibold text-zinc-300 hover:text-white hover:border-amber-400 transition-colors shadow-sm"
                        title="Bagikan Profil Talent"
                      >
                        {copiedShare ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Tersalin! ✅</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="h-3.5 w-3.5 text-amber-400" />
                            <span>Bagikan</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-amber-400 mt-1">
                      {profile.skills?.join(' • ')}
                    </p>
                  </div>

                  {/* Star Rating Badge */}
                  <div className="flex items-center gap-2 rounded-xl bg-zinc-950/90 border border-amber-500/40 px-4 py-2 text-sm font-bold text-amber-300 backdrop-blur-md">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span>{(profile.rating || 5.0).toFixed(1)}</span>
                    <span className="text-zinc-500 text-xs font-normal">
                      ({reviews.length} ulasan)
                    </span>
                  </div>
                </div>

                {/* Bio */}
                <div className="mt-5 space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Tentang Talent
                  </h3>
                  <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                    {profile.bio}
                  </p>
                </div>

                {/* TOOLS & SOFTWARE MASTERY BADGES */}
                {profile.tools && profile.tools.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      <Wrench className="h-3.5 w-3.5 text-amber-400" />
                      <span>Software & Tools Mastery</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profile.tools.map((tool) => (
                        <span
                          key={tool}
                          className="rounded-xl border border-zinc-700/80 bg-zinc-950/80 px-3 py-1.5 text-xs font-semibold text-zinc-200 shadow-sm"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Metrics */}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-[repeat(3,minmax(0,1fr))] gap-4 pt-6 border-t border-zinc-800">
                  <div className="rounded-xl bg-zinc-950/60 p-3.5 border border-zinc-800/80">
                    <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Total Hired</span>
                    <p className="text-lg font-bold text-white mt-0.5">{profile.hire_count || 0}x Diselesaikan</p>
                  </div>

                  <div className="rounded-xl bg-zinc-950/60 p-3.5 border border-zinc-800/80">
                    <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Wajib DP</span>
                    <p className="text-lg font-bold text-amber-400 mt-0.5">{profile.dp_percentage || 30}% di Awal</p>
                  </div>

                  <div className="rounded-xl bg-zinc-950/60 p-3.5 border border-zinc-800/80 col-span-2 sm:col-span-1">
                    <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Tarif Mulai</span>
                    <p className="text-lg font-bold text-white mt-0.5">{formattedBasePrice}</p>
                  </div>
                </div>
              </div>

              {/* BOOKING TRIGGER MODAL BUTTON */}
              <div className="pt-6 border-t border-zinc-800 flex flex-col sm:flex-row gap-4 items-center">
                {isSuspended || isResting ? (
                  <button
                    type="button"
                    disabled
                    className="w-full sm:w-auto flex-1 flex items-center justify-center gap-3 rounded-2xl bg-zinc-900/90 border border-amber-500/40 px-8 py-4 text-sm font-bold text-zinc-400 cursor-not-allowed"
                  >
                    <span>🟡 Tidak tersedia sementara</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setBookingModalOpen(true)}
                    className="w-full sm:w-auto flex-1 flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 px-8 py-4 text-sm font-extrabold text-zinc-950 shadow-gold-glow-lg hover:scale-105 hover:from-amber-300 hover:to-amber-500 transition-colors duration-200 duration-300 cursor-pointer"
                  >
                    <MessageSquare className="h-5 w-5" />
                    <span>Hire {profile.full_name} / Booking Project</span>
                  </button>
                )}

                <button
                  onClick={() => setReviewModalOpen(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-800/90 px-6 py-4 text-sm font-semibold text-zinc-200 hover:border-amber-400/50 hover:text-amber-400 transition-colors"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Beri Rating</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ========================================================================= */}
      {/* 2. SERVICE SPECS GRID (COMPACT 2-COLUMN HP FRIENDLY)                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,1fr))] gap-2.5 sm:gap-4">
        {/* Box 1: Durasi Pengerjaan & Deliverables */}
        <div className="rounded-2xl sm:rounded-3xl border border-zinc-800 bg-zinc-900/60 p-3.5 sm:p-5 backdrop-blur-md space-y-3">
          <div className="flex items-center gap-2.5 text-amber-400">
            <div className="flex min-h-[44px] min-w-[44px] p-2.5 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">Durasi Pengerjaan</span>
              <h4 className="text-xs sm:text-base font-bold text-white leading-tight">{profile.turnaround_time || '2-4 Hari Kerja'}</h4>
            </div>
          </div>

          <div className="pt-2 sm:pt-3 border-t border-zinc-800/80 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-zinc-300">
              <Package className="h-3.5 w-3.5 text-amber-400" />
              <span>Deliverables:</span>
            </div>
            <ul className="space-y-0.5 text-[10px] sm:text-xs text-zinc-400">
              {(profile.deliverables || ['High-Res JPG/PNG', 'PDF']).map((del, i) => (
                <li key={i} className="flex items-center gap-1.5 truncate">
                  <span className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-amber-400 shrink-0"></span>
                  <span className="truncate">{del}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Box 2: Kebijakan Revisi */}
        <div className="rounded-2xl sm:rounded-3xl border border-zinc-800 bg-zinc-900/60 p-3.5 sm:p-5 backdrop-blur-md space-y-3">
          <div className="flex items-center gap-2.5 text-emerald-400">
            <div className="flex min-h-[44px] min-w-[44px] p-2.5 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 shrink-0">
              <RotateCcw size={20} />
            </div>
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">Kebijakan Revisi</span>
              <h4 className="text-xs sm:text-base font-bold text-white leading-tight">{profile.free_revisions || 1}x Minor Gratis</h4>
            </div>
          </div>

          <div className="pt-2 sm:pt-3 border-t border-zinc-800/80 space-y-1 text-[10px] sm:text-xs text-zinc-400">
            <p>
              Revisi ekstra: <strong className="text-white">{formatRupiahDisplay(profile.extra_revision_fee || 3000)}</strong>/revisi.
            </p>
            {profile.revision_notes && (
              <p className="text-[10px] text-zinc-500 italic line-clamp-2">
                "{profile.revision_notes}"
              </p>
            )}
          </div>
        </div>

        {/* Box 3: Add-on Availability */}
        <div className="col-span-2 lg:col-span-1 rounded-2xl sm:rounded-3xl border border-zinc-800 bg-zinc-900/60 p-3.5 sm:p-5 backdrop-blur-md space-y-3">
          <div className="flex items-center gap-2.5 text-amber-400">
            <div className="flex min-h-[44px] min-w-[44px] p-2.5 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 shrink-0">
              <Zap size={20} />
            </div>
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">Opsi Add-on</span>
              <h4 className="text-xs sm:text-base font-bold text-white leading-tight">Kilat & Source File</h4>
            </div>
          </div>

          <div className="pt-2 sm:pt-3 border-t border-zinc-800/80 space-y-1.5 text-[10px] sm:text-xs">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 flex items-center gap-1">
                <Zap className="h-3 w-3 text-amber-400" /> Rush Order:
              </span>
              <strong className="text-white">+{formatRupiahDisplay(profile.rush_fee || 10000)}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 flex items-center gap-1">
                <FileCode className="h-3 w-3 text-amber-400" /> Source File:
              </span>
              <strong className="text-white">+{formatRupiahDisplay(profile.source_file_price || 5000)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SIMULASI & KALKULATOR DP                                               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 backdrop-blur-md space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Simulasi & Kalkulator DP</h3>
              <p className="text-xs text-zinc-400">Transparansi alokasi pembayaran jasa pengerjaan</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold text-zinc-300 mb-2">
                <span>Perkiraan Total Biaya Proyek Anda:</span>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 font-bold">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="20.000"
                    value={costInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      const num = parseRupiah(val);
                      setCustomProjectCost(num);
                      setCostInput(formatRupiah(num));
                    }}
                    className="w-40 rounded-xl border border-zinc-700 bg-zinc-950 py-1.5 px-3 text-sm font-extrabold text-amber-400 focus:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400"
                  />
                </div>
              </div>
              <input
                type="range"
                min={profile.base_price || 20000}
                max={Math.max((profile.base_price || 20000) * 10, 200000)}
                step="5000"
                value={customProjectCost}
                onChange={(e) => {
                  const num = Number(e.target.value);
                  setCustomProjectCost(num);
                  setCostInput(formatRupiah(num));
                }}
                className="w-full accent-amber-400 cursor-pointer h-2 bg-zinc-800 rounded-lg"
              />
              <div className="flex justify-between text-[11px] text-zinc-500 mt-1">
                <span>Mulai: {formattedBasePrice}</span>
                <span>Preset: {formatRupiahDisplay(Math.max((profile.base_price || 20000) * 10, 200000))}</span>
              </div>
            </div>

            {/* Breakdown Result */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">
                  Uang Muka (DP {profile.dp_percentage || 30}%)
                </span>
                <p className="text-xl font-extrabold text-amber-400 mt-1">
                  {formatRupiahDisplay(calculatedDp)}
                </p>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Dibayarkan saat persetujuan brief pengerjaan dimulai.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Pelunasan Akhir ({100 - (profile.dp_percentage || 30)}%)
                </span>
                <p className="text-xl font-extrabold text-white mt-1">
                  {formatRupiahDisplay(calculatedRemaining)}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Dibayarkan setelah seluruh revisi & file final diserahterimakan.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Agency Guarantee Box */}
        <div className="lg:col-span-5 rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 sm:p-8 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              <span>Jaminan Creative Hub</span>
            </div>
            <h4 className="text-lg font-bold text-white">
              SOP Pengerjaan Resmi Kolektif
            </h4>
            <ul className="space-y-2.5 text-xs text-zinc-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Penyelarasan standar visual dengan pengawasan kurator kolektif.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Garansi penggantian talent jika terjadi kendala tak terduga.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>DP aman dalam skema kesepakatan formal tanpa risiko ghosting.</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-zinc-900 text-xs text-zinc-500">
            Ada pertanyaan khusus? Hubungi tim admin agensi kami melalui concierge resmi.
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. SHOWCASE / PORTOFOLIO GALERI                                           */}
      {/* ========================================================================= */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Galeri Portofolio Hasil Karya</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Sampel proyek terverifikasi yang pernah dikerjakan oleh {profile.full_name}
            </p>
          </div>

          {/* Filter media type */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            <button
              onClick={() => setActiveMediaFilter('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeMediaFilter === 'all' ? 'bg-zinc-800 text-amber-400' : 'text-zinc-400'
              }`}
            >
              Semua ({portfolios.length})
            </button>
            <button
              onClick={() => setActiveMediaFilter('image')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeMediaFilter === 'image' ? 'bg-zinc-800 text-amber-400' : 'text-zinc-400'
              }`}
            >
              Foto & Desain
            </button>
            <button
              onClick={() => setActiveMediaFilter('video')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeMediaFilter === 'video' ? 'bg-zinc-800 text-amber-400' : 'text-zinc-400'
              }`}
            >
              Video
            </button>
          </div>
        </div>

        {filteredPortfolios.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,1fr))] gap-6">
            {filteredPortfolios.map((item) => (
              <div
                key={item.id}
                className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 transition-colors duration-200 hover:border-amber-500/40"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
                  <Image
                    src={item.media_url}
                    alt={item.title || 'Portofolio'}
                    width={500}
                    height={280}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="rounded-full bg-zinc-950/80 border border-zinc-700/60 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-300 backdrop-blur-md">
                      {item.category}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className="mt-2 text-xs text-zinc-400 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center text-xs text-zinc-400">
            Belum ada item portofolio untuk kategori ini.
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. CLIENT REVIEWS & TESTIMONIALS                                          */}
      {/* ========================================================================= */}
      <div className="space-y-6 pt-6 border-t border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-white">Ulasan Klien</h2>
              <span className="flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold text-amber-400">
                <Star className="h-3 w-3 fill-amber-400" />
                {(profile.rating || 5.0).toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Feedback otentik dari klien yang pernah berkolaborasi langsung.
            </p>
          </div>

          <button
            onClick={() => setReviewModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-zinc-950 shadow-gold-glow hover:bg-amber-400 transition-colors duration-200"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Tulis Ulasan Anda</span>
          </button>
        </div>

        {reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{rev.client_name}</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-3.5 w-3.5 ${
                          s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  "{rev.comment}"
                </p>
                {rev.created_at && (
                  <p className="text-[10px] text-zinc-500">
                    {new Date(rev.created_at).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 text-center text-xs text-zinc-400">
            Belum ada ulasan untuk talent ini. Jadilah yang pertama memberikan review!
          </div>
        )}
      </div>

      {/* Review Modal Form */}
      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        profileId={profile.id}
        talentName={profile.full_name}
        onReviewSubmitted={handleNewReview}
      />

      {/* Booking Modal with Brief & Deadline Form */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        profile={profile}
      />

      {/* STICKY BOTTOM ACTION BAR (Khusus Layar HP) */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 z-40 flex items-center justify-between sm:hidden shadow-xl">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
            {hasForcedPrice && profile.forced_price === 0 ? 'Kompensasi' : 'Mulai dari'}
          </span>
          <span className={`text-base font-extrabold ${isSuspended ? 'text-red-400' : 'text-amber-400'}`}>
            {isSuspended ? 'Nonaktif' : formattedBasePrice}
          </span>
        </div>
        {isSuspended || isResting ? (
          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-800 px-4 py-2.5 text-xs font-bold text-zinc-400 cursor-not-allowed border border-amber-500/30"
          >
            <span>Tidak tersedia sementara</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setBookingModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-extrabold text-zinc-950 shadow-gold-glow hover:bg-amber-400 transition-colors duration-200 active:scale-95"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Hire Sekarang</span>
          </button>
        )}
      </div>
    </div>
  );
}
