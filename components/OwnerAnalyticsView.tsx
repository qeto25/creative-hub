'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  Wallet,
  Users,
  CheckCircle,
  Briefcase,
  Download,
  Award,
  Zap,
  FileCheck,
  Layers,
  BarChart2,
  PieChart,
  Calendar,
  Sparkles,
  Database,
  Radio,
  Info,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Booking, Profile } from '@/lib/types';
import { formatRupiahDisplay } from '@/lib/utils/currency';
import { INITIAL_MOCK_DATA } from '@/lib/mockData';

interface OwnerAnalyticsViewProps {
  bookings: Booking[];
  profiles: Profile[];
}

type Timeframe = 'all' | '30d' | '7d';
type DataSourceMode = 'live' | 'demo';

export default function OwnerAnalyticsView({
  bookings: liveBookings,
  profiles: liveProfiles,
}: OwnerAnalyticsViewProps) {
  // Jika database live kosong, user bisa dengan 1 klik menyalakan mode pratinjau demo
  const [dataSourceMode, setDataSourceMode] = useState<DataSourceMode>(
    liveBookings.length === 0 ? 'live' : 'live'
  );
  const [timeframe, setTimeframe] = useState<Timeframe>('all');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Active data source: Live Supabase vs Demo Simulation
  const activeBookings = useMemo(() => {
    if (dataSourceMode === 'demo') {
      return INITIAL_MOCK_DATA.bookings;
    }
    return liveBookings;
  }, [dataSourceMode, liveBookings]);

  const activeProfiles = useMemo(() => {
    if (dataSourceMode === 'demo') {
      return INITIAL_MOCK_DATA.profiles;
    }
    return liveProfiles;
  }, [dataSourceMode, liveProfiles]);

  // Filter bookings based on timeframe
  const filteredBookings = useMemo(() => {
    if (timeframe === 'all') return activeBookings;
    const now = new Date().getTime();
    const days = timeframe === '30d' ? 30 : 7;
    const cutoff = now - days * 24 * 60 * 60 * 1000;

    return activeBookings.filter((b) => {
      if (!b.created_at) return true;
      const createdTime = new Date(b.created_at).getTime();
      return createdTime >= cutoff;
    });
  }, [activeBookings, timeframe]);

  // Helper shares
  const getBookingShares = (b: Booking) => {
    const total = b.estimated_total || 0;
    if (b.hub_fee !== undefined && b.hub_fee !== null) {
      const hub = Number(b.hub_fee);
      const talent = total - hub;
      return { talentShare: talent, hubShare: hub };
    }
    const talent = Math.round(total * 0.75);
    const hub = total - talent;
    return { talentShare: talent, hubShare: hub };
  };

  // Key KPI Computations
  const analytics = useMemo(() => {
    const valid = filteredBookings.filter((b) => b.status !== 'cancelled');
    const totalOrders = filteredBookings.length;
    const totalValidOrders = valid.length;
    const completed = valid.filter((b) => b.status === 'completed' || b.step_progress === 5);
    const inProgress = valid.filter((b) => b.status === 'in_progress');
    const inReview = valid.filter((b) => b.status === 'in_review');
    const pendingDp = valid.filter((b) => b.status === 'pending_dp');
    const cancelled = filteredBookings.filter((b) => b.status === 'cancelled');

    const grossRevenue = valid.reduce((sum, b) => sum + (b.estimated_total || 0), 0);
    const totalHubFee = valid.reduce((sum, b) => sum + getBookingShares(b).hubShare, 0);
    const totalTalentFee = valid.reduce((sum, b) => sum + getBookingShares(b).talentShare, 0);

    const paidTalentShare = valid
      .filter((b) => b.payout_status === 'paid')
      .reduce((sum, b) => sum + getBookingShares(b).talentShare, 0);
    const unpaidTalentShare = totalTalentFee - paidTalentShare;

    const aov = totalValidOrders > 0 ? Math.round(grossRevenue / totalValidOrders) : 0;
    const completionRate = totalOrders > 0 ? Math.round((completed.length / totalOrders) * 100) : 0;

    // Add-on stats
    const rushOrders = valid.filter((b) => b.is_rush_order);
    const sourceFileOrders = valid.filter((b) => b.include_source_file);
    const extraRevisionOrders = valid.filter((b) => b.include_extra_revision);

    const addOnPenetration = totalValidOrders > 0
      ? Math.round(((rushOrders.length + sourceFileOrders.length + extraRevisionOrders.length) / totalValidOrders) * 100)
      : 0;

    return {
      totalOrders,
      totalValidOrders,
      completedCount: completed.length,
      inProgressCount: inProgress.length,
      inReviewCount: inReview.length,
      pendingDpCount: pendingDp.length,
      cancelledCount: cancelled.length,
      grossRevenue,
      totalHubFee,
      totalTalentFee,
      paidTalentShare,
      unpaidTalentShare,
      aov,
      completionRate,
      rushOrdersCount: rushOrders.length,
      sourceFileCount: sourceFileOrders.length,
      extraRevisionCount: extraRevisionOrders.length,
      addOnPenetration,
    };
  }, [filteredBookings]);

  // Talent Performance Leaderboard
  const talentLeaderboard = useMemo(() => {
    return activeProfiles.map((p) => {
      const talentBookings = filteredBookings.filter(
        (b) =>
          (b.profile_id && b.profile_id === p.id) ||
          (b.talent_name && b.talent_name.toLowerCase() === p.full_name.toLowerCase())
      );
      const valid = talentBookings.filter((b) => b.status !== 'cancelled');
      const completed = valid.filter((b) => b.status === 'completed' || b.step_progress === 5);
      const revenue = valid.reduce((acc, b) => acc + (b.estimated_total || 0), 0);
      const talentEarnings = valid.reduce((acc, b) => acc + getBookingShares(b).talentShare, 0);

      return {
        profile: p,
        totalBookings: valid.length,
        completedBookings: completed.length,
        totalRevenue: revenue,
        talentEarnings,
        rating: p.rating || 5.0,
        hireCount: p.hire_count || 0,
        isWorking: p.is_working,
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [activeProfiles, filteredBookings]);

  // Category & Skill demand breakdown
  const skillDemand = useMemo(() => {
    const map = new Map<string, number>();
    const valid = filteredBookings.filter((b) => b.status !== 'cancelled');
    
    if (valid.length === 0) {
      // Fallback display from active talents' skills
      activeProfiles.forEach((p) => {
        p.skills?.forEach((s) => {
          map.set(s, (map.get(s) || 0) + 1);
        });
      });
    } else {
      valid.forEach((b) => {
        const p = activeProfiles.find(
          (prof) =>
            (b.profile_id && prof.id === b.profile_id) ||
            prof.full_name.toLowerCase() === b.talent_name.toLowerCase()
        );
        if (p && p.skills) {
          p.skills.forEach((s) => {
            map.set(s, (map.get(s) || 0) + 1);
          });
        } else {
          map.set('Creative Generalist', (map.get('Creative Generalist') || 0) + 1);
        }
      });
    }

    const entries = Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const maxCount = entries.length > 0 ? entries[0].count : 1;
    return { list: entries.slice(0, 5), maxCount, hasData: valid.length > 0 };
  }, [filteredBookings, activeProfiles]);

  // Timeline / Month Revenue Simulation
  const monthlyRevenueData = useMemo(() => {
    const monthsMap = new Map<string, { label: string; revenue: number; hub: number; orders: number }>();
    const sorted = [...filteredBookings].filter((b) => b.status !== 'cancelled');

    sorted.forEach((b) => {
      const d = b.created_at ? new Date(b.created_at) : new Date();
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
      const current = monthsMap.get(key) || { label, revenue: 0, hub: 0, orders: 0 };
      
      const { hubShare } = getBookingShares(b);
      current.revenue += b.estimated_total || 0;
      current.hub += hubShare;
      current.orders += 1;
      monthsMap.set(key, current);
    });

    const list = Array.from(monthsMap.values());
    const maxRev = Math.max(...list.map((m) => m.revenue), 100000);
    return { list, maxRev, hasTransactions: list.length > 0 };
  }, [filteredBookings]);

  // Export to CSV Function
  const handleExportCSV = () => {
    try {
      const rows: string[][] = [
        ['LAPORAN ANALITIK BISNIS & TRANSAKSI - CREATIVE HUB AGENCY'],
        [`Tanggal Unduh: ${new Date().toLocaleString('id-ID')}`],
        [`Sumber Data: ${dataSourceMode === 'demo' ? 'Simulasi Demo' : 'Database Live Supabase'}`],
        [`Rentang Waktu: ${timeframe === 'all' ? 'Semua Waktu' : timeframe === '30d' ? '30 Hari Terakhir' : '7 Hari Terakhir'}`],
        [''],
        ['RINGKASAN EKSEKUTIF'],
        ['Metrik', 'Nilai'],
        ['Total Omset Kotor (Gross Revenue)', `Rp ${analytics.grossRevenue}`],
        ['Total Kas Agensi (Hub Reserve)', `Rp ${analytics.totalHubFee}`],
        ['Total Hak Mahasiswa/Talent', `Rp ${analytics.totalTalentFee}`],
        ['Hak Talent Terbayar (Paid)', `Rp ${analytics.paidTalentShare}`],
        ['Hak Talent Belum Ditransfer (Unpaid)', `Rp ${analytics.unpaidTalentShare}`],
        ['Rata-rata Nilai Pesanan (AOV)', `Rp ${analytics.aov}`],
        ['Tingkat Penyelesaian (Completion Rate)', `${analytics.completionRate}%`],
        ['Total Tiket Pesanan', `${analytics.totalOrders}`],
        [''],
        ['RINCIAN TIKET PESANAN'],
        ['Kode Tiket', 'Talent', 'Klien', 'Nominal Total', 'Hak Talent', 'Kas Hub', 'Status', 'Progres', 'Status Payout', 'Rush Order', 'Source File'],
      ];

      filteredBookings.forEach((b) => {
        const { talentShare, hubShare } = getBookingShares(b);
        rows.push([
          `"${b.ticket_code}"`,
          `"${b.talent_name.replace(/"/g, '""')}"`,
          `"${b.client_name.replace(/"/g, '""')}"`,
          `${b.estimated_total || 0}`,
          `${talentShare}`,
          `${hubShare}`,
          `"${b.status}"`,
          `Tahap ${b.step_progress || 1}`,
          `"${b.payout_status || 'unpaid'}"`,
          b.is_rush_order ? 'Ya' : 'Tidak',
          b.include_source_file ? 'Ya' : 'Tidak',
        ]);
      });

      const csvContent = '\uFEFF' + rows.map((e) => e.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `creative_hub_analitik_${dataSourceMode}_${timeframe}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (e) {
      console.error('Export CSV error:', e);
    }
  };

  const isLiveEmpty = dataSourceMode === 'live' && analytics.totalValidOrders === 0;

  return (
    <div className="space-y-6">
      {/* Top Controls: Mode Switcher, Timeframe, and Export CSV (Ultra Lightweight Solid Styling) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Owner Executive Intelligence</span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-0.5">Analitik & Performa Bisnis Agensi</h2>
          <p className="text-xs text-zinc-400">
            Metrik operasional internal, kesehatan finansial, pipeline konversi, dan performa talent real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Data Source Mode Toggle: Live vs Demo (Anti-Slop Solution) */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => setDataSourceMode('live')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
                dataSourceMode === 'live'
                  ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${dataSourceMode === 'live' ? 'bg-zinc-950' : 'bg-emerald-400'}`} />
              <span>Live Database</span>
            </button>
            <button
              type="button"
              onClick={() => setDataSourceMode('demo')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
                dataSourceMode === 'demo'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Pratinjau Demo</span>
            </button>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setTimeframe('all')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                timeframe === 'all'
                  ? 'bg-zinc-800 text-white font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Semua Waktu
            </button>
            <button
              onClick={() => setTimeframe('30d')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                timeframe === '30d'
                  ? 'bg-zinc-800 text-white font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              30 Hari
            </button>
            <button
              onClick={() => setTimeframe('7d')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                timeframe === '7d'
                  ? 'bg-zinc-800 text-white font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              7 Hari
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl border border-zinc-700 transition cursor-pointer"
            title="Download laporan format CSV untuk Excel"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>{downloadSuccess ? 'File Terunduh!' : 'Ekspor CSV'}</span>
          </button>
        </div>
      </div>

      {/* Live Zero Data Notice Banner (If Live DB has no orders yet) */}
      {isLiveEmpty && (
        <div className="rounded-2xl border border-amber-500/30 bg-zinc-900 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0 mt-0.5 border border-amber-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Database Live Siap Menerima Order</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                  Status: Siap Operasi
                </span>
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-3xl">
                Saat ini belum ada transaksi order masuk di database live Supabase. Begitu klien memesan via halaman talenta/portofolio, metrik omset, corong status, dan pembukuan kas akan otomatis terisi secara real-time.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDataSourceMode('demo')}
            className="flex items-center gap-2 whitespace-nowrap bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold px-4 py-2.5 rounded-xl transition shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Lihat Simulasi Data Demo</span>
          </button>
        </div>
      )}

      {/* KPI Cards Grid (Solid bg-zinc-900, No heavy GPU blur) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Card 1: Gross Revenue */}
        <div className="rounded-xl border border-amber-500/30 bg-zinc-900 p-4 transition-colors hover:border-amber-400/50">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Total Omset</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-black text-white mt-1.5 tracking-tight">
            {formatRupiahDisplay(analytics.grossRevenue)}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-zinc-400">
            <span className="text-emerald-400 font-semibold">{analytics.totalValidOrders} order aktif</span>
          </div>
        </div>

        {/* Card 2: Net Kas Agensi */}
        <div className="rounded-xl border border-emerald-500/30 bg-zinc-900 p-4 transition-colors hover:border-emerald-400/50">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Kas Agensi (Hub)</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-black text-emerald-400 mt-1.5 tracking-tight">
            {formatRupiahDisplay(analytics.totalHubFee)}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-zinc-400">
            <span>Dana operasional & kas</span>
          </div>
        </div>

        {/* Card 3: Total Hak Talent */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Hak Mahasiswa</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-xl font-black text-white mt-1.5 tracking-tight">
            {formatRupiahDisplay(analytics.totalTalentFee)}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px]">
            <span className="text-emerald-400 font-medium">Lunas: {formatRupiahDisplay(analytics.paidTalentShare)}</span>
          </div>
        </div>

        {/* Card 4: Average Order Value */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Avg Order Value</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-xl font-black text-sky-300 mt-1.5 tracking-tight">
            {formatRupiahDisplay(analytics.aov)}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-zinc-400">
            <span>Rata-rata per transaksi</span>
          </div>
        </div>

        {/* Card 5: Completion Rate */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Penyelesaian</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-black text-emerald-300 mt-1.5 tracking-tight">
            {analytics.completionRate}%
          </p>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-zinc-400">
            <span>{analytics.completedCount} order selesai</span>
          </div>
        </div>

        {/* Card 6: Add-on Uptake */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Add-on Uptake</span>
            <Zap className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-xl font-black text-yellow-300 mt-1.5 tracking-tight">
            {analytics.addOnPenetration}%
          </p>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-zinc-400">
            <span>Kilat / Master / Revisi</span>
          </div>
        </div>
      </div>

      {/* Row 2: Charts & Pipeline Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left (7 Cols): Monthly Revenue Bar Chart with Graceful Zero State */}
        <div className="lg:col-span-7 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-amber-400" />
                <span>Tren Omset & Alokasi Kas</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Visualisasi volume omset kotor vs pendapatan kas agensi per bulan.
              </p>
            </div>
            {monthlyRevenueData.hasTransactions && (
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
                  <span className="text-zinc-300 font-medium">Omset</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400"></span>
                  <span className="text-zinc-300 font-medium">Kas Hub</span>
                </div>
              </div>
            )}
          </div>

          {/* Chart Content Area */}
          {monthlyRevenueData.hasTransactions ? (
            <div className="h-52 w-full flex items-end justify-between gap-3 pt-4 border-b border-zinc-800 pb-2">
              {monthlyRevenueData.list.map((m, idx) => {
                const heightPercent = Math.max(12, Math.round((m.revenue / monthlyRevenueData.maxRev) * 100));
                const hubHeightPercent = Math.max(8, Math.round((m.hub / monthlyRevenueData.maxRev) * 100));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-950 border border-zinc-700 px-2.5 py-1 rounded-lg text-center pointer-events-none z-20 shadow-xl whitespace-nowrap">
                      <p className="text-[10px] font-bold text-amber-400">{formatRupiahDisplay(m.revenue)}</p>
                      <p className="text-[9px] text-zinc-400">{m.orders} Order • Kas: {formatRupiahDisplay(m.hub)}</p>
                    </div>

                    <div className="w-full max-w-[42px] flex items-end justify-center gap-1.5 h-full">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-1/2 bg-amber-500 hover:bg-amber-400 rounded-t transition-all duration-200"
                      />
                      <div
                        style={{ height: `${hubHeightPercent}%` }}
                        className="w-1/2 bg-emerald-500 hover:bg-emerald-400 rounded-t transition-all duration-200"
                      />
                    </div>
                    <span className="text-[10px] font-medium text-zinc-400 mt-2 truncate w-full text-center">
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Anti-Slop Zero State for Chart */
            <div className="h-52 border border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center p-6 text-center space-y-2 bg-zinc-950/30">
              <BarChart2 className="w-8 h-8 text-zinc-600" />
              <p className="text-xs font-semibold text-zinc-300">Belum Ada Data Transaksi Pada Periode Ini</p>
              <p className="text-[11px] text-zinc-500 max-w-sm">
                Grafik omset dan alokasi kas agensi akan otomatis tampil begitu ada pemesanan tiket masuk.
              </p>
              {dataSourceMode === 'live' && (
                <button
                  type="button"
                  onClick={() => setDataSourceMode('demo')}
                  className="text-xs text-amber-400 hover:underline font-semibold pt-1"
                >
                  Coba Pratinjau Demo Data &rarr;
                </button>
              )}
            </div>
          )}

          {/* Sub Financial Breakdown Footer */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Omset Terverifikasi</span>
              <p className="text-sm font-bold text-white mt-0.5">{formatRupiahDisplay(analytics.grossRevenue)}</p>
            </div>
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Total Hak Talent</span>
              <p className="text-sm font-bold text-indigo-400 mt-0.5">{formatRupiahDisplay(analytics.totalTalentFee)}</p>
            </div>
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Sisa Pending Transfer</span>
              <p className="text-sm font-bold text-yellow-400 mt-0.5">{formatRupiahDisplay(analytics.unpaidTalentShare)}</p>
            </div>
          </div>
        </div>

        {/* Right (5 Cols): Status Funnel & SLA Tracking */}
        <div className="lg:col-span-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>Status Funnel Pesanan</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Distribusi status tahapan pengerjaan saat ini.
            </p>
          </div>

          <div className="space-y-3">
            {/* Stage 1: Pending DP */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300 font-medium">Pending DP Transfer</span>
                <span className="font-mono text-yellow-400 font-bold">{analytics.pendingDpCount} Order</span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                  style={{ width: `${analytics.totalOrders ? (analytics.pendingDpCount / analytics.totalOrders) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Stage 2: In Progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300 font-medium">In Progress (Tahap 1-2 & 4)</span>
                <span className="font-mono text-blue-400 font-bold">{analytics.inProgressCount} Order</span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-400 rounded-full transition-all duration-300"
                  style={{ width: `${analytics.totalOrders ? (analytics.inProgressCount / analytics.totalOrders) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Stage 3: In Review */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300 font-medium">Review Draf Klien (Tahap 3)</span>
                <span className="font-mono text-indigo-400 font-bold">{analytics.inReviewCount} Order</span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-400 rounded-full transition-all duration-300"
                  style={{ width: `${analytics.totalOrders ? (analytics.inReviewCount / analytics.totalOrders) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Stage 4: Completed */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300 font-medium">Selesai Penuh (Tahap 5)</span>
                <span className="font-mono text-emerald-400 font-bold">{analytics.completedCount} Order</span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${analytics.totalOrders ? (analytics.completedCount / analytics.totalOrders) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Cancelled */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Dibatalkan</span>
                <span className="font-mono text-zinc-500">{analytics.cancelledCount} Order</span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-400/60 rounded-full transition-all duration-300"
                  style={{ width: `${analytics.totalOrders ? (analytics.cancelledCount / analytics.totalOrders) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800">
            <div className="rounded-xl bg-zinc-950 p-3 border border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-400">Tingkat Keberhasilan Proyek</span>
              <span className="text-xs font-black text-emerald-400">{analytics.completionRate}% Sukses</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Balanced 2-Column Grid (Eliminates the giant empty void!) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 Cols): Talent Leaderboard & Roster Performance */}
        <div className="lg:col-span-7 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Talent Performance Leaderboard</span>
              </h3>
              <span className="text-[11px] text-zinc-400 font-medium">{activeProfiles.length} Anggota Terdaftar</span>
            </div>
            <p className="text-xs text-zinc-400">
              Peringkat kontribusi omset riil, kepuasan bintang, dan produktivitas member agensi.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="pb-3 pl-1">Talent</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-center">Pesanan</th>
                  <th className="pb-3 text-right">Kontribusi Omset</th>
                  <th className="pb-3 text-right">Hak Talent</th>
                  <th className="pb-3 text-right pr-1">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {talentLeaderboard.slice(0, 5).map((item, idx) => (
                  <tr key={item.profile.id} className="hover:bg-zinc-800/40 transition">
                    <td className="py-3 pl-1">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          idx === 0 ? 'bg-amber-500 text-zinc-950' : idx === 1 ? 'bg-zinc-300 text-zinc-950' : idx === 2 ? 'bg-amber-700 text-white' : 'text-zinc-500'
                        }`}>
                          {idx + 1}
                        </span>
                        <Image
                          src={item.profile.avatar_url}
                          alt={item.profile.full_name}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full object-cover border border-zinc-700 shrink-0"
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/freelancers/${item.profile.id}`}
                            className="font-bold text-white hover:text-amber-400 transition truncate block max-w-[130px]"
                          >
                            {item.profile.full_name}
                          </Link>
                          <span className="text-[10px] text-zinc-400 truncate block max-w-[130px]">
                            {item.profile.skills.slice(0, 2).join(', ')}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 text-center">
                      {item.isWorking ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          Sedang Kerja
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Tersedia
                        </span>
                      )}
                    </td>

                    <td className="py-3 text-center">
                      <span className="font-bold text-white">{item.completedBookings}</span>
                      <span className="text-zinc-500"> / {item.totalBookings}</span>
                    </td>

                    <td className="py-3 text-right font-bold text-white whitespace-nowrap">
                      {formatRupiahDisplay(item.totalRevenue)}
                    </td>

                    <td className="py-3 text-right font-bold text-emerald-400 whitespace-nowrap">
                      {formatRupiahDisplay(item.talentEarnings)}
                    </td>

                    <td className="py-3 text-right pr-1">
                      <span className="font-bold text-amber-400 whitespace-nowrap">★ {item.rating.toFixed(1)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Card Summary (Fills the space gracefully!) */}
          <div className="pt-3 border-t border-zinc-800/80 grid grid-cols-2 gap-3 text-xs">
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">Total Anggota Terdaftar</span>
              <p className="text-sm font-bold text-white mt-0.5">{activeProfiles.length} Kreator</p>
            </div>
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">Siap Terima Order Baru</span>
              <p className="text-sm font-bold text-emerald-400 mt-0.5">
                {activeProfiles.filter((p) => !p.is_working).length} Kreator Siaga
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (5 Cols): Monetisasi Fitur Tambahan & Kategori Terlaris (Balanced Height!) */}
        <div className="lg:col-span-5 space-y-5 flex flex-col justify-between">
          {/* Add-on Monetization Breakdown */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6 space-y-3.5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span>Monetisasi Fitur Tambahan</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Frekuensi opsi upgrade layanan yang dipilih klien.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Layanan Kilat (Rush)</p>
                    <span className="text-[10px] text-zinc-400">Penyelesaian prioritas kilat</span>
                  </div>
                </div>
                <span className="text-xs font-black text-amber-400">{analytics.rushOrdersCount}x Dipilih</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <FileCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Master File (Source)</p>
                    <span className="text-[10px] text-zinc-400">File mentah editable .PSD / .AI</span>
                  </div>
                </div>
                <span className="text-xs font-black text-blue-400">{analytics.sourceFileCount}x Dipilih</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Revisi Tambahan Ekstra</p>
                    <span className="text-[10px] text-zinc-400">Iterasi di luar kuota revisi</span>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-400">{analytics.extraRevisionCount}x Dipilih</span>
              </div>
            </div>
          </div>

          {/* Skill Demand Widget */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-400" />
                <span>Kategori & Keahlian Terlaris</span>
              </h3>
              <span className="text-[10px] text-zinc-400">
                {skillDemand.hasData ? 'Berdasarkan Order' : 'Keahlian Terdaftar'}
              </span>
            </div>

            <div className="space-y-2">
              {skillDemand.list.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-300 font-medium truncate max-w-[180px]">{item.name}</span>
                    <span className="text-zinc-400 font-mono">
                      {item.count} {skillDemand.hasData ? 'pesanan' : 'talenta'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
                      style={{ width: `${(item.count / skillDemand.maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
