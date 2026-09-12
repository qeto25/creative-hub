'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  User,
  Briefcase,
  Upload,
  Plus,
  Trash2,
  Check,
  Save,
  LogOut,
  Sparkles,
  DollarSign,
  Percent,
  FolderPlus,
  Loader2,
  Wrench,
  Package,
  Clock,
  RotateCcw,
  Image as ImageIcon,
  AlertCircle,
  Zap,
  FileCode,
  AlertTriangle,
  ShieldAlert,
  Ban,
  Lock,
  Layers,
  MessageCircle,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { MOCK_PROFILES, MOCK_PORTFOLIOS, MOCK_BOOKINGS } from '@/lib/data/mock-data';
import { Profile, Portfolio, Booking, BookingStatus } from '@/lib/types';
import { uploadAsset, validateImageFile } from '@/lib/supabase/storage';
import * as dataLayer from '@/lib/dataLayer';
import { isDemoMode } from '@/lib/config';
import { createClient } from '@/lib/supabase/client';
import { formatRupiah, parseRupiah } from '@/lib/utils/currency';

const STUDENT_TOOLS_PRESET = [
  'Canva',
  'CapCut',
  'Alight Motion',
  'Ibis Paint X',
  'PowerPoint',
  'Word',
  'Photoshop',
  'Illustrator',
  'Figma',
  'VN Video Editor',
];

export default function MemberDashboardPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'portfolio'>('orders');
  const [profile, setProfile] = useState<Profile>(MOCK_PROFILES[0]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Load member data via unified Data Layer (otomatis pilih snapshot demo atau live Supabase)
  useEffect(() => {
    async function loadMemberData() {
      try {
        let targetId = MOCK_PROFILES[0].id;
        if (!isDemoMode()) {
          try {
            const supabase = createClient();
            const { data: userData } = await supabase.auth.getUser();
            if (userData?.user?.id) {
              targetId = userData.user.id;
            }
          } catch (e) {
            // ignore
          }
        }

        const dbProfile = await dataLayer.getProfileByIdOrSlug(targetId);

        if (dbProfile) {
          setProfile(dbProfile);
          setBio(dbProfile.bio || '');
          setWhatsapp(dbProfile.whatsapp_number || '6281234567891');
          setAvatarUrl(dbProfile.avatar_url || MOCK_PROFILES[0].avatar_url);
          setCoverUrl(dbProfile.cover_url || '');
          setSelectedTools(dbProfile.tools || ['PowerPoint', 'Canva']);
          setTurnaroundTime(dbProfile.turnaround_time || '2-3 Hari Kerja');
          setDeliverablesInput((dbProfile.deliverables || ['Editable PPTX', 'High-Res PDF']).join(', '));
          setFreeRevisions(dbProfile.free_revisions ?? 1);
          setRevisionNotes(dbProfile.revision_notes || '1x revisi minor gratis');
          setIsWorking(dbProfile.is_working ?? false);
          setIsAvailable(dbProfile.is_available ?? true);
          const initialAvail = dbProfile.availability_status || (dbProfile.is_available === false ? 'resting' : dbProfile.is_working ? 'busy' : 'available');
          setAvailabilityStatus(initialAvail);

          // Pricing fields
          const bPrice = Number(dbProfile.base_price ?? 20000);
          const rFee = Number(dbProfile.rush_fee ?? 10000);
          const sPrice = Number(dbProfile.source_file_price ?? 5000);
          const eFee = Number(dbProfile.extra_revision_fee ?? 3000);

          setBasePrice(bPrice);
          setBasePriceInput(formatRupiah(bPrice));
          setDpPercentage(Number(dbProfile.dp_percentage ?? 30));
          setExtraRevisionFee(eFee);
          setExtraRevisionFeeInput(formatRupiah(eFee));
          setRushFee(rFee);
          setRushFeeInput(formatRupiah(rFee));
          setSourceFilePrice(sPrice);
          setSourceFilePriceInput(formatRupiah(sPrice));

          // Load portfolios & bookings via DataLayer
          const [fetchedPortfolios, fetchedBookings] = await Promise.all([
            dataLayer.getPortfolios({ profileId: dbProfile.id }),
            dataLayer.getBookings({ profileId: dbProfile.id }),
          ]);

          if (fetchedPortfolios) {
            setPortfolios(fetchedPortfolios);
          }
          if (fetchedBookings) {
            setBookings(fetchedBookings);
          }
        }
      } catch (e) {
        console.warn('[MemberDashboardPage] Member fetch note:', e);
      }
    }
    loadMemberData();
  }, []);

  // Handle Member Step Updates (Pemisahan Wewenang MODUL 4)
  const handleMemberUpdateStep = async (bookingId: string, targetStep: 2 | 3 | 5) => {
    let newStatus: BookingStatus = 'in_progress';
    if (targetStep === 3) newStatus = 'in_review';
    if (targetStep === 5) newStatus = 'completed';

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, step_progress: targetStep, status: newStatus } : b
      )
    );

    try {
      await dataLayer.updateBooking(bookingId, {
        step_progress: targetStep,
        status: newStatus,
      });
    } catch (e) {
      console.warn('Member update step note:', e);
    }
  };

  // Profile Form state
  const [bio, setBio] = useState(profile.bio || '');
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp_number || '6281234567891');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [coverUrl, setCoverUrl] = useState(profile.cover_url || '');
  const [selectedTools, setSelectedTools] = useState<string[]>(profile.tools || ['PowerPoint', 'Canva']);
  const [customToolInput, setCustomToolInput] = useState('');
  const [turnaroundTime, setTurnaroundTime] = useState(profile.turnaround_time || '2-3 Hari Kerja');
  const [deliverablesInput, setDeliverablesInput] = useState((profile.deliverables || []).join(', '));
  const [freeRevisions, setFreeRevisions] = useState<number>(profile.free_revisions ?? 1);
  const [revisionNotes, setRevisionNotes] = useState(profile.revision_notes || '1x revisi minor gratis');

  // Form Tarif Mandiri State (Pelajar Friendly) with Masked Inputs
  const [basePrice, setBasePrice] = useState<number>(profile.base_price ?? 20000);
  const [basePriceInput, setBasePriceInput] = useState<string>(() => formatRupiah(profile.base_price ?? 20000));
  const [dpPercentage, setDpPercentage] = useState<number>(profile.dp_percentage ?? 30);
  const [extraRevisionFee, setExtraRevisionFee] = useState<number>(profile.extra_revision_fee ?? 3000);
  const [extraRevisionFeeInput, setExtraRevisionFeeInput] = useState<string>(() => formatRupiah(profile.extra_revision_fee ?? 3000));
  const [rushFee, setRushFee] = useState<number>(profile.rush_fee ?? 10000);
  const [rushFeeInput, setRushFeeInput] = useState<string>(() => formatRupiah(profile.rush_fee ?? 10000));
  const [sourceFilePrice, setSourceFilePrice] = useState<number>(profile.source_file_price ?? 5000);
  const [sourceFilePriceInput, setSourceFilePriceInput] = useState<string>(() => formatRupiah(profile.source_file_price ?? 5000));

  const [isWorking, setIsWorking] = useState(profile.is_working);
  const [isAvailable, setIsAvailable] = useState<boolean>(profile.is_available ?? true);
  const [availabilityStatus, setAvailabilityStatus] = useState<'available' | 'busy' | 'resting'>(
    profile.availability_status || (profile.is_available === false ? 'resting' : profile.is_working ? 'busy' : 'available')
  );

  // Suspension & Discipline checks
  const isSuspended = !!profile.is_suspended;
  const isLocked = !!profile.is_locked;
  const isLockedOrSuspended = isSuspended || isLocked;

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pricingSaveSuccess, setPricingSaveSuccess] = useState(false);
  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Set Availability Status (Segmented Pill Buttons)
  const handleSetAvailabilityStatus = async (newStatus: 'available' | 'busy' | 'resting') => {
    if (isLockedOrSuspended) return;

    setAvailabilityStatus(newStatus);
    const isWorkingVal = newStatus === 'busy';
    const isAvailableVal = newStatus !== 'resting';
    setIsWorking(isWorkingVal);
    setIsAvailable(isAvailableVal);

    setProfile((prev) => ({
      ...prev,
      availability_status: newStatus,
      is_working: isWorkingVal,
      is_available: isAvailableVal,
    }));

    try {
      await dataLayer.updateProfile(profile.id, {
        availability_status: newStatus,
        is_working: isWorkingVal,
        is_available: isAvailableVal,
      });
    } catch (e) {
      console.warn('Update availability_status note:', e);
    }
  };

  // Upload States
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // New Portfolio Item Form
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('PPT Specialist');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaType, setNewMediaType] = useState<'image' | 'video'>('image');
  const [newDescription, setNewDescription] = useState('');
  const [isAddingPortfolio, setIsAddingPortfolio] = useState(false);

  // Toggle Working Status
  const handleToggleWorking = async () => {
    const updated = !isWorking;
    setIsWorking(updated);
    setProfile((prev) => ({ ...prev, is_working: updated }));

    try {
      await dataLayer.updateProfile(profile.id, { is_working: updated });
    } catch (e) {
      console.warn('Update working status note:', e);
    }
  };

  // Toggle Tool Selection
  const toggleTool = (tool: string) => {
    if (selectedTools.includes(tool)) {
      setSelectedTools(selectedTools.filter((t) => t !== tool));
    } else {
      setSelectedTools([...selectedTools, tool]);
    }
  };

  // Add Custom Tool
  const handleAddCustomTool = () => {
    if (customToolInput.trim() && !selectedTools.includes(customToolInput.trim())) {
      setSelectedTools([...selectedTools, customToolInput.trim()]);
      setCustomToolInput('');
    }
  };

  // Avatar Upload Handler with Real Storage & Max 2MB Check
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLockedOrSuspended) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'File tidak valid.');
      return;
    }

    setIsUploadingAvatar(true);
    const { url, error } = await uploadAsset(file, 'avatars');
    if (error || !url) {
      setUploadError(error || 'Gagal mengunggah foto profil.');
    } else {
      setAvatarUrl(url);
      setProfile((prev) => ({ ...prev, avatar_url: url }));

      // Simpan public url ke database via DataLayer
      try {
        await dataLayer.updateProfile(profile.id, { avatar_url: url });
      } catch (dbErr) {
        console.warn('DB avatar update note:', dbErr);
      }
    }
    setIsUploadingAvatar(false);
  };

  // Cover Upload Handler with Real Storage & Max 2MB Check
  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLockedOrSuspended) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'File tidak valid.');
      return;
    }

    setIsUploadingCover(true);
    const { url, error } = await uploadAsset(file, 'covers');
    if (error || !url) {
      setUploadError(error || 'Gagal mengunggah cover banner.');
    } else {
      setCoverUrl(url);
      setProfile((prev) => ({ ...prev, cover_url: url }));

      // Simpan public url ke database via DataLayer
      try {
        await dataLayer.updateProfile(profile.id, { cover_url: url });
      } catch (dbErr) {
        console.warn('DB cover update note:', dbErr);
      }
    }
    setIsUploadingCover(false);
  };

  // Save Pricing Changes (Form Tarif Mandiri Pelajar)
  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOrSuspended) return;
    setIsSavingPricing(true);
    setUploadError(null);

    const updatedData = {
      base_price: Number(basePrice) || 20000,
      dp_percentage: Math.min(100, Math.max(10, Number(dpPercentage) || 30)),
      extra_revision_fee: Number(extraRevisionFee) || 3000,
      rush_fee: Number(rushFee) || 10000,
      source_file_price: Number(sourceFilePrice) || 5000,
    };

    setProfile((prev) => ({
      ...prev,
      ...updatedData,
    }));

    try {
      await dataLayer.updateProfile(profile.id, updatedData);
      setPricingSaveSuccess(true);
      setTimeout(() => setPricingSaveSuccess(false), 3000);
    } catch (err: any) {
      console.warn('Update pricing error:', err);
    } finally {
      setIsSavingPricing(false);
    }
  };

  // Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOrSuspended) return;
    setIsSavingProfile(true);
    setUploadError(null);

    const deliverablesArray = deliverablesInput.split(',').map((d) => d.trim()).filter(Boolean);

    const updatePayload = {
      bio,
      whatsapp_number: whatsapp,
      avatar_url: avatarUrl,
      cover_url: coverUrl,
      tools: selectedTools,
      turnaround_time: turnaroundTime,
      deliverables: deliverablesArray,
      free_revisions: Number(freeRevisions),
      revision_notes: revisionNotes,
      is_working: isWorking,
      is_available: isAvailable,
      availability_status: availabilityStatus,
    };

    setProfile((prev) => ({
      ...prev,
      ...updatePayload,
    }));

    try {
      await dataLayer.updateProfile(profile.id, updatePayload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.warn('Update profile note:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Add Portfolio Item
  const handleAddPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOrSuspended) return;
    if (!newTitle.trim() || !newMediaUrl.trim()) return;

    const newItem: Portfolio = {
      id: `p-${Date.now()}`,
      profile_id: profile.id,
      title: newTitle.trim(),
      category: newCategory,
      media_url: newMediaUrl.trim(),
      media_type: newMediaType,
      description: newDescription.trim(),
      created_at: new Date().toISOString(),
    };

    setPortfolios((prev) => [newItem, ...prev]);

    try {
      await dataLayer.createPortfolio({
        profile_id: profile.id,
        title: newItem.title,
        category: newItem.category,
        media_url: newItem.media_url,
        media_type: newItem.media_type,
        description: newItem.description,
      });
    } catch (e) {
      console.warn('Insert portfolio note:', e);
    }

    setNewTitle('');
    setNewMediaUrl('');
    setNewDescription('');
    setIsAddingPortfolio(false);
  };

  const handleDeletePortfolio = async (id: string) => {
    if (isLockedOrSuspended) return;
    if (confirm('Hapus portofolio ini?')) {
      setPortfolios((prev) => prev.filter((p) => p.id !== id));
      try {
        await dataLayer.deletePortfolio(id);
      } catch (e) {
        console.warn('Delete portfolio note:', e);
      }
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400 mb-1">
            <User className="h-4 w-4" />
            <span>Member Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Selamat Datang, {profile.full_name}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Kelola ketersediaan kerja, tarif pelajar mandiri, tools mastery, dan portofolio karya.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/freelancers/${profile.id}`}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-200 hover:border-amber-400/50 hover:text-amber-400 transition-colors"
          >
            <span>Lihat Profil Publik</span>
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Keluar</span>
          </Link>
        </div>
      </div>

      {/* BANNER PERINGATAN MERAH: JIKA AKUN DISKORSING / DIKUNCI OLEH OWNER */}
      {isLockedOrSuspended && (
        <div className="rounded-2xl border-2 border-red-500/80 bg-red-950/40 p-4 sm:p-5 text-red-200 shadow-xl shadow-red-950/40 space-y-2.5">
          <div className="flex items-center gap-2.5 text-red-400 font-bold text-sm sm:text-base">
            <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse text-red-400" />
            <span>⚠️ PERINGATAN: Akun Anda Ditangguhkan Sementara.</span>
          </div>
          <div className="text-xs bg-red-900/30 border border-red-800/60 rounded-xl p-3 text-red-300">
            <strong className="text-red-200">Alasan:</strong> {profile.suspension_reason || 'Tindakan disiplin & evaluasi kepatuhan deadline internal.'}
          </div>
          {profile.forced_price !== null && profile.forced_price !== undefined && (
            <div className="text-xs text-amber-300 bg-amber-950/40 border border-amber-800/50 rounded-xl p-2.5">
              <strong>Pemberitahuan Override Tarif:</strong> Owner telah menetapkan tarif khusus Anda menjadi {formatRupiah(profile.forced_price)} {profile.forced_price === 0 ? '(Proyek Kompensasi Gratis)' : ''}.
            </div>
          )}
          <p className="text-xs text-zinc-300 pt-1">
            Hubungi Owner agensi untuk membuka kembali akses. Seluruh formulir saat ini dalam mode <strong>Read-Only (Terkunci)</strong>.
          </p>
        </div>
      )}

      {uploadError && (
        <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-xs text-red-400 font-medium flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* NAVIGASI TAB DASHBOARD (HORIZONTAL SCROLL ON MOBILE) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 border-b border-zinc-800">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'orders'
              ? 'bg-amber-500 text-zinc-950 font-bold shadow-gold-glow'
              : 'border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-700'
          }`}
        >
          <Layers className="h-4 w-4 shrink-0" />
          <span>Pesanan Masuk & Progres</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              activeTab === 'orders'
                ? 'bg-zinc-950 text-amber-400'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {bookings.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-amber-500 text-zinc-950 font-bold shadow-gold-glow'
              : 'border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-700'
          }`}
        >
          <User className="h-4 w-4 shrink-0" />
          <span>Profil & Tarif Pelajar</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('portfolio')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'portfolio'
              ? 'bg-amber-500 text-zinc-950 font-bold shadow-gold-glow'
              : 'border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-700'
          }`}
        >
          <Briefcase className="h-4 w-4 shrink-0" />
          <span>Portofolio Karya</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              activeTab === 'portfolio'
                ? 'bg-zinc-950 text-amber-400'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {portfolios.length}
          </span>
        </button>
      </div>

      {/* TAB 1: PESANAN MASUK & PROGRES PENGERJAAN */}
      {activeTab === 'orders' && (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 sm:p-8 backdrop-blur-md space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                <Layers className="w-4 h-4" />
                <span>Antrean Pesanan Masuk</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
                Daftar Pesanan & Progres Pengerjaan
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Pantau pesanan aktif Anda dan perbarui tahapan pengerjaan secara real-time. Seluruh koordinasi disaring satu pintu melalui Owner.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-xl font-bold">
                {bookings.length} Total Tiket
              </span>
            </div>
          </div>

          {/* TAMPILAN MOBILE: KARTU PESANAN MEMBER ULTRA-SLIM (< 768px) */}
          <div className="block md:hidden space-y-3">
            {bookings.length === 0 ? (
              <div className="text-center py-10 text-xs text-zinc-500 bg-zinc-950/50 rounded-xl border border-zinc-800">
                Belum ada tiket pesanan yang ditugaskan ke Anda.
              </div>
            ) : (
              bookings.map((b) => {
                const step = b.step_progress || (b.status === 'completed' ? 5 : b.status === 'in_review' ? 3 : b.status === 'in_progress' ? 2 : 1);
                const talentShare = b.talent_fee ?? Math.round((b.estimated_total || 0) * 0.75);

                return (
                  <div
                    key={b.id}
                    className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-2 overflow-hidden"
                  >
                    {/* Baris 1: Nomor tiket di kiri, badge status tahap di kanan */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {b.ticket_code}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        step === 5
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : step === 4
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : step === 3
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : step === 2
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {step === 5
                          ? 'Tahap 5: Selesai'
                          : step === 4
                          ? 'Tahap 4: Pelunasan 70%'
                          : step === 3
                          ? 'Tahap 3: Review Draf'
                          : step === 2
                          ? 'Tahap 2: Draf Desain'
                          : 'Tahap 1: DP Masuk'}
                      </span>
                    </div>

                    {/* Baris 2: Nama klien tebal + Target Deadline sejajar. Brief dibuat ringkas maksimal 2 baris */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs gap-2">
                        <strong className="text-white font-bold truncate">{b.client_name}</strong>
                        <div className="flex items-center gap-1 text-[11px] text-zinc-400 shrink-0">
                          <Calendar className="w-3 h-3 text-zinc-500" />
                          <span>Target: {b.deadline_date}</span>
                        </div>
                      </div>
                      <div className="line-clamp-2 text-[11px] text-zinc-300 bg-zinc-950/60 p-1.5 rounded border border-zinc-800/40">
                        <span className="text-zinc-500 font-semibold">Brief: </span>
                        {b.project_brief}
                      </div>
                    </div>

                    {/* Baris 3: Footer Kartu Sejajar - Hak Talent (75%) & Tombol Aksi */}
                    <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60 gap-2">
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Hak Talent (75%)</span>
                        <span className="text-xs font-bold text-emerald-400">
                          {formatRupiah(talentShare)}
                        </span>
                      </div>

                      {/* Tombol Aksi Ringkas */}
                      {step === 1 && (
                        <button
                          type="button"
                          onClick={() => handleMemberUpdateStep(b.id, 2)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black shrink-0 transition-colors"
                        >
                          Mulai Draf →
                        </button>
                      )}
                      {step === 2 && (
                        <button
                          type="button"
                          onClick={() => handleMemberUpdateStep(b.id, 3)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-400 text-white shrink-0 transition-colors"
                        >
                          Kirim Revisi →
                        </button>
                      )}
                      {step === 3 && (
                        <span className="text-xs italic text-blue-400 font-medium shrink-0">
                          Verifikasi Owner
                        </span>
                      )}
                      {step === 4 && (
                        <button
                          type="button"
                          onClick={() => handleMemberUpdateStep(b.id, 5)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black shrink-0 transition-colors"
                        >
                          Selesaikan →
                        </button>
                      )}
                      {step === 5 && (
                        <span className="text-xs font-bold text-emerald-400 inline-flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* TAMPILAN DESKTOP: TABEL STANDAR RAPI DENGAN PROPORSI PRESISI (>= 768px) */}
          <div className="hidden md:block w-full overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/80 shadow-xl">
            <table className="w-full text-left text-xs text-zinc-300 border-collapse table-fixed">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/50">
                  <th className="w-[15%] py-3 px-3.5 font-mono text-xs whitespace-nowrap uppercase text-[11px] text-zinc-400 font-semibold tracking-wider">
                    No. Tiket
                  </th>
                  <th className="w-[27%] py-3 px-3.5 whitespace-nowrap uppercase text-[11px] text-zinc-400 font-semibold tracking-wider">
                    Klien & Brief
                  </th>
                  <th className="w-[15%] py-3 px-3.5 whitespace-nowrap uppercase text-[11px] text-zinc-400 font-semibold tracking-wider">
                    Target Deadline
                  </th>
                  <th className="w-[18%] py-3 px-3.5 whitespace-nowrap uppercase text-[11px] text-zinc-400 font-semibold tracking-wider">
                    Hak Talent (75%)
                  </th>
                  <th className="w-[25%] py-3 px-3.5 text-right pr-4 whitespace-nowrap uppercase text-[11px] text-zinc-400 font-semibold tracking-wider">
                    Aksi Progres
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {bookings.map((b) => {
                  const step = b.step_progress || (b.status === 'completed' ? 5 : b.status === 'in_review' ? 3 : b.status === 'in_progress' ? 2 : 1);
                  const talentShare = b.talent_fee ?? Math.round((b.estimated_total || 0) * 0.75);

                  return (
                    <tr key={b.id} className="hover:bg-zinc-800/30 transition-colors">
                      {/* No. Tiket: w-[15%] font-mono text-xs whitespace-nowrap */}
                      <td className="w-[15%] py-3 px-3.5 font-mono text-xs whitespace-nowrap font-bold text-amber-400">
                        {b.ticket_code}
                      </td>

                      {/* Klien & Brief: w-[27%] (Tanpa no WA & tanpa Chat WA) */}
                      <td className="w-[27%] py-3 px-3.5">
                        <div>
                          <strong className="text-white block font-bold truncate">{b.client_name}</strong>
                          <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5" title={b.project_brief}>
                            {b.project_brief}
                          </p>
                        </div>
                      </td>

                      {/* Target Deadline: w-[15%] whitespace-nowrap */}
                      <td className="w-[15%] py-3 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-zinc-300">
                          <Calendar className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                          <span>{b.deadline_date}</span>
                        </div>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          step === 5
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : step === 4
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : step === 3
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : step === 2
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {step === 5
                            ? 'Tahap 5: Selesai'
                            : step === 4
                            ? 'Tahap 4: Pelunasan'
                            : step === 3
                            ? 'Tahap 3: Review Draf'
                            : step === 2
                            ? 'Tahap 2: Draf Desain'
                            : 'Tahap 1: DP Masuk'}
                        </span>
                      </td>

                      {/* Hak Talent: w-[18%] whitespace-nowrap */}
                      <td className="w-[18%] py-3 px-3.5 whitespace-nowrap">
                        <div>
                          <span className="font-bold text-emerald-400 block text-xs">{formatRupiah(talentShare)}</span>
                          <span className="text-[10px] text-zinc-400">
                            Total: {formatRupiah(b.estimated_total)}
                          </span>
                        </div>
                      </td>

                      {/* Aksi Progres: w-[25%] text-right pr-4 */}
                      <td className="w-[25%] py-3 px-3.5 text-right pr-4">
                        <div className="flex items-center justify-end">
                          {step === 1 && (
                            <button
                              type="button"
                              onClick={() => handleMemberUpdateStep(b.id, 2)}
                              className="shrink-0 px-3 py-1.5 text-xs whitespace-nowrap font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-black transition shadow-sm"
                            >
                              Mulai Draf →
                            </button>
                          )}
                          {step === 2 && (
                            <button
                              type="button"
                              onClick={() => handleMemberUpdateStep(b.id, 3)}
                              className="shrink-0 px-3 py-1.5 text-xs whitespace-nowrap font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition shadow-sm"
                            >
                              Kirim Revisi →
                            </button>
                          )}
                          {step === 3 && (
                            <span className="text-xs text-blue-400 font-medium whitespace-nowrap italic">
                              Verifikasi Owner
                            </span>
                          )}
                          {step === 4 && (
                            <button
                              type="button"
                              onClick={() => handleMemberUpdateStep(b.id, 5)}
                              className="shrink-0 px-3 py-1.5 text-xs whitespace-nowrap font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black transition shadow-sm"
                            >
                              Selesaikan →
                            </button>
                          )}
                          {step === 5 && (
                            <span className="text-emerald-400 font-bold text-xs inline-flex items-center gap-1 whitespace-nowrap">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                            </span>
                          )}
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

      {/* TAB 2: PROFIL & TARIF PELAJAR */}
      {activeTab === 'profile' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Availability Status: 3 Segmented Pill Buttons */}
        <div className="lg:col-span-5 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 sm:p-6 backdrop-blur-md space-y-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Mode Ketersediaan Pelajar
            </span>
            <h3 className="text-sm font-bold text-white mt-0.5">
              Pilihan Ketersediaan Talent
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Pilih ketersediaan kerja Anda. Status langsung tersinkronisasi ke katalog profil publik.
            </p>
          </div>

          {/* 3 Segmented Pill Buttons */}
          <div className="grid grid-cols-1 gap-2 p-1.5 bg-zinc-950/90 border border-zinc-800 rounded-2xl">
            {/* 1. Siap Terima Order */}
            <button
              type="button"
              disabled={isLockedOrSuspended}
              onClick={() => handleSetAvailabilityStatus('available')}
              className={`flex items-center justify-between py-2.5 px-3.5 rounded-xl text-xs font-bold transition-all ${
                availabilityStatus === 'available'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 border border-emerald-400'
                  : 'bg-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80 border border-transparent'
              } disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${availabilityStatus === 'available' ? 'bg-white' : 'bg-emerald-500'}`} />
                <span>🟢 Siap Terima Order</span>
              </div>
              {availabilityStatus === 'available' && (
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md text-white font-semibold">Aktif</span>
              )}
            </button>

            {/* 2. Sedang Ada Job */}
            <button
              type="button"
              disabled={isLockedOrSuspended}
              onClick={() => handleSetAvailabilityStatus('busy')}
              className={`flex items-center justify-between py-2.5 px-3.5 rounded-xl text-xs font-bold transition-all ${
                availabilityStatus === 'busy'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/50 border border-blue-400'
                  : 'bg-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80 border border-transparent'
              } disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${availabilityStatus === 'busy' ? 'bg-white' : 'bg-blue-500'}`} />
                <span>🔵 Sedang Ada Job</span>
              </div>
              {availabilityStatus === 'busy' && (
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md text-white font-semibold">Aktif</span>
              )}
            </button>

            {/* 3. Rehat / Pekan Ujian */}
            <button
              type="button"
              disabled={isLockedOrSuspended}
              onClick={() => handleSetAvailabilityStatus('resting')}
              className={`flex items-center justify-between py-2.5 px-3.5 rounded-xl text-xs font-bold transition-all ${
                availabilityStatus === 'resting'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-950/50 border border-amber-400'
                  : 'bg-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80 border border-transparent'
              } disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${availabilityStatus === 'resting' ? 'bg-white' : 'bg-amber-500'}`} />
                <span>🟡 Rehat / Pekan Ujian</span>
              </div>
              {availabilityStatus === 'resting' && (
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md text-white font-semibold">Aktif</span>
              )}
            </button>
          </div>

          {/* Info Status Card */}
          <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/80 text-xs">
            {availabilityStatus === 'available' && (
              <div className="space-y-1">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  Status: Siap Terima Order
                </div>
                <p className="text-[11px] text-zinc-400">
                  Tombol Hire di profil publik menyala aktif. Klien dapat langsung memesan layanan Anda.
                </p>
              </div>
            )}
            {availabilityStatus === 'busy' && (
              <div className="space-y-1">
                <div className="font-bold text-blue-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
                  Status: Ada Job Aktif
                </div>
                <p className="text-[11px] text-zinc-400">
                  Indikator antrean sedang berjalan. Klien tetap dapat booking dengan pemberitahuan slot sedang padat.
                </p>
              </div>
            )}
            {availabilityStatus === 'resting' && (
              <div className="space-y-1">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                  Status: Sedang Ujian / Rehat
                </div>
                <p className="text-[11px] text-zinc-400">
                  Badge ujian aktif di profil publik. Tombol Hire dinonaktifkan sementara agar Anda fokus istirahat/ujian.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Form Tarif Mandiri Pelajar (Replacing Read-Only Box) */}
        <div className="lg:col-span-7 rounded-3xl border border-amber-500/40 bg-zinc-900/90 p-5 sm:p-6 backdrop-blur-md shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400">
              <Sparkles className="h-4 w-4" />
              <span>Form Tarif Mandiri Pelajar</span>
            </div>
            <span className="text-[11px] text-zinc-400">Atur harga sesuai kapasitas Anda</span>
          </div>

          {pricingSaveSuccess && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-400 flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span>Perubahan tarif mandiri berhasil disimpan ke database!</span>
            </div>
          )}

          <form onSubmit={handleSavePricing} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Base Price */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Tarif Mulai Dari (base_price IDR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="20.000"
                    disabled={isLockedOrSuspended}
                    value={basePriceInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      const num = parseRupiah(val);
                      setBasePrice(num);
                      setBasePriceInput(formatRupiah(num));
                    }}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 text-xs font-bold text-amber-400 focus:border-amber-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Default standar pelajar: Rp 20.000</p>
              </div>

              {/* DP Percentage */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Persentase DP (10% - 100%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    max="100"
                    disabled={isLockedOrSuspended}
                    value={dpPercentage}
                    onChange={(e) => setDpPercentage(Number(e.target.value))}
                    className="w-full pl-4 pr-9 py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 text-xs font-bold text-white focus:border-amber-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">%</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Uang muka awal sebelum pengerjaan</p>
              </div>

              {/* Rush Fee */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Biaya Order Kilat (rush_fee IDR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="10.000"
                    disabled={isLockedOrSuspended}
                    value={rushFeeInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      const num = parseRupiah(val);
                      setRushFee(num);
                      setRushFeeInput(formatRupiah(num));
                    }}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 text-xs text-white focus:border-amber-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Tambahan deadline kilat (default Rp 10.000)</p>
              </div>

              {/* Source File Price */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Biaya File Mentahan (source_file IDR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="5.000"
                    disabled={isLockedOrSuspended}
                    value={sourceFilePriceInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      const num = parseRupiah(val);
                      setSourceFilePrice(num);
                      setSourceFilePriceInput(formatRupiah(num));
                    }}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 text-xs text-white focus:border-amber-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">File mentah Canva/PPTX (default Rp 5.000)</p>
              </div>

              {/* Extra Revision Fee */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Biaya Tambahan Per Revisi (extra_revision_fee IDR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="3.000"
                    disabled={isLockedOrSuspended}
                    value={extraRevisionFeeInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      const num = parseRupiah(val);
                      setExtraRevisionFee(num);
                      setExtraRevisionFeeInput(formatRupiah(num));
                    }}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 text-xs text-white focus:border-amber-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Dikenakan setelah jatah revisi gratis habis (default Rp 3.000)</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingPricing || isLockedOrSuspended}
                className="flex items-center gap-2 rounded-xl bg-amber-500 py-2.5 px-5 text-xs font-bold text-zinc-950 shadow-gold-glow hover:bg-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingPricing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menyimpan Tarif...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Simpan Perubahan Tarif</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 2. FORM PROFIL & SOFTWARE MASTERY PELAJAR */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 sm:p-8 backdrop-blur-md shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-5">Pembaruan Profil, Banner, & Software Mastery</h3>

        {saveSuccess && (
          <div className="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-xs font-bold text-emerald-400 flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>Seluruh perubahan profil dan software mastery berhasil disimpan!</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Avatar & Cover Banner Upload Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
            {/* Avatar Photo */}
            <div className="sm:col-span-4 space-y-3">
              <label className="block text-xs font-semibold text-zinc-300">
                Foto Profil (Potret 4:5, maks 2 MB)
              </label>
              <div className="relative h-48 w-36 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-700 shadow-md">
                <img
                  src={avatarUrl}
                  alt={profile.full_name}
                  className="h-full w-full object-cover object-top"
                />
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-amber-400 animate-spin" />
                  </div>
                )}
              </div>
              <label className={`inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-2.5 text-xs font-medium text-zinc-200 transition-colors ${
                isLockedOrSuspended ? 'opacity-50 cursor-not-allowed' : 'hover:border-amber-400 hover:text-amber-400 cursor-pointer'
              }`}>
                <Upload className="h-3.5 w-3.5" />
                <span>Upload Foto Profil</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={isLockedOrSuspended}
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Cover Banner */}
            <div className="sm:col-span-8 space-y-3">
              <label className="block text-xs font-semibold text-zinc-300">
                Custom Banner Showcase Header (maks 2 MB)
              </label>
              <div className="relative h-36 w-full rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-700 shadow-md">
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt="Cover Banner"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center text-xs text-zinc-500">
                    Belum ada cover banner
                  </div>
                )}
                {isUploadingCover && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-amber-400 animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <label className={`inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-2.5 text-xs font-medium text-zinc-200 transition-colors ${
                  isLockedOrSuspended ? 'opacity-50 cursor-not-allowed' : 'hover:border-amber-400 hover:text-amber-400 cursor-pointer'
                }`}>
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>Upload Cover Image</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={isLockedOrSuspended}
                    onChange={handleCoverFileChange}
                    className="hidden"
                  />
                </label>

                <input
                  type="url"
                  placeholder="Atau masukkan URL Cover Image..."
                  disabled={isLockedOrSuspended}
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Software & Tools Mastery: Interactive Pelajar Badges */}
          <div className="pt-4 border-t border-zinc-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Dukungan Software & Tools Pelajar (Klik untuk Memilih)
                </label>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Pilih aplikasi HP & PC yang Anda kuasai untuk ditampilkan di profil publik Anda.
                </p>
              </div>
              <span className="whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30">
                {selectedTools.length} dipilih
              </span>
            </div>

            {/* Presets Badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              {STUDENT_TOOLS_PRESET.map((tool) => {
                const isSelected = selectedTools.includes(tool);
                return (
                  <button
                    type="button"
                    key={tool}
                    disabled={isLockedOrSuspended}
                    onClick={() => toggleTool(tool)}
                    className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 text-amber-400" />}
                    <span>{tool}</span>
                  </button>
                );
              })}
            </div>

            {/* Add custom tool */}
            <div className="flex items-center gap-2 pt-2 max-w-md">
              <input
                type="text"
                placeholder="Tambah aplikasi lain..."
                disabled={isLockedOrSuspended}
                value={customToolInput}
                onChange={(e) => setCustomToolInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTool();
                  }
                }}
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                disabled={isLockedOrSuspended}
                onClick={handleAddCustomTool}
                className="rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:border-amber-400 hover:text-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tambah
              </button>
            </div>
          </div>

          {/* Bio & Internal WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Biografi Singkat / Deskripsi Keahlian
              </label>
              <textarea
                rows={4}
                required
                disabled={isLockedOrSuspended}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nomor WhatsApp Member (Internal Agensi)
                </label>
                <input
                  type="text"
                  required
                  placeholder="628123456789"
                  disabled={isLockedOrSuspended}
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-xs text-white focus:border-amber-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="mt-1 text-[11px] text-zinc-500">
                  Untuk koordinasi order dari Admin Agensi, tidak dipublikasikan ke umum.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Estimasi Durasi Pengerjaan
                </label>
                <input
                  type="text"
                  placeholder="2-3 Hari Kerja"
                  disabled={isLockedOrSuspended}
                  value={turnaroundTime}
                  onChange={(e) => setTurnaroundTime(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-xs text-white focus:border-amber-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Deliverables & Revision Rules */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-800">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Format Deliverables File Akhir (Pisahkan dengan koma)
              </label>
              <input
                type="text"
                placeholder="Editable PPTX, High-Res PDF, Gambar PNG Tiap Slide"
                disabled={isLockedOrSuspended}
                value={deliverablesInput}
                onChange={(e) => setDeliverablesInput(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-xs text-white focus:border-amber-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Jatah Revisi Minor Gratis
              </label>
              <input
                type="number"
                min="0"
                disabled={isLockedOrSuspended}
                value={freeRevisions}
                onChange={(e) => setFreeRevisions(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-xs text-white focus:border-amber-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="submit"
              disabled={isSavingProfile || isLockedOrSuspended}
              className="flex items-center gap-2 rounded-xl bg-amber-500 py-2.5 px-6 text-xs font-bold text-zinc-950 shadow-gold-glow hover:bg-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSavingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Simpan Perubahan Profil</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
        </div>
      )}

      {/* 3. MANAJEMEN PORTOFOLIO KARYA */}
      {activeTab === 'portfolio' && (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 sm:p-8 backdrop-blur-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Koleksi Portofolio Karya</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Sampel tugas/desain yang pernah Anda kerjakan untuk meyakinkan calon klien.
            </p>
          </div>
          <button
            type="button"
            disabled={isLockedOrSuspended}
            onClick={() => setIsAddingPortfolio(!isAddingPortfolio)}
            className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-zinc-950 shadow-gold-glow hover:bg-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Portofolio Baru</span>
          </button>
        </div>

        {/* Form Tambah Portofolio */}
        {isAddingPortfolio && (
          <form onSubmit={handleAddPortfolio} className="p-5 rounded-2xl border border-zinc-700 bg-zinc-950 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Formulir Sampel Proyek Baru
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Judul Proyek</label>
                <input
                  type="text"
                  required
                  disabled={isLockedOrSuspended}
                  placeholder="Contoh: Slide Presentasi Bisnis Plan SMA"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Kategori</label>
                <select
                  value={newCategory}
                  disabled={isLockedOrSuspended}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="PPT Specialist">PPT Specialist</option>
                  <option value="Video Editor">Video Editor</option>
                  <option value="Fotografi">Fotografi / Edit Foto</option>
                  <option value="UI Designer">UI / Poster Desain</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">URL Gambar / Video Thumbnail</label>
                <input
                  type="url"
                  required
                  disabled={isLockedOrSuspended}
                  placeholder="https://images.unsplash.com/..."
                  value={newMediaUrl}
                  onChange={(e) => setNewMediaUrl(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Deskripsi Singkat Proyek</label>
                <textarea
                  rows={2}
                  disabled={isLockedOrSuspended}
                  placeholder="Rincian jumlah slide atau software yang digunakan..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingPortfolio(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLockedOrSuspended}
                className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-zinc-950 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tambahkan
              </button>
            </div>
          </form>
        )}

        {/* Grid List Portofolio */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolios.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden flex flex-col justify-between"
            >
              <div className="relative h-40 w-full overflow-hidden bg-zinc-900">
                <img
                  src={item.media_url}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
                <span className="absolute top-2.5 left-2.5 rounded-lg bg-zinc-950/80 px-2.5 py-1 text-[10px] font-bold text-amber-400 backdrop-blur-md">
                  {item.category}
                </span>
              </div>
              <div className="p-4 space-y-2">
                <h4 className="text-xs font-bold text-white line-clamp-1">{item.title}</h4>
                {item.description && (
                  <p className="text-[11px] text-zinc-400 line-clamp-2">{item.description}</p>
                )}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={isLockedOrSuspended}
                    onClick={() => handleDeletePortfolio(item.id)}
                    className="rounded-lg p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title={isLockedOrSuspended ? 'Akun terkunci' : 'Hapus portofolio'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}
