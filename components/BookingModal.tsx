'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Zap,
  FileCode,
  ShieldCheck,
  CheckCircle,
  Loader2,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react';
import { Profile, Booking } from '@/lib/types';
import { createBooking } from '@/app/actions/create-booking';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  onBookingSuccess?: (booking: Booking) => void;
}

export default function BookingModal({
  isOpen,
  onClose,
  profile,
  onBookingSuccess,
}: BookingModalProps) {
  const [clientName, setClientName] = useState('');
  const [clientWhatsapp, setClientWhatsapp] = useState('');
  
  // Default deadline 4 days from today
  const defaultDeadline = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d.toISOString().split('T')[0];
  }, []);

  const [deadlineDate, setDeadlineDate] = useState(defaultDeadline);
  const [projectBrief, setProjectBrief] = useState('');
  const [isRushOrder, setIsRushOrder] = useState(false);
  const [includeSourceFile, setIncludeSourceFile] = useState(false);
  const [includeExtraRevision, setIncludeExtraRevision] = useState(false);
  const [botTrap, setBotTrap] = useState(''); // Honeypot field
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [copiedTicket, setCopiedTicket] = useState(false);
  const [copiedDp, setCopiedDp] = useState(false);

  // Helper hitung selisih hari deadline dengan hari ini
  const diffDays = useMemo(() => {
    if (!deadlineDate) return 5;
    const target = new Date(deadlineDate);
    const today = new Date();
    target.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [deadlineDate]);

  // Deteksi deadline mepet (H-1 / H-2 / Hari H)
  const isAutoRush = diffDays <= 2;

  // Otomatis aktifkan Rush Order jika deadline <= 2 hari
  useEffect(() => {
    if (isAutoRush) {
      setIsRushOrder(true);
    }
  }, [isAutoRush]);

  if (!isOpen) return null;

  // Kalkulasi Biaya Realtime (Pelajar-Friendly)
  const basePrice = Number(profile.base_price ?? 20000);
  const rushFeeAmount = Number(profile.rush_fee) > 0 ? Number(profile.rush_fee) : Math.round(basePrice * 0.3);
  const sourceFileFeeAmount = Number(profile.source_file_price) > 0 ? Number(profile.source_file_price) : 15000;
  const extraRevisionFeeAmount = Number(profile.extra_revision_fee) > 0 ? Number(profile.extra_revision_fee) * 2 : 10000;

  const activeRushFee = isRushOrder ? rushFeeAmount : 0;
  const activeSourceFileFee = includeSourceFile ? sourceFileFeeAmount : 0;
  const activeExtraRevisionFee = includeExtraRevision ? extraRevisionFeeAmount : 0;
  const estimatedTotal = basePrice + activeRushFee + activeSourceFileFee + activeExtraRevisionFee;
  const dpPercentage = Number(profile.dp_percentage ?? 30);
  const dpAmount = Math.round((estimatedTotal * dpPercentage) / 100);
  const remainingAmount = estimatedTotal - dpAmount;

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);

  // Format Pesan WhatsApp Terstruktur sesuai Standar Creative Hub
  const generateStructuredWhatsAppMessage = (b: Booking) => {
    const addonsList: string[] = [];
    if (b.is_rush_order) addonsList.push('Pengerjaan Kilat (Rush Order)');
    if (b.include_source_file) addonsList.push('Master / Source File');
    if (b.include_extra_revision) addonsList.push('Ekstra Revisi');
    const addonsFormatted = addonsList.length > 0 ? addonsList.join(', ') : 'Tidak ada';

    const formatNumber = (num: number) => Number(num || 0).toLocaleString('id-ID');
    const total = b.estimated_total || estimatedTotal;
    const dpPercent = profile.dp_percentage ?? 30;
    const dp = b.dp_amount || Math.round((total * dpPercent) / 100);
    const sisa = total - dp;

    return `Halo Admin CREATIVE HUB, saya ingin konfirmasi pemesanan jasa! 🚀

📋 *RINCIAN TIKET & KLIEN:*
• No. Tiket: ${b.ticket_code}
• Nama Klien: ${b.client_name}
• No. WhatsApp: ${b.client_whatsapp}
• Talent Pilihan: ${b.talent_name}

🎯 *DETAIL PROYEK & KEBUTUHAN:*
• Deskripsi Singkat: ${b.project_brief}
• Target Deadline: ${b.deadline_date}
• Layanan Tambahan: ${addonsFormatted}

💰 *RINCIAN PEMBAYARAN:*
• Total Biaya: Rp ${formatNumber(total)}
• DP Wajib (${dpPercent}%): Rp ${formatNumber(dp)}
• Sisa Pelunasan: Rp ${formatNumber(sisa)}

Mohon verifikasi ketersediaan dan kirimkan rekening pembayaran DP. Terima kasih!`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Honeypot check: jika terisi bot, gagalkan secara diam-diam
    if (botTrap.trim() !== '') {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        onClose();
      }, 800);
      return;
    }

    if (!clientName.trim() || !clientWhatsapp.trim() || !projectBrief.trim()) {
      setError('Mohon lengkapi seluruh field identitas dan rincian brief tugas.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. WAJIB Tunggu Insert Supabase Selesai via Server Action
      const res = await createBooking({
        profileId: profile.id,
        talentName: profile.full_name,
        clientName,
        clientWhatsapp,
        deadlineDate,
        projectBrief,
        includeSourceFile,
        isRushOrder,
        includeExtraRevision,
        estimatedTotal,
        dpAmount,
      });

      // 2. Jika proses insert gagal (error != null), hentikan proses, tampilkan alert error, JANGAN buka WhatsApp
      if (!res.success || !res.booking || res.error) {
        const errorMsg = res.error || 'Terjadi kendala saat memproses booking di database.';
        setError(errorMsg);
        alert(`Gagal membuat pesanan: ${errorMsg}`);
        return;
      }

      // 3. Hanya jika berhasil: simpan state dan buka WhatsApp
      setCreatedBooking(res.booking);
      if (onBookingSuccess) onBookingSuccess(res.booking);

      // Siapkan pesan WhatsApp terstruktur ke Admin Agensi
      const adminWhatsappNumber = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || '6285831041464';
      const waMessage = generateStructuredWhatsAppMessage(res.booking);
      const waUrl = `https://wa.me/${adminWhatsappNumber}?text=${encodeURIComponent(waMessage)}`;
      
      // Buka tab WhatsApp ke Admin Agensi
      window.open(waUrl, '_blank');
    } catch (err: any) {
      const errorMsg = err?.message || 'Gagal terhubung ke sistem booking.';
      setError(errorMsg);
      alert(`Gagal membuat pesanan: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTicket = async (ticketCode: string) => {
    try {
      await navigator.clipboard.writeText(ticketCode);
      setCopiedTicket(true);
      setTimeout(() => setCopiedTicket(false), 2000);
    } catch (e) {
      console.warn('Gagal menyalin kode tiket:', e);
    }
  };

  const handleDone = () => {
    setCreatedBooking(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window: Touch friendly & mobile optimized */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative z-10 my-4 w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900/95 p-4 sm:p-6 backdrop-blur-md shadow-xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">
                <Sparkles className="h-4 w-4" />
                <span>Form Booking Proyek</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white">
                Hire <span className="text-amber-400">{profile.full_name}</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Pengisian brief, add-on pelajar, dan reservasi slot pengerjaan.
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {createdBooking ? (
            /* Success State */
            <div className="py-6 text-center space-y-5">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <CheckCircle className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                {/* 1-Click Copy Ticket Code */}
                <div className="flex items-center justify-center gap-2">
                  <span className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-1.5 text-sm font-mono font-extrabold text-amber-400 tracking-wider">
                    {createdBooking.ticket_code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyTicket(createdBooking.ticket_code)}
                    className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:border-amber-400 hover:text-white transition-colors"
                    title="Salin Nomor Tiket"
                  >
                    {copiedTicket ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Tersalin! ✅</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-amber-400" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
                <h4 className="text-lg font-extrabold text-white pt-1">
                  Tiket Pesanan Berhasil Dibuat!
                </h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  Konfirmasi pesanan dengan mengklik tombol WhatsApp di bawah. Simpan kode tiket untuk cek progres atau ulasan nantinya.
                </p>
              </div>

              {/* Receipt Snapshot */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-left text-xs space-y-2 max-w-md mx-auto">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Talent:</span>
                  <strong className="text-white">{createdBooking.talent_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Klien:</span>
                  <strong className="text-white">{createdBooking.client_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Target Deadline:</span>
                  <strong className="text-white">{createdBooking.deadline_date}</strong>
                </div>
                <div className="flex justify-between pt-2 border-t border-zinc-800 text-amber-400 font-bold">
                  <span>Wajib DP ({dpPercentage}%):</span>
                  <span>{formatRupiah(createdBooking.dp_amount)}</span>
                </div>
              </div>

              {/* Action Buttons: WhatsApp Admin + Selesai */}
              {(() => {
                const adminWhatsappNumber = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || '6285831041464';
                const waMessage = generateStructuredWhatsAppMessage(createdBooking);
                const waLink = `https://wa.me/${adminWhatsappNumber}?text=${encodeURIComponent(waMessage)}`;

                return (
                  <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-3 text-xs font-bold text-zinc-950 transition-colors duration-200 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Lanjut ke WhatsApp Admin</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleDone}
                      className="rounded-xl border border-zinc-700 bg-zinc-800 px-5 py-3 text-xs font-bold text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors duration-200"
                    >
                      Selesai & Tutup
                    </button>
                  </div>
                );
              })()}
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit} className="mt-5 space-y-5">
              {/* Honeypot Bot Trap (Invisible to humans) */}
              <input
                type="text"
                name="b_trap"
                value={botTrap}
                onChange={(e) => setBotTrap(e.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              {error && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-400 font-medium">
                  {error}
                </div>
              )}

              {/* 1. Identitas Klien */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  1. Identitas Pemesan
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Nama Lengkap / Kelompok
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Budi Santoso (Kelompok 3)"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-3 px-4 text-xs text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Nomor WhatsApp Aktif
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="081234567890"
                      value={clientWhatsapp}
                      onChange={(e) => setClientWhatsapp(e.target.value)}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-3 px-4 text-xs text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Deadline Picker dengan Deteksi Kilat */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    2. Target Deadline Selesai
                  </h4>
                  <span className="text-[11px] text-zinc-400">
                    {diffDays <= 0 ? 'Hari ini' : `${diffDays} hari lagi`}
                  </span>
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-700 bg-zinc-950 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                {/* Badge Peringatan Deadline Kilat */}
                {isAutoRush && (
                  <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-3 flex items-start gap-2.5 text-xs text-amber-300">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">⚠️ Target deadline mepet (H-1/H-2)</p>
                      <p className="text-[11px] text-amber-400/90 mt-0.5">
                        Biaya kilat (+{formatRupiah(rushFeeAmount)}) otomatis diterapkan untuk prioritas antrean pengerjaan.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Project Brief */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  3. Rincian Kebutuhan & Brief Tugas
                </h4>
                <textarea
                  rows={3}
                  required
                  placeholder="Jelaskan jenis tugas/konten, jumlah slide/durasi video, tema warna, materi teks, atau link Google Drive asset..."
                  value={projectBrief}
                  onChange={(e) => setProjectBrief(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-3 px-4 text-xs text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* 4. Opsi Add-on Checklist */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  4. Layanan Tambahan (Add-ons)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Rush Order */}
                  <label
                    className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                      isRushOrder
                        ? 'border-amber-500/60 bg-amber-500/10'
                        : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
                    } ${isAutoRush ? 'opacity-95' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isRushOrder}
                      disabled={isAutoRush}
                      onChange={(e) => setIsRushOrder(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded accent-amber-400 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <Zap className="h-3.5 w-3.5 text-amber-400" />
                        <span>Layanan Kilat (Rush)</span>
                      </div>
                      <p className="text-[10px] text-zinc-400">
                        Prioritas antrean kilat (+{formatRupiah(rushFeeAmount)})
                      </p>
                      {isAutoRush && (
                        <span className="inline-block text-[9px] font-bold uppercase text-amber-400">
                          (Terkunci: Deadline mepet)
                        </span>
                      )}
                    </div>
                  </label>

                  {/* Source File */}
                  <label
                    className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                      includeSourceFile
                        ? 'border-amber-500/60 bg-amber-500/10'
                        : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={includeSourceFile}
                      onChange={(e) => setIncludeSourceFile(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded accent-amber-400 cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <FileCode className="h-3.5 w-3.5 text-amber-400" />
                        <span>File Mentah Editable</span>
                      </div>
                      <p className="text-[10px] text-zinc-400">
                        Master file (.PPTX/.FIG) (+{formatRupiah(sourceFileFeeAmount)})
                      </p>
                    </div>
                  </label>

                  {/* Extra Revisions */}
                  <label
                    className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors sm:col-span-2 ${
                      includeExtraRevision
                        ? 'border-amber-500/60 bg-amber-500/10'
                        : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={includeExtraRevision}
                      onChange={(e) => setIncludeExtraRevision(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded accent-amber-400 cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                        <span>Ekstra 2x Revisi Minor</span>
                      </div>
                      <p className="text-[10px] text-zinc-400">
                        Jaminan revisi minor ekstra (+{formatRupiah(extraRevisionFeeAmount)})
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* 5. Breakdown Kalkulasi Otomatis & Ketentuan Pelajar */}
              <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-zinc-950 to-zinc-950 p-4 sm:p-5 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-zinc-300">
                  <span>Harga Dasar Talent:</span>
                  <span>{formatRupiah(basePrice)}</span>
                </div>
                {isRushOrder && (
                  <div className="flex items-center justify-between text-xs text-amber-400">
                    <span>Kilat 24 Jam (+30%):</span>
                    <span>+{formatRupiah(rushFeeAmount)}</span>
                  </div>
                )}
                {includeSourceFile && (
                  <div className="flex items-center justify-between text-xs text-amber-400">
                    <span>Master File Mentah:</span>
                    <span>+{formatRupiah(sourceFileFeeAmount)}</span>
                  </div>
                )}
                {includeExtraRevision && (
                  <div className="flex items-center justify-between text-xs text-amber-400">
                    <span>Ekstra 2x Revisi:</span>
                    <span>+{formatRupiah(extraRevisionFeeAmount)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-sm font-bold text-white">
                  <span>Subtotal Proyek:</span>
                  <span className="text-amber-400 text-base">{formatRupiah(estimatedTotal)}</span>
                </div>

                <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between text-xs font-bold text-emerald-400">
                  <span>Wajib Bayar Sekarang (DP {dpPercentage}%):</span>
                  <span className="text-emerald-400 text-sm">{formatRupiah(dpAmount)}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Sisa Pelunasan Saat Selesai (70%):</span>
                  <span className="text-zinc-300 font-semibold">{formatRupiah(remainingAmount)}</span>
                </div>

                {/* Tombol Salin Cepat Nominal Transfer */}
                <div className="pt-2.5 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(dpAmount.toString());
                      setCopiedDp(true);
                      setTimeout(() => setCopiedDp(false), 2000);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors"
                  >
                    {copiedDp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedDp ? 'Nominal DP Tersalin! ✅' : `Salin Nominal DP (${formatRupiah(dpAmount)})`}</span>
                  </button>
                  <span className="text-[10px] text-zinc-500">Kirim bukti via WhatsApp</span>
                </div>

                {/* Brief Rules */}
                <div className="pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
                  <div className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                    <span>Ketentuan Pengerjaan & Revisi</span>
                  </div>
                  <p>• Termasuk <strong>{profile.free_revisions ?? 1}x revisi minor gratis</strong>. Tambahan revisi {formatRupiah(profile.extra_revision_fee ?? 3000)}/revisi.</p>
                  <p>• DP wajib ditransfer untuk mengamankan slot pengerjaan. Pelunasan diselesaikan sebelum penyerahan master file akhir.</p>
                </div>
              </div>

              {/* Action Buttons: Touch Friendly */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl py-3 px-4 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 px-5 text-xs font-bold text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:from-emerald-400 hover:to-emerald-500 transition-colors duration-200 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Memproses Tiket...</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4" />
                      <span>Buat Tiket & Kirim ke WA Admin</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
