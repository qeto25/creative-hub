'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  Wallet,
  Users,
  CheckCircle,
  Clock,
  Briefcase,
  Download,
  Award,
  Zap,
  FileCheck,
  Layers,
  ArrowUpRight,
  Filter,
  BarChart2,
  PieChart,
  Percent,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Booking, Profile } from '@/lib/types';
import { formatRupiahDisplay } from '@/lib/utils/currency';

interface OwnerAnalyticsViewProps {
  bookings: Booking[];
  profiles: Profile[];
}

type Timeframe = 'all' | '30d' | '7d';

export default function OwnerAnalyticsView({ bookings, profiles }: OwnerAnalyticsViewProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('all');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Filter bookings based on timeframe
  const filteredBookings = useMemo(() => {
    if (timeframe === 'all') return bookings;
    const now = new Date().getTime();
    const days = timeframe === '30d' ? 30 : 7;
    const cutoff = now - days * 24 * 60 * 60 * 1000;

    return bookings.filter((b) => {
      if (!b.created_at) return true;
      const createdTime = new Date(b.created_at).getTime();
      return createdTime >= cutoff;
    });
  }, [bookings, timeframe]);

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
    return profiles.map((p) => {
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
  }, [profiles, filteredBookings]);

  // Category & Skill demand breakdown
  const skillDemand = useMemo(() => {
    const map = new Map<string, number>();
    filteredBookings
      .filter((b) => b.status !== 'cancelled')
      .forEach((b) => {
        // match profile
        const p = profiles.find(
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

    const entries = Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const maxCount = entries.length > 0 ? entries[0].count : 1;
    return { list: entries.slice(0, 6), maxCount };
  }, [filteredBookings, profiles]);

  // Timeline / Month Revenue Simulation
  const monthlyRevenueData = useMemo(() => {
    const monthsMap = new Map<string, { label: string; revenue: number; hub: number; orders: number }>();
    
    // Sort bookings by creation date or fallback
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
    if (list.length === 0) {
      list.push({ label: 'Periode Ini', revenue: analytics.grossRevenue, hub: analytics.totalHubFee, orders: analytics.totalValidOrders });
    }
    const maxRev = Math.max(...list.map((m) => m.revenue), 100000);
    return { list, maxRev };
  }, [filteredBookings, analytics]);

  // Export to CSV Function
  const handleExportCSV = () => {
    try {
      const rows: string[][] = [
        ['LAPORAN ANALITIK BISNIS & TRANSAKSI - CREATIVE HUB AGENCY'],
        [`Tanggal Unduh: ${new Date().toLocaleString('id-ID')}`],
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
      link.setAttribute('download', `creative_hub_analitik_${timeframe}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (e) {
      console.error('Export CSV error:', e);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Controls & Timeframe Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 p-5 rounded-3xl border border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Owner Executive Intelligence</span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-0.5">Analitik & Performa Bisnis Agensi</h2>
          <p className="text-xs text-zinc-400">
            Metrik operasional internal, kesehatan finansial, pipeline konversi, dan performa talent real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timeframe Pill */}
          <div className="flex items-center bg-zinc-950 rounded-xl p-1 border border-zinc-800 text-xs">
            <button
              onClick={() => setTimeframe('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                timeframe === 'all'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Semua Waktu
            </button>
            <button
              onClick={() => setTimeframe('30d')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                timeframe === '30d'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              30 Hari
            </button>
            <button
              onClick={() => setTimeframe('7d')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                timeframe === '7d'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              7 Hari
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-4 py-2 rounded-xl border border-zinc-700 transition cursor-pointer"
            title="Download laporan lengkap format CSV untuk Excel"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>{downloadSuccess ? 'File Terunduh!' : 'Ekspor CSV'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Gross Revenue */}
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-zinc-900/90 p-4.5 backdrop-blur-md">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">Total Omset (Gross)</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-black text-white mt-2 tracking-tight">
            {formatRupiahDisplay(analytics.grossRevenue)}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[10px] text-zinc-400">
            <span className="text-emerald-400 font-semibold">{analytics.totalValidOrders} pesanan aktif</span>
          </div>
        </div>

        {/* Card 2: Net Kas Hub */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 to-zinc-900/90 p-4.5 backdrop-blur-md">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">Kas Agensi (Net Hub)</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-black text-emerald-400 mt-2 tracking-tight">
            {formatRupiahDisplay(analytics.totalHubFee)}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[10px] text-zinc-400">
            <span>Dana operasional & kas</span>
          </div>
        </div>

        {/* Card 3: Total Hak Talent */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4.5 backdrop-blur-md">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Hak Talent Mahasiswa</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-xl font-black text-white mt-2 tracking-tight">
            {formatRupiahDisplay(analytics.totalTalentFee)}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[10px]">
            <span className="text-emerald-400 font-medium">Lunas: {formatRupiahDisplay(analytics.paidTalentShare)}</span>
          </div>
        </div>

        {/* Card 4: Average Order Value */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4.5 backdrop-blur-md">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Avg Order Value (AOV)</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-xl font-black text-sky-300 mt-2 tracking-tight">
            {formatRupiahDisplay(analytics.aov)}
          </p>
          <div className="flex items-center gap-1 mt-1 text-[10px] text-zinc-400">
            <span>Rata-rata per transaksi</span>
          </div>
        </div>

        {/* Card 5: Completion Rate */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4.5 backdrop-blur-md">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Tingkat Penyelesaian</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-black text-emerald-300 mt-2 tracking-tight">
            {analytics.completionRate}%
          </p>
          <div className="flex items-center gap-1 mt-1 text-[10px] text-zinc-400">
            <span>{analytics.completedCount} pesanan selesai</span>
          </div>
        </div>

        {/* Card 6: Add-on Uptake */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4.5 backdrop-blur-md">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Add-on Uptake</span>
            <Zap className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-xl font-black text-yellow-300 mt-2 tracking-tight">
            {analytics.addOnPenetration}%
          </p>
          <div className="flex items-center gap-1 mt-1 text-[10px] text-zinc-400">
            <span>Kilat / Master / Revisi</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Pipeline Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monthly Revenue Bar Chart */}
        <div className="lg:col-span-2 rounded-3xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-md p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-amber-400" />
                <span>Tren Omset & Alokasi Kas</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Visualisasi volume omset kotor vs pendapatan kas agensi.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
                <span className="text-zinc-300 font-medium">Omset Kotor</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400"></span>
                <span className="text-zinc-300 font-medium">Kas Hub (25%)</span>
              </div>
            </div>
          </div>

          {/* SVG Interactive Chart */}
          <div className="h-56 w-full flex items-end justify-between gap-3 pt-6 border-b border-zinc-800 pb-2">
            {monthlyRevenueData.list.map((m, idx) => {
              const heightPercent = Math.max(12, Math.round((m.revenue / monthlyRevenueData.maxRev) * 100));
              const hubHeightPercent = Math.max(8, Math.round((m.hub / monthlyRevenueData.maxRev) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-950 border border-zinc-700 px-2.5 py-1.5 rounded-lg text-center pointer-events-none z-20 shadow-xl whitespace-nowrap">
                    <p className="text-[10px] font-bold text-amber-400">{formatRupiahDisplay(m.revenue)}</p>
                    <p className="text-[9px] text-zinc-400">{m.orders} Pesanan • Kas: {formatRupiahDisplay(m.hub)}</p>
                  </div>

                  <div className="w-full max-w-[48px] flex items-end justify-center gap-1.5 h-full">
                    {/* Gross Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-1/2 bg-amber-500/80 hover:bg-amber-400 rounded-t-md transition-all duration-300 group-hover:brightness-110"
                    />
                    {/* Hub Bar */}
                    <div
                      style={{ height: `${hubHeightPercent}%` }}
                      className="w-1/2 bg-emerald-500/80 hover:bg-emerald-400 rounded-t-md transition-all duration-300 group-hover:brightness-110"
                    />
                  </div>
                  <span className="text-[10px] font-medium text-zinc-400 mt-2 truncate w-full text-center">
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Sub Financial Breakdown Footer */}
          <div className="grid grid-cols-3 gap-4 pt-1">
            <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/60">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Omset Terverifikasi</span>
              <p className="text-sm font-bold text-white mt-0.5">{formatRupiahDisplay(analytics.grossRevenue)}</p>
            </div>
            <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/60">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Total Payout Talent</span>
              <p className="text-sm font-bold text-indigo-400 mt-0.5">{formatRupiahDisplay(analytics.totalTalentFee)}</p>
            </div>
            <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/60">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Sisa Pending Payout</span>
              <p className="text-sm font-bold text-yellow-400 mt-0.5">{formatRupiahDisplay(analytics.unpaidTalentShare)}</p>
            </div>
          </div>
        </div>

        {/* Right Col: Conversion Funnel & Pipeline SLA */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-md p-6 space-y-5">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>Status Funnel Pesanan</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Distribusi status tahapan pengerjaan saat ini.
            </p>
          </div>

          <div className="space-y-3.5">
            {/* Stage 1: Pending DP */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300 font-medium">Pending DP Transfer</span>
                <span className="font-mono text-yellow-400 font-bold">{analytics.pendingDpCount} Order</span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full"
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
                  className="h-full bg-blue-400 rounded-full"
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
                  className="h-full bg-indigo-400 rounded-full"
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
                  className="h-full bg-emerald-400 rounded-full"
                  style={{ width: `${analytics.totalOrders ? (analytics.completedCount / analytics.totalOrders) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Cancelled */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Dibatalkan (Drop-off)</span>
                <span className="font-mono text-zinc-500">{analytics.cancelledCount} Order</span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-400/60 rounded-full"
                  style={{ width: `${analytics.totalOrders ? (analytics.cancelledCount / analytics.totalOrders) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800">
            <div className="rounded-xl bg-zinc-950/60 p-3 border border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-400">Tingkat Keberhasilan</span>
              <span className="text-xs font-black text-emerald-400">{analytics.completionRate}% Sukses</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Talent Leaderboard & Demand Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Talent Leaderboard Table */}
        <div className="lg:col-span-2 rounded-3xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Talent Performance Leaderboard</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Peringkat kontribusi nilai omset, kepuasan bintang, dan produktivitas member agensi.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="pb-3 pl-2">Talent</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-center">Pesanan</th>
                  <th className="pb-3 text-right">Kontribusi Omset</th>
                  <th className="pb-3 text-right">Pendapatan Talent</th>
                  <th className="pb-3 text-right pr-2">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {talentLeaderboard.slice(0, 5).map((item, idx) => (
                  <tr key={item.profile.id} className="hover:bg-zinc-800/40 transition">
                    <td className="py-3 pl-2">
                      <div className="flex items-center gap-3">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
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
                        <div>
                          <Link
                            href={`/freelancers/${item.profile.id}`}
                            className="font-bold text-white hover:text-amber-400 transition truncate block max-w-[140px]"
                          >
                            {item.profile.full_name}
                          </Link>
                          <span className="text-[10px] text-zinc-400 truncate block max-w-[140px]">
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

                    <td className="py-3 text-right font-bold text-white">
                      {formatRupiahDisplay(item.totalRevenue)}
                    </td>

                    <td className="py-3 text-right font-bold text-emerald-400">
                      {formatRupiahDisplay(item.talentEarnings)}
                    </td>

                    <td className="py-3 text-right pr-2">
                      <span className="font-bold text-amber-400">★ {item.rating.toFixed(1)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Monetization & Skill Demand */}
        <div className="space-y-6">
          {/* Add-on Monetization Breakdown */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-md p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>Monetisasi Fitur Tambahan</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Opsi upgrade yang dipilih klien saat booking.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Layanan Kilat (Rush Order)</p>
                    <span className="text-[10px] text-zinc-400">Biaya ekstra pengerjaan kilat</span>
                  </div>
                </div>
                <span className="text-xs font-black text-amber-400">{analytics.rushOrdersCount}x Dipilih</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Master File (Source File)</p>
                    <span className="text-[10px] text-zinc-400">Pembelian file mentah .PSD / .AI</span>
                  </div>
                </div>
                <span className="text-xs font-black text-blue-400">{analytics.sourceFileCount}x Dipilih</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Revisi Tambahan Ekstra</p>
                    <span className="text-[10px] text-zinc-400">Kebutuhan iterasi khusus</span>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-400">{analytics.extraRevisionCount}x Dipilih</span>
              </div>
            </div>
          </div>

          {/* Skill Demand Widget */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-md p-6 space-y-3.5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              <span>Kategori & Keahlian Terlaris</span>
            </h3>

            <div className="space-y-2.5">
              {skillDemand.list.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-300 font-medium truncate max-w-[180px]">{item.name}</span>
                    <span className="text-zinc-400 font-mono">{item.count} pesanan</span>
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
