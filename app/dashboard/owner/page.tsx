'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Users,
  Briefcase,
  Plus,
  Trash2,
  Edit2,
  Edit3,
  Search,
  Sparkles,
  Eye,
  LogOut,
  Sliders,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  X,
  Loader2,
  Layers,
  ShieldAlert,
  MessageCircle,
  Wallet,
  Banknote,
  DollarSign,
  ArrowUpRight,
} from 'lucide-react';
import { MOCK_PROFILES, MOCK_BOOKINGS } from '@/lib/data/mock-data';
import { Profile, Booking, BookingStatus } from '@/lib/types';
import PriceOverrideModal from '@/components/PriceOverrideModal';
import OwnerMemberEditModal from '@/components/OwnerMemberEditModal';
import BookingDetailModal from '@/components/BookingDetailModal';
import DisciplineModal from '@/components/DisciplineModal';
import { ownerCreateMember } from '@/app/actions/owner-create-member';
import * as dataLayer from '@/lib/dataLayer';
import { getTalentStatus } from '@/lib/utils/status';
import EmptyState from '@/components/EmptyState';
import { createClient } from '@/lib/supabase/client';
import { isDemoMode } from '@/lib/config';
import { formatRupiah, formatRupiahDisplay } from '@/lib/utils/currency';
import { getDemoSessionAction, logoutDemoAction } from '@/app/actions/demo-auth';
import { useAuthSession } from '@/lib/context/AuthContext';

export default function OwnerDashboardPage() {
  const { logout } = useAuthSession();
  const [activeTab, setActiveTab] = useState<'members' | 'bookings' | 'finance'>('members');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');
  const [financeSearchQuery, setFinanceSearchQuery] = useState('');
  const [logoutToast, setLogoutToast] = useState(false);
  const [isVerifyingAuth, setIsVerifyingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('creativehub_user_session');
      sessionStorage.clear();
      if (isDemoMode()) {
        await logoutDemoAction();
      }
      const supabase = createClient();
      await supabase.auth.signOut();
      await logout();
    } catch (e) {
      // ignore
    }
    setLogoutToast(true);
    setTimeout(() => {
      window.location.href = '/login';
    }, 1000);
  };

  // Verifikasi wewenang Owner dan load bookings & profiles via unified Data Layer
  useEffect(() => {
    async function verifyOwnerAndLoadData() {
      setIsVerifyingAuth(true);
      try {
        let isOwner = false;
        if (!isDemoMode()) {
          const supabase = createClient();
          const { data: userData, error: authErr } = await supabase.auth.getUser();
          if (authErr || !userData?.user) {
            window.location.href = '/login?redirect=/dashboard/owner';
            return;
          }
          const metaRole = userData.user.user_metadata?.role;
          const userEmail = userData.user.email?.toLowerCase() || '';
          if (metaRole === 'owner' || userEmail === 'grown@creativehub.id' || userEmail.includes('owner')) {
            isOwner = true;
          } else {
            // Bukan owner -> alihkan ke dashboard member
            window.location.href = '/dashboard/member';
            return;
          }
        } else {
          // Demo Mode: periksa sesi demo dari server action (HttpOnly cookie)
          const demoSession = await getDemoSessionAction();
          if (!demoSession) {
            window.location.href = '/login?redirect=/dashboard/owner';
            return;
          }
          if (demoSession.role === 'owner') {
            isOwner = true;
          } else {
            window.location.href = '/dashboard/member';
            return;
          }
        }

        if (isOwner) {
          setIsAuthorized(true);
          const [liveBookings, liveProfiles] = await Promise.all([
            dataLayer.getBookings(),
            dataLayer.getProfiles({ includeTesters: true }),
          ]);
          if (liveBookings) {
            setBookings(liveBookings);
          }
          if (liveProfiles) {
            setProfiles(liveProfiles);
          }
        }
      } catch (err) {
        console.warn('Owner auth/fetch note:', err);
      } finally {
        setIsVerifyingAuth(false);
      }
    }
    verifyOwnerAndLoadData();
  }, []);

  // Update Booking Status
  const handleUpdateBookingStatus = async (bookingId: string, newStatus: BookingStatus) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
    );

    try {
      await dataLayer.updateBooking(bookingId, { status: newStatus });
    } catch (err) {
      console.warn('Status update note:', err);
    }
  };

  // Owner Update Booking Progress & Status (Pemisahan Wewenang MODUL 4)
  const handleOwnerSetStep = async (bookingId: string, step: 1 | 2 | 3 | 4 | 5) => {
    let newStatus: BookingStatus = 'in_progress';
    if (step === 1) newStatus = 'in_progress';
    if (step === 2) newStatus = 'in_progress';
    if (step === 3) newStatus = 'in_review';
    if (step === 4) newStatus = 'in_progress';
    if (step === 5) newStatus = 'completed';

    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, step_progress: step, status: newStatus } : b))
    );

    try {
      await dataLayer.updateBooking(bookingId, {
        step_progress: step,
        status: newStatus,
      });
    } catch (err) {
      console.warn('Owner step update note:', err);
    }
  };

  // Toggle Payout Status (Hak Talent 80%)
  const handleTogglePayout = async (bookingId: string) => {
    const targetBooking = bookings.find((b) => b.id === bookingId);
    if (!targetBooking) return;

    const newStatus: 'paid' | 'unpaid' = targetBooking.payout_status === 'paid' ? 'unpaid' : 'paid';
    const newDate = newStatus === 'paid' ? new Date().toISOString() : null;

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, payout_status: newStatus, payout_date: newDate }
          : b
      )
    );

    try {
      await dataLayer.updateBooking(bookingId, {
        payout_status: newStatus,
        payout_date: newDate,
      });
    } catch (err) {
      console.warn('Payout update fallback note:', err);
    }
  };

  // Modals
  const [selectedProfileForPrice, setSelectedProfileForPrice] = useState<Profile | null>(null);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);

  const [selectedProfileForEdit, setSelectedProfileForEdit] = useState<Profile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState<Booking | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Discipline Modal
  const [selectedProfileForDiscipline, setSelectedProfileForDiscipline] = useState<Profile | null>(null);
  const [isDisciplineModalOpen, setIsDisciplineModalOpen] = useState(false);

  // New Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('Creative2026!');
  const [newSkills, setNewSkills] = useState('PPT Specialist, Canva Design');
  const [newBasePrice, setNewBasePrice] = useState<number>(20000);
  const [newDpPercentage, setNewDpPercentage] = useState<number>(30);
  const [newIsTester, setNewIsTester] = useState(false);
  const [isSubmittingNewMember, setIsSubmittingNewMember] = useState(false);
  const [addMemberMessage, setAddMemberMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State: Manual Kas Agensi Override
  const [isKasModalOpen, setIsKasModalOpen] = useState(false);
  const [selectedBookingForKas, setSelectedBookingForKas] = useState<Booking | null>(null);
  const [kasOverrideInput, setKasOverrideInput] = useState<number>(0);
  const [isSavingKas, setIsSavingKas] = useState(false);

  // Helper untuk formula 75% Talent / 25% Kas Hub dengan dukungan Manual Override
  const getBookingShares = (b: Booking) => {
    const total = b.estimated_total || 0;
    if (b.hub_fee !== undefined && b.hub_fee !== null) {
      const hub = Number(b.hub_fee);
      const talent = total - hub;
      return { talentShare: talent, hubShare: hub, isCustom: true, isCustomKas: true };
    }
    const talent = Math.round(total * 0.75);
    const hub = total - talent;
    return { talentShare: talent, hubShare: hub, isCustom: false, isCustomKas: false };
  };

  // Metrics
  const totalMembers = profiles.length;
  const activeWorkingMembers = profiles.filter((p) => p.is_working).length;
  const testerProfiles = profiles.filter((p) => p.is_tester).length;
  const pendingDpBookings = bookings.filter((b) => b.status === 'pending_dp').length;
  const inProgressBookings = bookings.filter((b) => b.status === 'in_progress').length;

  // Finance Metrics: 75% Talent, 25% Hub (Akumulasi Dinamis & Penyesuaian Manual)
  const validBookings = bookings.filter((b) => b.status !== 'cancelled');
  const totalRevenue = validBookings.reduce((sum, b) => sum + (b.estimated_total || 0), 0);
  const totalTalentShare = validBookings.reduce((sum, b) => sum + getBookingShares(b).talentShare, 0);
  const totalHubShare = validBookings.reduce((sum, b) => sum + getBookingShares(b).hubShare, 0);
  const unpaidBookingsCount = validBookings.filter((b) => b.payout_status !== 'paid').length;
  const totalUnpaidTalentShare = validBookings
    .filter((b) => b.payout_status !== 'paid')
    .reduce((sum, b) => sum + getBookingShares(b).talentShare, 0);

  const handleOpenKasModal = (b: Booking) => {
    setSelectedBookingForKas(b);
    const shares = getBookingShares(b);
    setKasOverrideInput(shares.hubShare);
    setIsKasModalOpen(true);
  };

  const handleSaveKasOverride = async () => {
    if (!selectedBookingForKas) return;
    setIsSavingKas(true);
    const total = selectedBookingForKas.estimated_total || 0;
    const newHubFee = Math.max(0, Math.min(total, Number(kasOverrideInput)));
    const newTalentFee = total - newHubFee;

    try {
      await dataLayer.updateBooking(selectedBookingForKas.id, {
        hub_fee: newHubFee,
        talent_fee: newTalentFee,
      });
    } catch (err) {
      console.warn('DataLayer update kas override note:', err);
    }

    setBookings((prev) =>
      prev.map((b) =>
        b.id === selectedBookingForKas.id
          ? { ...b, hub_fee: newHubFee, talent_fee: newTalentFee }
          : b
      )
    );

    setIsSavingKas(false);
    setIsKasModalOpen(false);
    setSelectedBookingForKas(null);
  };

  // State & Handler untuk Fitur Split Kas Massal / Global Controller (Modul 1C)
  const [showGlobalSplitModal, setShowGlobalSplitModal] = useState(false);
  const [globalKasPercentage, setGlobalKasPercentage] = useState<number>(25);
  const [applyToUnpaidOnly, setApplyToUnpaidOnly] = useState<boolean>(true);
  const [isApplyingGlobalSplit, setIsApplyingGlobalSplit] = useState(false);

  const handleApplyGlobalSplit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsApplyingGlobalSplit(true);
    try {
      const percentage = Math.max(0, Math.min(100, Number(globalKasPercentage) || 0));
      const filterFn = (b: Booking) => {
        if (applyToUnpaidOnly) {
          return b.payout_status !== 'paid' && b.status !== 'cancelled';
        }
        return b.status !== 'cancelled';
      };

      const updatesFn = (b: Booking) => {
        const total = b.estimated_total || 0;
        const hubFee = Math.round(total * (percentage / 100));
        const talentFee = total - hubFee;
        return { hub_fee: hubFee, talent_fee: talentFee };
      };

      const updatedAll = await dataLayer.updateBookingsMass(updatesFn, filterFn);
      if (updatedAll && updatedAll.length > 0) {
        setBookings(updatedAll);
      }

      setShowGlobalSplitModal(false);
    } catch (err) {
      console.error('Failed to apply global split:', err);
    } finally {
      setIsApplyingGlobalSplit(false);
    }
  };

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);

  // Filter profiles
  const filteredProfiles = profiles.filter(
    (p) =>
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filter bookings
  const filteredBookings = bookings.filter(
    (b) =>
      b.ticket_code.toLowerCase().includes(bookingSearchQuery.toLowerCase()) ||
      b.client_name.toLowerCase().includes(bookingSearchQuery.toLowerCase()) ||
      b.talent_name.toLowerCase().includes(bookingSearchQuery.toLowerCase())
  );

  // Filter finance bookings
  const filteredFinanceBookings = validBookings.filter((b) => {
    const q = financeSearchQuery.toLowerCase();
    return (
      b.ticket_code.toLowerCase().includes(q) ||
      b.talent_name.toLowerCase().includes(q) ||
      b.client_name.toLowerCase().includes(q)
    );
  });

  // Toggle Tester
  const toggleTesterStatus = (id: string) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_tester: !p.is_tester } : p))
    );
  };

  // Toggle Working
  const toggleWorkingStatus = (id: string) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_working: !p.is_working } : p))
    );
  };

  // Delete Member
  const handleDeleteMember = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus akun member "${name}" dari database?`)) {
      setProfiles((prev) => prev.filter((p) => p.id !== id));
    }
  };

  // Handlers
  const handleOpenPriceOverride = (profile: Profile) => {
    setSelectedProfileForPrice(profile);
    setIsPriceModalOpen(true);
  };

  const handleOpenFullEdit = (profile: Profile) => {
    setSelectedProfileForEdit(profile);
    setIsEditModalOpen(true);
  };

  const handleOpenBookingDetail = (booking: Booking) => {
    setSelectedBookingForDetail(booking);
    setIsBookingModalOpen(true);
  };

  const handleOpenDiscipline = (profile: Profile) => {
    setSelectedProfileForDiscipline(profile);
    setIsDisciplineModalOpen(true);
  };

  const handleProfileUpdated = (updated: Profile) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  };

  const handleBookingUpdated = (updated: Booking) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === updated.id ? updated : b))
    );
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingNewMember(true);
    setAddMemberMessage(null);

    const skillsArray = newSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await ownerCreateMember({
        fullName: newFullName,
        email: newEmail,
        password: newPassword,
        skills: skillsArray,
        basePrice: Number(newBasePrice),
        dpPercentage: Number(newDpPercentage),
        isTester: newIsTester,
      });

      if (res.success && res.profile) {
        setProfiles((prev) => [res.profile!, ...prev]);
        setAddMemberMessage({
          type: 'success',
          text: `Member "${newFullName}" berhasil dibuat! Sesi Owner tetap aktif.`,
        });
        setTimeout(() => {
          setIsAddModalOpen(false);
          setNewFullName('');
          setNewEmail('');
          setAddMemberMessage(null);
        }, 1200);
      } else {
        setAddMemberMessage({
          type: 'error',
          text: res.error || 'Gagal membuat akun member.',
        });
      }
    } catch (err: any) {
      setAddMemberMessage({
        type: 'error',
        text: err?.message || 'Terjadi kesalahan sistem.',
      });
    } finally {
      setIsSubmittingNewMember(false);
    }
  };

  const getStatusBadge = (status: BookingStatus, stepProgress?: number) => {
    if (status === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-[11px] font-bold text-red-400">
          Cancelled
        </span>
      );
    }

    const step = stepProgress || (status === 'completed' ? 5 : status === 'in_review' ? 3 : status === 'in_progress' ? 2 : 1);
    switch (step) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-2.5 py-1 text-[11px] font-bold text-yellow-400">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
            Tahap 1: DP Terverifikasi
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
            Tahap 2: Draf Desain
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/40 bg-purple-500/10 px-2.5 py-1 text-[11px] font-bold text-purple-400">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse"></span>
            Tahap 3: Review Draf
          </span>
        );
      case 4:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/40 bg-blue-500/10 px-2.5 py-1 text-[11px] font-bold text-blue-400">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span>
            Tahap 4: Pelunasan 70%
          </span>
        );
      case 5:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
            <CheckCircle className="h-3 w-3" />
            Tahap 5: Selesai Penuh
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-[11px] font-bold text-zinc-400">
            Pending DP
          </span>
        );
    }
  };

  if (isVerifyingAuth || !isAuthorized) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 size={32} className="text-amber-400 animate-spin" />
        <p className="text-xs text-zinc-400 tracking-wider">Memverifikasi otorisasi akun Owner Grown...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">
            <ShieldCheck className="h-4 w-4" />
            <span>Super Admin Access</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Owner Command Center</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manajemen penuh anggota, pesanan tiket booking, dan kontrol tarif & DP override.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-zinc-950 shadow-gold-glow hover:bg-amber-400 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Member Baru</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-300 hover:bg-red-500/20 hover:border-red-400 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Member</span>
            <Users className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-2">{totalMembers}</p>
          <span className="text-[11px] text-zinc-500">{activeWorkingMembers} Sedang Mengerjakan • {testerProfiles} Peninjauan</span>
        </div>

        <div className="rounded-2xl border border-yellow-500/30 bg-zinc-900/80 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Tiket Pending DP</span>
            <span className="flex h-2.5 w-2.5 rounded-full bg-yellow-400 animate-ping"></span>
          </div>
          <p className="text-2xl font-extrabold text-yellow-400 mt-2">{pendingDpBookings}</p>
          <span className="text-[11px] text-yellow-500/80 font-medium">Menunggu Konfirmasi Transfer</span>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-zinc-900/80 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Proyek Berjalan</span>
            <Clock className="h-4 w-4 text-blue-400" />
          </div>
          <p className="text-2xl font-extrabold text-blue-400 mt-2">{inProgressBookings}</p>
          <span className="text-[11px] text-zinc-500">In Progress Pengerjaan</span>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-zinc-900/80 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Tahap Peninjauan</span>
            <Sparkles className="h-4 w-4 text-purple-400" />
          </div>
          <p className="text-2xl font-extrabold text-purple-300 mt-2">{testerProfiles}</p>
          <span className="text-[11px] text-purple-400/80">Profil belum dipublikasikan</span>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-zinc-800 overflow-x-auto no-scrollbar pb-2">
        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 whitespace-nowrap py-2.5 px-4 font-medium text-sm border-b-2 transition-all shrink-0 ${
            activeTab === 'members'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>Kelola Member ({profiles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex items-center gap-2 whitespace-nowrap py-2.5 px-4 font-medium text-sm border-b-2 transition-all shrink-0 ${
            activeTab === 'bookings'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span>Daftar Pesanan</span>
          {pendingDpBookings > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              {pendingDpBookings} Pending
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('finance')}
          className={`flex items-center gap-2 whitespace-nowrap py-2.5 px-4 font-medium text-sm border-b-2 transition-all shrink-0 ${
            activeTab === 'finance'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Wallet className="w-4 h-4 shrink-0" />
          <span>Keuangan & Bagi Hasil</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
            75/25
          </span>
          {unpaidBookingsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              {unpaidBookingsCount} Belum Payout
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: MEMBERS MANAGEMENT TABLE */}
      {activeTab === 'members' && (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-md overflow-hidden shadow-xl space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Member Roster</h2>
              <p className="text-xs text-zinc-400">
                Klik ikon edit (pensil) untuk Full Member Editor atau ikon sliders untuk Price & DP Override cepat.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Cari member..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-700 bg-zinc-950 text-xs text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* TAMPILAN MOBILE: KELOLA TALENT JADI KARTU (BUKAN TABEL) (< 768px) */}
          <div className="block md:hidden space-y-3">
            {filteredProfiles.length === 0 ? (
              <div className="text-center py-8 text-xs text-zinc-500 bg-zinc-950/50 rounded-xl border border-zinc-800">
                Tidak ada member yang cocok dengan pencarian.
              </div>
            ) : (
              filteredProfiles.map((p) => (
                <div
                  key={p.id}
                  className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 space-y-2.5 shadow-sm overflow-hidden"
                >
                  {/* Baris Atas: Avatar bulat mini, Nama + Rating, Live Status & Tombol Edit Ringkas */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Image
                        src={p.avatar_url}
                        alt={p.full_name || 'Avatar'}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover border border-zinc-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/freelancers/${p.id}`}
                          className="font-bold text-white hover:text-amber-400 transition-colors text-xs truncate block"
                        >
                          {p.full_name}
                        </Link>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                          <span>★ {(p.rating || 5.0).toFixed(1)}</span>
                          <span>•</span>
                          <span>{p.hire_count || 0}x Hired</span>
                          {p.is_suspended && (
                            <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                              ⛔ Skorsing
                            </span>
                          )}
                          {p.is_locked && (
                            <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              🔒 Terkunci
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Live Status Badge (Single Indicator Dot) & Edit Button di Pojok Kanan Atas */}
                    <div className="flex items-center gap-1 shrink-0">
                      {(() => {
                        const statusMeta = getTalentStatus(p);
                        return (
                          <button
                            onClick={() => toggleWorkingStatus(p.id)}
                            className="focus:outline-none"
                            title="Klik untuk ubah ketersediaan order"
                          >
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                              statusMeta.variant === 'warning'
                                ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400'
                                : statusMeta.variant === 'info'
                                ? 'border-blue-500/40 bg-blue-500/10 text-blue-400'
                                : statusMeta.variant === 'danger'
                                ? 'border-red-500/40 bg-red-500/10 text-red-300'
                                : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotColor} mr-1.5 ${statusMeta.pulse ? 'animate-pulse' : ''}`}></span>
                              {statusMeta.label}
                            </span>
                          </button>
                        );
                      })()}

                      <button
                        onClick={() => handleOpenFullEdit(p)}
                        className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Edit Profil Lengkap"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Baris Tengah: Tags Keahlian (Maks 4 tag, sisanya +N lainnya) */}
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    {(p.skills || []).slice(0, 4).map((s, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
                        {s}
                      </span>
                    ))}
                    {(p.skills || []).length > 4 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800/50 text-zinc-500 border border-zinc-800">
                        +{(p.skills || []).length - 4} lainnya
                      </span>
                    )}
                  </div>

                  {/* Baris Bawah: Info Tarif Tumpuk Vertikal & 2 Tombol Aksi Utama */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/70">
                    <div className="flex flex-col">
                      <span className="font-mono font-bold text-xs text-amber-400">
                        {p.forced_price !== null && p.forced_price !== undefined ? (
                          <span className="text-red-400">{formatRupiahDisplay(p.forced_price)}</span>
                        ) : (
                          formatRupiahDisplay(p.base_price || 0)
                        )}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-normal">
                        DP: {p.dp_percentage}%
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenDiscipline(p)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg border transition-colors shrink-0 ${
                          p.is_suspended
                            ? 'text-red-400 bg-red-500/20 border-red-500/40'
                            : p.is_locked
                            ? 'text-amber-400 bg-amber-500/20 border-amber-500/40'
                            : 'bg-zinc-800 text-zinc-200 border border-zinc-700/80 hover:text-red-400'
                        }`}
                        title="Atur Tindakan Disiplin"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                        <span>Disiplin</span>
                      </button>

                      <button
                        onClick={() => handleOpenPriceOverride(p)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium bg-zinc-800 text-amber-400 border border-zinc-700/80 rounded-lg hover:bg-zinc-750 transition-colors shrink-0"
                        title="Ubah Harga & DP"
                      >
                        <Sliders className="w-3.5 h-3.5 text-amber-400" />
                        <span>Harga</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* TAMPILAN DESKTOP: TABEL STANDAR RAPI (>= 768px) */}
          <div className="hidden md:block w-full overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/80 shadow-xl">
            <table className="w-full text-left text-xs text-zinc-300 border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Talent</th>
                  <th className="py-3 px-4">Keahlian & Tools</th>
                  <th className="py-3 px-4">Live Status</th>
                  <th className="py-3 px-4">Tarif & DP</th>
                  <th className="py-3 px-4">Mode Draft</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredProfiles.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                    {/* Talent */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <Image
                          src={p.avatar_url}
                          alt={p.full_name || 'Avatar'}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-xl object-cover border border-zinc-700 shrink-0"
                        />
                        <div>
                          <Link
                            href={`/freelancers/${p.id}`}
                            className="font-bold text-white hover:text-amber-400 transition-colors flex items-center gap-1"
                          >
                            {p.full_name}
                            <Eye className="h-3 w-3 text-zinc-500" />
                          </Link>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] text-zinc-500">
                              {p.hire_count || 0}x Hired • ★ {(p.rating || 5.0).toFixed(1)}
                            </span>
                            {p.is_suspended && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 whitespace-nowrap">
                                ⛔ Skorsing
                              </span>
                            )}
                            {p.is_locked && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                                🔒 Terkunci
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Skills & Tools */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1 max-w-[200px]">
                        <div className="flex flex-wrap gap-1">
                          {(p.skills || []).slice(0, 2).map((s, i) => (
                            <span key={i} className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-300">
                              {s}
                            </span>
                          ))}
                        </div>
                        {p.tools && p.tools.length > 0 && (
                          <span className="text-[10px] text-amber-400/80 block line-clamp-1">
                            Tools: {p.tools.slice(0, 3).join(', ')}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Live Working Toggle */}
                    <td className="py-3.5 px-4">
                      {(() => {
                        const statusMeta = getTalentStatus(p);
                        return (
                          <button
                            onClick={() => toggleWorkingStatus(p.id)}
                            className="flex items-center gap-2 focus:outline-none"
                            title="Klik untuk ubah status ketersediaan"
                          >
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                              statusMeta.variant === 'warning'
                                ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                                : statusMeta.variant === 'info'
                                ? 'border-blue-500/40 bg-blue-500/10 text-blue-400'
                                : statusMeta.variant === 'danger'
                                ? 'border-red-500/40 bg-red-500/10 text-red-300'
                                : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                            }`}>
                              <span className={`h-2 w-2 rounded-full ${statusMeta.dotColor} ${statusMeta.pulse ? 'animate-pulse' : ''}`}></span>
                              {statusMeta.label}
                            </span>
                          </button>
                        );
                      })()}
                    </td>

                    {/* Price & DP */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div>
                          {p.forced_price !== null && p.forced_price !== undefined ? (
                            <>
                              <span className="font-bold text-zinc-500 line-through text-[11px] block">{formatRupiahDisplay(p.base_price || 0)}</span>
                              <span className="font-bold text-red-400 text-xs">Penalti: {formatRupiahDisplay(p.forced_price)}</span>
                            </>
                          ) : (
                            <span className="font-bold text-amber-400">{formatRupiahDisplay(p.base_price || 0)}</span>
                          )}
                          <div className="text-[10px] text-zinc-400">
                            DP: <strong className="text-zinc-200">{p.dp_percentage}%</strong>
                          </div>
                        </div>
                        <button
                          onClick={() => handleOpenPriceOverride(p)}
                          className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-1.5 text-amber-400 hover:bg-amber-500/20"
                          title="Quick Price Override"
                        >
                          <Sliders className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Review / Published switch */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => toggleTesterStatus(p.id)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${
                          p.is_tester
                            ? 'border border-purple-500/40 bg-purple-500/10 text-purple-300'
                            : 'border border-zinc-800 bg-zinc-950 text-zinc-500'
                        }`}
                        title="Klik untuk ubah visibilitas publik talent"
                      >
                        {p.is_tester ? 'Dalam Peninjauan (Hidden)' : 'Publik Live'}
                      </button>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Discipline / Suspension Button */}
                        <button
                          onClick={() => handleOpenDiscipline(p)}
                          className={`rounded-lg p-1.5 transition-colors border ${
                            p.is_suspended
                              ? 'text-red-400 bg-red-500/20 border-red-500/40 hover:bg-red-500/30'
                              : p.is_locked
                              ? 'text-amber-400 bg-amber-500/20 border-amber-500/40 hover:bg-amber-500/30'
                              : 'text-zinc-400 hover:bg-red-500/10 hover:text-red-400 border-zinc-800 hover:border-red-500/30'
                          }`}
                          title="Tindakan Disiplin & Skorsing"
                        >
                          <ShieldAlert className="h-3.5 w-3.5" />
                        </button>

                        {/* Full Edit Profile Button */}
                        <button
                          onClick={() => handleOpenFullEdit(p)}
                          className="rounded-lg p-1.5 text-amber-400 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
                          title="Full Member Profile Editor"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteMember(p.id, p.full_name)}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-colors"
                          title="Hapus Member"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: BOOKINGS TABLE */}
      {activeTab === 'bookings' && (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-md overflow-hidden shadow-xl space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Daftar Tiket & Pesanan Klien</h2>
              <p className="text-xs text-zinc-400">
                Pantau antrean pengerjaan, verifikasi transfer DP, dan kelola kelanjutan status order.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Cari no. tiket, nama klien, atau talent..."
                value={bookingSearchQuery}
                onChange={(e) => setBookingSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-700 bg-zinc-950 text-xs text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* TAMPILAN MOBILE: CARD VIEW HYBRID (< 768px) */}
          <div className="block md:hidden space-y-3">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-8 text-xs text-zinc-500 bg-zinc-900/50 rounded-xl border border-zinc-800">
                Tidak ada tiket pesanan yang cocok dengan pencarian.
              </div>
            ) : (
              filteredBookings.map((b) => {
                const cleanWa = b.client_whatsapp.replace(/\D/g, '');
                const waNumber = cleanWa.startsWith('0') ? '62' + cleanWa.slice(1) : cleanWa;
                const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(
                  `Halo Kak ${b.client_name}, ini dari Tim Owner Creative Hub mengenai pesanan ${b.ticket_code}.`
                )}`;
                const { talentShare, hubShare, isCustomKas } = getBookingShares(b);

                return (
                  <div
                    key={b.id}
                    className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 space-y-2.5 shadow-sm overflow-hidden"
                  >
                    {/* Header Kartu */}
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 whitespace-nowrap">
                        {b.ticket_code}
                      </span>
                      <div className="shrink-0">
                        {getStatusBadge(b.status, b.step_progress)}
                      </div>
                    </div>

                    {/* Body Kartu */}
                    <div className="space-y-2 text-xs pt-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-zinc-400 text-[11px] shrink-0">Klien:</span>
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-bold text-white truncate">{b.client_name}</span>
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 transition"
                            title="Chat WhatsApp Klien (Satu Pintu Owner)"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>WA</span>
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-zinc-400 text-[11px] shrink-0">Talent:</span>
                        <span className="font-semibold text-zinc-200 truncate">{b.talent_name}</span>
                      </div>
                    </div>

                    {/* Pembagian Hasil 75/25 & Kas Hub Override (Modul 1) */}
                    <div className="pt-2 border-t border-zinc-800/80 grid grid-cols-2 gap-2 text-xs bg-zinc-950/50 p-2 rounded-lg border border-zinc-800/50">
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase font-medium">Hak Talent (75%)</span>
                        <p className="text-xs font-bold text-emerald-400">{formatRupiah(talentShare)}</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-zinc-400 uppercase font-medium">
                            Kas Hub {isCustomKas ? '(Manual)' : '(25%)'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenKasModal(b)}
                            className="text-amber-400 hover:text-amber-300 p-0.5 rounded hover:bg-zinc-800 transition"
                            title="Edit Kas Hub Manual"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-xs font-bold text-amber-400">{formatRupiah(hubShare)}</p>
                      </div>
                    </div>

                    {/* Footer Kartu */}
                    <div className="pt-1 border-t border-zinc-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span>{b.deadline_date}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-white text-xs">{formatRupiah(b.estimated_total)}</span>
                          <span className="text-[10px] text-amber-400 font-medium block">
                            DP: {formatRupiah(b.dp_amount)}
                          </span>
                        </div>
                      </div>

                      {/* Dropdown status 5-tahap stepper + Tombol Brief (Modul 6: Flexbox Terkendali) */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center gap-2 w-full pt-1.5 overflow-hidden">
                          <select
                            value={b.step_progress || (b.status === 'completed' ? 5 : b.status === 'in_review' ? 3 : b.status === 'in_progress' ? 2 : 1)}
                            onChange={(e) => handleOwnerSetStep(b.id, Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                            className="flex-1 min-w-0 text-xs py-2 px-2.5 bg-zinc-950 border border-zinc-700/80 rounded-lg text-zinc-200 truncate focus:outline-none focus:border-amber-500"
                          >
                            <option value={1}>⏳ Tahap 1: Verifikasi DP Diterima</option>
                            <option value={2}>⚡ Tahap 2: Pengerjaan Draft Desain</option>
                            <option value={3}>🔍 Tahap 3: Review Draf & Revisi</option>
                            <option value={4}>💳 Tahap 4: Verifikasi Pelunasan 100%</option>
                            <option value={5}>🎉 Tahap 5: Order Selesai Penuh</option>
                          </select>

                          <button
                            onClick={() => handleOpenBookingDetail(b)}
                            className="shrink-0 text-xs font-semibold py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg whitespace-nowrap transition-colors"
                          >
                            Brief
                          </button>
                        </div>

                        {/* Tombol Cepat Aksi Verifikasi Owner */}
                        {((b.step_progress || 1) <= 1 || b.status === 'pending_dp') && (
                          <button
                            type="button"
                            onClick={() => handleOwnerSetStep(b.id, 1)}
                            className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition shadow-gold-glow flex items-center justify-center gap-1.5"
                          >
                            <span>⚡ Verifikasi DP Diterima (Set ke Tahap 1)</span>
                          </button>
                        )}

                        {(b.step_progress === 3 || b.status === 'in_review') && (
                          <button
                            type="button"
                            onClick={() => handleOwnerSetStep(b.id, 4)}
                            className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg flex items-center justify-center gap-1.5"
                          >
                            <span>💳 Verifikasi Pelunasan 100% (Set ke Tahap 4)</span>
                          </button>
                        )}

                        {(b.step_progress === 4) && (
                          <button
                            type="button"
                            onClick={() => handleOwnerSetStep(b.id, 5)}
                            className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition shadow-lg flex items-center justify-center gap-1.5"
                          >
                            <span>🎉 Tandai Order Selesai Penuh (Set ke Tahap 5)</span>
                          </button>
                        )}
                      </div>

                      {b.has_reviewed && (
                        <div className="pt-1 text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Ulasan Masuk dari Klien
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* TAMPILAN DESKTOP: TABEL STANDAR RAPI (Modul 3: DENSITY COMPACT & ANTI-POTONG) */}
          <div className="hidden md:block w-full overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/80 shadow-xl">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[11px] font-semibold tracking-wider bg-zinc-950/90">
                  <th className="py-3 px-3.5 w-[15%] font-mono text-xs whitespace-nowrap">No. Tiket</th>
                  <th className="py-3 px-3.5 w-[27%]">Klien & Talent</th>
                  <th className="py-3 px-3.5 w-[15%] whitespace-nowrap">Target Deadline</th>
                  <th className="py-3 px-3.5 w-[18%] whitespace-nowrap">Bagi Hasil (75/25)</th>
                  <th className="py-3 px-3.5 w-[25%] text-right pr-4 whitespace-nowrap">Aksi / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredBookings.map((b) => {
                  const cleanWa = b.client_whatsapp.replace(/\D/g, '');
                  const waNumber = cleanWa.startsWith('0') ? '62' + cleanWa.slice(1) : cleanWa;
                  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(
                    `Halo Kak ${b.client_name}, ini dari Tim Owner Creative Hub mengenai pesanan ${b.ticket_code}.`
                  )}`;
                  const { talentShare, hubShare, isCustomKas } = getBookingShares(b);

                  return (
                    <tr key={b.id} className="hover:bg-zinc-800/30 transition-colors">
                      {/* No. Tiket: 15% */}
                      <td className="py-3 px-3.5 w-[15%] font-mono text-xs whitespace-nowrap">
                        <span className="font-bold text-amber-400 block">{b.ticket_code}</span>
                        <span className="text-[10px] text-zinc-500 font-sans">
                          DP {formatRupiah(b.dp_amount)}
                        </span>
                      </td>

                      {/* Klien & Talent: 27% */}
                      <td className="py-3 px-3.5 w-[27%]">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 truncate">
                            <strong className="text-white text-xs truncate">{b.client_name}</strong>
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 px-1.5 py-0.2 rounded text-[10px] shrink-0"
                              title="Chat WhatsApp Klien (Satu Pintu Owner)"
                            >
                              <MessageCircle className="w-2.5 h-2.5" /> WA
                            </a>
                          </div>
                          <div className="text-[11px] text-zinc-400 truncate">
                            Talent: <span className="text-zinc-200 font-medium">{b.talent_name}</span>
                          </div>
                        </div>
                      </td>

                      {/* Target Deadline: 15% */}
                      <td className="py-3 px-3.5 w-[15%] whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                          <Calendar className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                          <span>{b.deadline_date}</span>
                        </div>
                        <div className="text-[11px] font-semibold text-white mt-0.5">
                          Total: {formatRupiah(b.estimated_total)}
                        </div>
                      </td>

                      {/* Bagi Hasil (75/25) & Kas Hub Override: 18% */}
                      <td className="py-3 px-3.5 w-[18%] whitespace-nowrap">
                        <div className="space-y-0.5 text-xs">
                          <div className="text-emerald-400 font-bold">
                            <span className="text-[10px] text-zinc-500 font-normal">Talent (75%): </span>
                            {formatRupiah(talentShare)}
                          </div>
                          <div className="text-amber-400 font-bold flex items-center gap-1">
                            <span className="text-[10px] text-zinc-500 font-normal">
                              Kas {isCustomKas ? '(Manual)' : '(25%)'}:{' '}
                            </span>
                            <span>{formatRupiah(hubShare)}</span>
                            <button
                              type="button"
                              onClick={() => handleOpenKasModal(b)}
                              className="p-0.5 rounded hover:bg-zinc-800 text-amber-400 hover:text-amber-300 transition shrink-0"
                              title="Edit Kas Hub Manual"
                            >
                              <Edit2 className="w-3 h-3 inline" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Aksi / Status: 25% text-right pr-4 */}
                      <td className="py-3 px-3.5 w-[25%] text-right pr-4">
                        <div className="flex items-center justify-end gap-2">
                          <div className="flex flex-col items-end gap-1 min-w-0">
                            <div>{getStatusBadge(b.status, b.step_progress)}</div>
                            <select
                              value={b.step_progress || (b.status === 'completed' ? 5 : b.status === 'in_review' ? 3 : b.status === 'in_progress' ? 2 : 1)}
                              onChange={(e) => handleOwnerSetStep(b.id, Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                              className="rounded-lg py-1 px-2 text-[10px] font-bold border border-zinc-700 bg-zinc-800 text-zinc-200 focus:border-amber-400 focus:outline-none cursor-pointer max-w-[140px] truncate"
                            >
                              <option value={1}>Tahap 1: Verif DP</option>
                              <option value={2}>Tahap 2: Draf Desain</option>
                              <option value={3}>Tahap 3: Review Draf</option>
                              <option value={4}>Tahap 4: Pelunasan 100%</option>
                              <option value={5}>Tahap 5: Selesai</option>
                            </select>
                          </div>

                          <button
                            onClick={() => handleOpenBookingDetail(b)}
                            className="shrink-0 px-3 py-1.5 text-xs whitespace-nowrap font-semibold rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 hover:border-amber-400 hover:text-amber-400 transition-colors"
                          >
                            Brief
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: KEUANGAN & BAGI HASIL (REVENUE SPLIT 75/25 & KAS OVERRIDE) */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          {/* Revenue Split Top Metrics (Modul 1) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Omset Masuk (100%)</span>
                <Banknote className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-extrabold text-white mt-2">{formatRupiahDisplay(totalRevenue)}</p>
              <span className="text-[11px] text-zinc-500">{validBookings.length} Pesanan Aktif & Selesai</span>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-zinc-900/80 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Hak Seluruh Talent (75%)</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">75%</span>
              </div>
              <p className="text-2xl font-extrabold text-emerald-400 mt-2">{formatRupiahDisplay(totalTalentShare)}</p>
              <span className="text-[11px] text-emerald-500/80 font-medium">Alokasi Bersih Kreator Pelajar</span>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-zinc-900/80 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Akumulasi Kas Agensi (25%)</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">25%+</span>
              </div>
              <p className="text-2xl font-extrabold text-amber-400 mt-2">{formatRupiahDisplay(totalHubShare)}</p>
              <span className="text-[11px] text-zinc-500">Operasional & Kas Bersama (+Penyesuaian)</span>
            </div>

            <div className="rounded-2xl border border-yellow-500/30 bg-zinc-900/80 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Sisa Belum Ditransfer</span>
                <Clock className="h-4 w-4 text-yellow-400" />
              </div>
              <p className="text-2xl font-extrabold text-yellow-400 mt-2">{formatRupiahDisplay(totalUnpaidTalentShare)}</p>
              <span className="text-[11px] text-yellow-500/80 font-medium">{unpaidBookingsCount} order menunggu transfer</span>
            </div>
          </div>

          {/* Banner Transparansi Kas Pelajar */}
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-zinc-950 to-zinc-900 p-4 sm:p-5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-zinc-300 leading-relaxed">
              <p className="font-bold text-white">Transparansi Finansial Kolektif (75% Mahasiswa / 25% Kas Agensi)</p>
              <p className="text-zinc-400">
                Setiap pembayaran yang diterima dialokasikan 75% bersih ke rekening/e-wallet talent yang mengerjakan pesanan. Sisanya 25% (atau sesuai penyesuaian manual owner) dialokasikan untuk pemeliharaan platform, promosi, dan kas kolektif pelajar.
              </p>
            </div>
          </div>

          {/* Tabel Payout Tracking */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-md overflow-hidden shadow-xl space-y-4 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Payout Tracking Talent</h2>
                <p className="text-xs text-zinc-400">
                  Pantau distribusi hak pembayaran ke masing-masing talent, sesuaikan kas manual, dan tandai transfer selesai dengan satu klik.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowGlobalSplitModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black rounded-lg transition-colors shrink-0"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Atur Split Global</span>
                </button>

                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Cari tiket, talent, klien..."
                    value={financeSearchQuery}
                    onChange={(e) => setFinanceSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-700 bg-zinc-950 text-xs text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* TAMPILAN MOBILE: CARD VIEW */}
            <div className="block md:hidden space-y-3">
              {filteredFinanceBookings.map((b) => {
                const isPaid = b.payout_status === 'paid';
                const { talentShare, hubShare, isCustomKas } = getBookingShares(b);

                return (
                  <div key={b.id} className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-3 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 whitespace-nowrap">
                        {b.ticket_code}
                      </span>
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                        isPaid
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {isPaid ? 'Sudah Ditransfer' : 'Belum Ditransfer'}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="text-zinc-400">Talent: <strong className="text-white">{b.talent_name}</strong></p>
                      <p className="text-zinc-400">Klien: <span className="text-zinc-300">{b.client_name}</span></p>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/80 grid grid-cols-2 gap-2 text-xs bg-zinc-950/40 p-2 rounded-lg border border-zinc-800/40">
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase font-medium">Hak Talent (75%)</span>
                        <p className="text-sm font-extrabold text-emerald-400">{formatRupiahDisplay(talentShare)}</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-zinc-500 uppercase font-medium">
                            Kas Hub {isCustomKas ? '(Manual)' : '(25%)'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenKasModal(b)}
                            className="p-0.5 rounded text-amber-400 hover:text-amber-300 hover:bg-zinc-800 transition"
                            title="Edit Kas Hub Manual"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-sm font-extrabold text-amber-400">{formatRupiahDisplay(hubShare)}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-zinc-400">
                        Total: <strong className="text-white">{formatRupiahDisplay(b.estimated_total)}</strong>
                      </span>
                      <button
                        onClick={() => handleTogglePayout(b.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isPaid
                            ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-md'
                        }`}
                      >
                        {isPaid ? 'Batal Selesai' : 'Tandai Payout Selesai'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TAMPILAN DESKTOP: TABLE */}
            <div className="hidden md:block w-full overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/80 shadow-xl">
              <table className="w-full text-left text-xs text-zinc-300 border-collapse">
                <thead className="border-b border-zinc-800 bg-zinc-950/90 text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
                  <tr>
                    <th className="px-4 py-3.5 whitespace-nowrap">ID Tiket</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Nama Talent</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Klien</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Total Proyek</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Hak Talent (75%)</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Kas Hub (25% / Override)</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Status Payout</th>
                    <th className="px-4 py-3.5 text-right whitespace-nowrap pr-4">Aksi Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredFinanceBookings.map((b) => {
                    const isPaid = b.payout_status === 'paid';
                    const { talentShare, hubShare, isCustomKas } = getBookingShares(b);

                    return (
                      <tr key={b.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                            {b.ticket_code}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-medium text-white">
                          {b.talent_name}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-zinc-300">
                          {b.client_name}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-semibold text-white">
                          {formatRupiahDisplay(b.estimated_total)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-extrabold text-emerald-400 text-sm">
                          {formatRupiahDisplay(talentShare)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-medium text-amber-400">
                          <div className="flex items-center gap-1.5">
                            <span>{formatRupiahDisplay(hubShare)}</span>
                            {isCustomKas && (
                              <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 py-0.2 rounded font-normal">
                                Manual
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenKasModal(b)}
                              className="p-1 rounded text-amber-400 hover:text-amber-300 hover:bg-zinc-800 transition ml-1"
                              title="Edit Kas Hub Manual"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle className="w-3 h-3" />
                              <span>Sudah Ditransfer</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                              <span>Belum Ditransfer</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap pr-4">
                          <button
                            onClick={() => handleTogglePayout(b.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              isPaid
                                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                                : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-md'
                            }`}
                          >
                            {isPaid ? 'Batal Selesai' : 'Tandai Payout Selesai'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PROVISI MEMBER BARU */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Buat Akun Member Baru</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Provisi aman melalui Server Action tanpa mengganggu sesi Owner
                  </p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {addMemberMessage && (
                <div
                  className={`mt-4 rounded-xl p-3 text-xs font-semibold ${
                    addMemberMessage.type === 'success'
                      ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                      : 'border border-red-500/40 bg-red-500/10 text-red-400'
                  }`}
                >
                  {addMemberMessage.text}
                </div>
              )}

              <form onSubmit={handleCreateMember} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Nama Lengkap Member
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Farhan Nugraha"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Email Login
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="farhan@creativehub.id"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Password Sementara
                    </label>
                    <input
                      type="text"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Keahlian (Pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="PPT Specialist, Keynote, Infografis"
                    value={newSkills}
                    onChange={(e) => setNewSkills(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Tarif Dasar (IDR)
                    </label>
                    <input
                      type="number"
                      step="50000"
                      min="0"
                      required
                      value={newBasePrice}
                      onChange={(e) => setNewBasePrice(Number(e.target.value))}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Persentase DP (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={newDpPercentage}
                      onChange={(e) => setNewDpPercentage(Number(e.target.value))}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Peninjauan / Publish Switch */}
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="isTesterCheck"
                    checked={newIsTester}
                    onChange={(e) => setNewIsTester(e.target.checked)}
                    className="h-4 w-4 rounded accent-amber-400"
                  />
                  <label htmlFor="isTesterCheck" className="text-xs text-zinc-300 cursor-pointer">
                    Simpan sebagai <strong>Member Dalam Peninjauan</strong> (belum dipublikasikan ke publik)
                  </label>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingNewMember}
                    className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-zinc-950 shadow-gold-glow hover:bg-amber-400 transition-all disabled:opacity-50"
                  >
                    {isSubmittingNewMember ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Membuat Akun...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span>Buat Member</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL EDIT KAS HUB MANUAL (OWNER MANUAL OVERRIDE - MODUL 1) */}
      <AnimatePresence>
        {isKasModalOpen && selectedBookingForKas && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsKasModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl z-10 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-2 text-amber-400">
                  <DollarSign className="w-5 h-5" />
                  <h3 className="text-base font-bold text-white">Penyesuaian Manual Kas Hub</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsKasModalOpen(false)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Kode Tiket:</span>
                  <span className="font-mono font-bold text-amber-400">{selectedBookingForKas.ticket_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Talent:</span>
                  <span className="font-medium text-white">{selectedBookingForKas.talent_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Total Nilai Proyek:</span>
                  <span className="font-bold text-white">{formatRupiah(selectedBookingForKas.estimated_total || 0)}</span>
                </div>
              </div>

              <form onSubmit={handleSaveKasOverride} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Nominal Kas Agensi Hub (IDR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">Rp</span>
                    <input
                      type="number"
                      min="0"
                      max={selectedBookingForKas.estimated_total || 0}
                      step="1000"
                      required
                      value={kasOverrideInput}
                      onChange={(e) => setKasOverrideInput(Number(e.target.value))}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 pl-10 pr-4 py-2.5 text-sm font-bold text-amber-400 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Nilai default 25%: {formatRupiah(Math.round((selectedBookingForKas.estimated_total || 0) * 0.25))}
                  </p>
                </div>

                {/* Dynamic recalculation preview */}
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs space-y-1">
                  <div className="flex justify-between items-center text-emerald-300 font-medium">
                    <span>Hak Bersih Talent (Otomatis):</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      {formatRupiah(Math.max(0, (selectedBookingForKas.estimated_total || 0) - (Number(kasOverrideInput) || 0)))}
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-500/80">
                    Dihitung otomatis: Total Proyek ({formatRupiah(selectedBookingForKas.estimated_total || 0)}) - Kas Hub ({formatRupiah(Number(kasOverrideInput) || 0)})
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsKasModalOpen(false)}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingKas}
                    className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-zinc-950 shadow-gold-glow hover:bg-amber-400 transition-all disabled:opacity-50"
                  >
                    {isSavingKas ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Simpan Penyesuaian</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL PENGATURAN SPLIT KAS MASSAL / GLOBAL CONTROLLER (MODUL 1C) */}
      <AnimatePresence>
        {showGlobalSplitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGlobalSplitModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl z-10 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-2 text-amber-400">
                  <Sliders className="w-5 h-5" />
                  <h3 className="text-base font-bold text-white">Atur Split Kas Global (Massal)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGlobalSplitModal(false)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/60 space-y-1">
                <p className="font-semibold text-white">Kontrol Bagi Hasil Agensi</p>
                <p className="text-zinc-400">
                  Tentukan persentase potongan kas agensi hub untuk diterapkan secara massal pada pesanan.
                </p>
              </div>

              <form onSubmit={handleApplyGlobalSplit} className="space-y-4">
                {/* Pilihan Preset Cepat */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">
                    Preset Pembagian Cepat:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setGlobalKasPercentage(20)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                        globalKasPercentage === 20
                          ? 'bg-amber-500 text-black border-amber-400 shadow-gold-glow'
                          : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-750'
                      }`}
                    >
                      20% Kas / 80% Talent
                    </button>
                    <button
                      type="button"
                      onClick={() => setGlobalKasPercentage(25)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                        globalKasPercentage === 25
                          ? 'bg-amber-500 text-black border-amber-400 shadow-gold-glow'
                          : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-750'
                      }`}
                    >
                      25% Kas / 75% Talent
                    </button>
                    <button
                      type="button"
                      onClick={() => setGlobalKasPercentage(30)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                        globalKasPercentage === 30
                          ? 'bg-amber-500 text-black border-amber-400 shadow-gold-glow'
                          : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-750'
                      }`}
                    >
                      30% Kas / 70% Talent
                    </button>
                  </div>
                </div>

                {/* Input Number Kustom */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Atau Masukkan Persentase Kustom Kas Hub (%):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      required
                      value={globalKasPercentage}
                      onChange={(e) => setGlobalKasPercentage(Math.max(0, Math.min(100, Number(e.target.value))))}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm font-bold text-amber-400 focus:border-amber-400 focus:outline-none pr-10"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-500">%</span>
                  </div>
                </div>

                {/* Dynamic Preview */}
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs space-y-1">
                  <div className="flex justify-between items-center text-emerald-300 font-medium">
                    <span>Alokasi Hak Bersih Talent:</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      {100 - (Number(globalKasPercentage) || 0)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-amber-300 font-medium">
                    <span>Alokasi Kas Agensi Hub:</span>
                    <span className="font-bold text-amber-400 text-sm">
                      {Number(globalKasPercentage) || 0}%
                    </span>
                  </div>
                </div>

                {/* Checkbox Konfirmasi (Default: Checked) */}
                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="applyToUnpaidCheck"
                    checked={applyToUnpaidOnly}
                    onChange={(e) => setApplyToUnpaidOnly(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded accent-amber-400"
                  />
                  <label htmlFor="applyToUnpaidCheck" className="text-xs text-zinc-300 cursor-pointer select-none">
                    Terapkan perubahan ini secara massal ke semua pesanan yang berstatus <strong>&apos;Belum Ditransfer&apos;</strong>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowGlobalSplitModal(false)}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isApplyingGlobalSplit}
                    className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-zinc-950 shadow-gold-glow hover:bg-amber-400 transition-all disabled:opacity-50"
                  >
                    {isApplyingGlobalSplit ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Menerapkan Split...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Terapkan Split Massal</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QUICK PRICE OVERRIDE MODAL */}
      <PriceOverrideModal
        isOpen={isPriceModalOpen}
        onClose={() => setIsPriceModalOpen(false)}
        profile={selectedProfileForPrice}
        onUpdated={handleProfileUpdated}
      />

      {/* FULL MEMBER PROFILE EDITOR MODAL */}
      <OwnerMemberEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={selectedProfileForEdit}
        onProfileUpdated={handleProfileUpdated}
      />

      {/* BOOKING DETAIL & STATUS INSPECTION MODAL */}
      <BookingDetailModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        booking={selectedBookingForDetail}
        onStatusUpdated={handleBookingUpdated}
      />

      {/* DISCIPLINE & SUSPENSION MODAL */}
      <DisciplineModal
        isOpen={isDisciplineModalOpen}
        onClose={() => setIsDisciplineModalOpen(false)}
        profile={selectedProfileForDiscipline}
        onSaved={handleProfileUpdated}
      />

      {/* TOAST NOTIFIKASI LOGOUT */}
      {logoutToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-emerald-500/40 bg-zinc-900 px-5 py-3.5 text-xs font-bold text-emerald-400 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span>Anda berhasil keluar. Mengalihkan ke halaman login...</span>
        </div>
      )}
    </div>
  );
}
