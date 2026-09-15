'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, ShieldCheck, Zap, Users, Trophy, Award, CheckCircle } from 'lucide-react';
import FreelancerCard from '@/components/FreelancerCard';
import ProjectCard from '@/components/ProjectCard';

import { Profile, Portfolio } from '@/lib/types';
import * as dataLayer from '@/lib/dataLayer';

const SKILL_FILTERS = [
  'Semua',
  'PPT Specialist',
  'Video Editor',
  'Fotografi',
  'UI Designer',
];

export default function HomePageClient() {
  const [selectedSkill, setSelectedSkill] = useState('Semua');
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);

  // Load data via unified Data Layer (otomatis pilih snapshot demo atau live Supabase)
  React.useEffect(() => {
    async function loadData() {
      try {
        const [fetchedProfiles, fetchedPortfolios] = await Promise.all([
          dataLayer.getProfiles({ includeTesters: false }),
          dataLayer.getPortfolios(),
        ]);
        setProfiles(fetchedProfiles);
        setPortfolios(fetchedPortfolios);
      } catch (err) {
        console.warn('[HomePage] DataLayer load exception:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const publishedProfiles = profiles.filter((p) => !p.is_tester && p.role !== 'owner');

  const filteredProfiles = selectedSkill === 'Semua'
    ? publishedProfiles
    : publishedProfiles.filter((p) => p.skills.some((s) => s.toLowerCase().includes(selectedSkill.toLowerCase())));

  // Portofolio teratas untuk preview kolektif (hanya talent yang telah dipublikasikan)
  const featuredPortfolios = portfolios
    .filter((port) => publishedProfiles.some((p) => p.id === port.profile_id))
    .slice(0, 4)
    .map((port) => ({
      ...port,
      profile: port.profile || publishedProfiles.find((p) => p.id === port.profile_id),
    }));

  return (
    <div className="space-y-24 pb-20 overflow-hidden">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION DARK LUXURY                                              */}
      {/* ========================================================================= */}
      <section className="relative pt-16 pb-12 sm:pt-24 sm:pb-16 lg:pt-32">
        {/* Background glow & radial lighting */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-[600px] rounded-full bg-gradient-to-tr from-amber-500/15 via-yellow-500/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-10 h-72 w-72 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge Agency Exclusive */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-300 backdrop-blur-md shadow-gold-glow mb-6"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>THE COLLECTIVE FOR HIGH-STAKES CREATIVE WORK</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.15]"
          >
            Curated Elite Freelancers <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Ready for Your Next Breakthrough
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 mx-auto max-w-xl text-base sm:text-lg text-zinc-400 leading-relaxed"
          >
            Spesialis presentasi investor, video komersial, fotografi produk, dan UI/UX.
            Transparan dari tarif, DP, hingga status pengerjaan — tanpa spekulasi.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href="/freelancers"
              className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-8 py-4 text-sm font-bold text-zinc-950 shadow-gold-glow-lg hover:from-amber-300 hover:to-amber-400 hover:scale-105 transition-all duration-300"
            >
              <span>Jelajahi Direktori Talent</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/projects"
              className="flex items-center gap-2 rounded-2xl border border-zinc-700/80 bg-zinc-900/80 px-8 py-4 text-sm font-semibold text-zinc-200 backdrop-blur-md hover:border-amber-400/60 hover:text-amber-400 hover:bg-zinc-800 transition-all duration-300"
            >
              <span>Lihat Showcase Proyek</span>
            </Link>
          </motion.div>

          {/* Agency Trust Badges */}
          <div className="mt-14 pt-8 border-t border-zinc-900 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-amber-400">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Talent Terkurasi</p>
                <p className="text-xs text-zinc-500">Seleksi portofolio & keahlian</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Sistem DP Transparan</p>
                <p className="text-xs text-zinc-500">Alur komitmen pengerjaan teratur</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-amber-400">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Status Kerja Terbuka</p>
                <p className="text-xs text-zinc-500">Pantau ketersediaan real-time</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-amber-400">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Portofolio Diverifikasi</p>
                <p className="text-xs text-zinc-500">Karya asli kurasi kolektif</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. FEATURED FREELANCER PROFILES GRID WITH 3D CARD ANIMATIONS              */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-widest mb-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Featured Creators</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Talenta Pilihan untuk Proyek Anda
            </h2>
          </div>

          {/* Quick Skill Filter Pills (Horizontal Scroll on Mobile) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1 whitespace-nowrap snap-x max-w-full">
            {SKILL_FILTERS.map((skill) => (
              <button
                key={skill}
                onClick={() => setSelectedSkill(skill)}
                className={`shrink-0 snap-start rounded-full px-3.5 sm:px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  selectedSkill === skill
                    ? 'bg-amber-500 text-zinc-950 shadow-gold-glow'
                    : 'border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* 3D Freelancer Cards Grid: Dense 4-5 Columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-zinc-800/50 rounded-xl sm:rounded-2xl h-56 sm:h-64 border border-zinc-800/60"
              />
            ))
          ) : (
            filteredProfiles.map((profile) => (
              <div key={profile.id} className="h-full">
                <FreelancerCard
                  profile={profile}
                  hiredCount={profile.hire_count}
                  completedProjects={profile.hire_count}
                />
              </div>
            ))
          )}
        </div>

        {/* View All CTA */}
        <div className="mt-8 sm:mt-10 text-center">
          <Link
            href="/freelancers"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-400 hover:text-amber-300 group"
          >
            <span>Buka Direktori Lengkap Seluruh Member</span>
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. COLLECTIVE SHOWCASE PREVIEW                                            */}
      {/* ========================================================================= */}
      <section className="border-y border-zinc-800/80 bg-zinc-950/60 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">
                Our Work
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                Karya Pilihan Kolektif
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                Eksplorasi hasil kolaborasi tim kreatif kami dengan berbagai brand & startup.
              </p>
            </div>

            {featuredPortfolios.length > 0 && (
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-zinc-200 hover:border-amber-400/50 hover:text-amber-400 transition-colors"
              >
                Semua Proyek ({portfolios.length})
              </Link>
            )}
          </div>

          {/* Compact 3-4 Columns Showcase Grid */}
          {featuredPortfolios.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-zinc-700/60 bg-zinc-900/30 text-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <Sparkles className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-200">Showcase Sedang Dikurasi</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                  Karya terbaik kolektif kami sedang dalam proses seleksi. Pantau terus perkembangannya.
                </p>
              </div>
              <Link
                href="/freelancers"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
              >
                Lihat Direktori Talent <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {featuredPortfolios.map((item) => (
                <div key={item.id} className="h-full">
                  <ProjectCard portfolio={item} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. HOW IT WORKS / ESCROW & DP TRANSPARENCY                                 */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900/90 via-zinc-900/50 to-zinc-950 p-8 sm:p-12 lg:p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="max-w-2xl">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">
              Standard Operasional
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-2 leading-tight">
              Alur Transparan, Tanpa Spekulasi Harga
            </h2>
            <p className="text-sm text-zinc-400 mt-4 leading-relaxed">
              Setiap talenta di Creative Hub memiliki tarif dasar yang telah distandardisasi serta sistem DP teratur, memastikan komitmen pengerjaan tepat waktu tanpa risiko bagi kedua belah pihak.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">
                1
              </div>
              <h3 className="text-base font-bold text-white">Pilih & Cek Ketersediaan</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Lihat portofolio talent dan periksa indikator status "Tersedia menerima order" atau "Sedang mengerjakan pesanan" sebelum memulai kontak.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">
                2
              </div>
              <h3 className="text-base font-bold text-white">Direct WhatsApp Booking</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Gunakan tombol booking WhatsApp dengan template pesan otomatis yang sudah memuat detail rate, persentase DP, dan spesialisasi.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">
                3
              </div>
              <h3 className="text-base font-bold text-white">DP & Kickoff Project</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Kunci jadwal kerja talent dengan transfer DP sesuai ketentuan, talent akan mengaktifkan status "Sedang mengerjakan pesanan".
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
