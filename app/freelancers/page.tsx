'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, SlidersHorizontal, Users, Sparkles, CheckCircle2 } from 'lucide-react';
import { Profile } from '@/lib/types';
import * as dataLayer from '@/lib/dataLayer';
import FreelancerCard from '@/components/FreelancerCard';
import EmptyState from '@/components/EmptyState';

export default function FreelancersDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'working' | 'available'>('all');
  const [selectedSkill, setSelectedSkill] = useState<string>('Semua');
  const [maxPrice, setMaxPrice] = useState<number>(100000);
  const [loading, setLoading] = useState<boolean>(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  // Load data via unified Data Layer (otomatis pilih snapshot demo atau live Supabase)
  useEffect(() => {
    async function fetchProfiles() {
      try {
        const fetched = await dataLayer.getProfiles({ includeTesters: false });
        setProfiles(fetched);
      } catch (err) {
        console.warn('[FreelancersPage] DataLayer fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfiles();
  }, []);

  const allSkills = useMemo(() => {
    const skillsSet = new Set<string>();
    profiles.forEach((p) => {
      (p.skills || []).forEach((s) => skillsSet.add(s));
    });
    return ['Semua', ...Array.from(skillsSet)];
  }, [profiles]);

  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      // 1. Search Query
      const matchSearch =
        profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (profile.bio && profile.bio.toLowerCase().includes(searchQuery.toLowerCase()));

      // 2. Status Filter
      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'working'
          ? profile.is_working === true
          : profile.is_working === false;

      // 3. Skill Filter
      const matchSkill =
        selectedSkill === 'Semua'
          ? true
          : profile.skills.some((s) => s.toLowerCase() === selectedSkill.toLowerCase());

      // 4. Max Price Filter
      const matchPrice = (profile.base_price || 0) <= maxPrice;

      return matchSearch && matchStatus && matchSkill && matchPrice;
    });
  }, [profiles, searchQuery, statusFilter, selectedSkill, maxPrice]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header Section */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400">
          <Sparkles className="h-4 w-4" />
          <span>Talent Directory</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
          Direktori Lengkap Member Kreatif
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
          Temukan talent pelajar terbaik sesuai kebutuhan tugas sekolah, kuliah, dan event Anda. Pantau ketersediaan slot pengerjaan dan dapatkan rincian tarif transparan.
        </p>
      </div>

      {/* Filter & Control Bar */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4 sm:p-5 backdrop-blur-md space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Cari nama talent, keahlian (PPT, Video, Canva)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Status Working Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 text-xs sm:text-sm text-white focus:border-amber-400 focus:outline-none"
            >
              <option value="all">Semua Status Ketersediaan</option>
              <option value="available">Tersedia menerima order</option>
              <option value="working">Sedang mengerjakan pesanan</option>
            </select>
          </div>

          {/* Skill Selector */}
          <div>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 text-xs sm:text-sm text-white focus:border-amber-400 focus:outline-none"
            >
              {allSkills.map((s) => (
                <option key={s} value={s}>
                  Keahlian: {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Price Slider Filter */}
        <div className="pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <SlidersHorizontal className="h-3.5 w-3.5 text-amber-400" />
            <span>Maksimal Tarif Mulai Dari:</span>
            <strong className="text-amber-400 font-bold">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(maxPrice)}
            </strong>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-72">
            <input
              type="range"
              min="10000"
              max="150000"
              step="5000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer h-2 bg-zinc-800 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Grid of Freelancer Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Users className="h-4 w-4 text-amber-400" />
            <span>Menampilkan <strong className="text-white">{filteredProfiles.length}</strong> talent</span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-zinc-800/50 rounded-xl sm:rounded-2xl h-56 sm:h-64 border border-zinc-800/60"
              />
            ))}
          </div>
        ) : filteredProfiles.length === 0 ? (
          <EmptyState
            title="Tidak Ada Talent Ditemukan"
            description="Tidak ada talent yang sesuai dengan kriteria filter atau pencarian Anda."
            actionText="Reset Semua Filter"
            onAction={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setSelectedSkill('Semua');
              setMaxPrice(100000);
            }}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {filteredProfiles.map((profile) => (
              <FreelancerCard key={profile.id} profile={profile} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
