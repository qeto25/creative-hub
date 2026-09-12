'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Sparkles, FolderKanban } from 'lucide-react';
import { Portfolio } from '@/lib/types';
import * as dataLayer from '@/lib/dataLayer';
import ProjectCard from '@/components/ProjectCard';

const CATEGORIES = [
  'Semua',
  'PPT Specialist',
  'Video Editor',
  'Fotografi',
  'UI Designer',
];

export default function ProjectsPage() {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data via unified Data Layer (otomatis pilih snapshot demo atau live Supabase)
  useEffect(() => {
    async function loadData() {
      try {
        const fetched = await dataLayer.getPortfolios();
        setPortfolios(fetched);
      } catch (err) {
        console.warn('[ProjectsPage] DataLayer fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredPortfolios = useMemo(() => {
    if (selectedCategory === 'Semua') return portfolios;
    return portfolios.filter(
      (p) => p.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [portfolios, selectedCategory]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400">
          <Sparkles className="h-4 w-4" />
          <span>Collective Archive</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Showcase Portofolio Tim Kolektif
        </h1>
        <p className="text-sm text-zinc-400 max-w-2xl">
          Kumpulan hasil karya terbaik dari seluruh talenta terpilih di Creative Hub. Setiap karya dilengkapi dengan atribusi langsung ke kreatornya.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-full px-5 py-2 text-xs font-semibold transition-all duration-200 ${
              selectedCategory === cat
                ? 'bg-amber-500 text-zinc-950 shadow-gold-glow'
                : 'border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Projects Grid: Dense 3-4 Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {filteredPortfolios.map((portfolio) => (
          <ProjectCard key={portfolio.id} portfolio={portfolio} />
        ))}
      </div>
    </div>
  );
}
