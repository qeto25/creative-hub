'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Search,
  CheckCircle2,
  Clock,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Phone,
  Ticket,
  Calendar,
  User,
  Info
} from 'lucide-react';
import { Booking } from '@/lib/types';
import * as dataLayer from '@/lib/dataLayer';
import { formatRupiahDisplay } from '@/lib/utils/currency';

const STEPS = [
  {
    step: 1,
    title: 'DP 30% Terverifikasi',
    desc: 'Diverifikasi oleh Admin/Owner saat DP masuk',
    actor: 'Owner / Admin'
  },
  {
    step: 2,
    title: 'Pengerjaan Draft',
    desc: 'Dijalankan oleh Member/Talent kreatif',
    actor: 'Talent'
  },
  {
    step: 3,
    title: 'Review & Revisi',
    desc: 'Dijalankan oleh Member/Talent saat konsultasi revisi',
    actor: 'Talent & Klien'
  },
  {
    step: 4,
    title: 'Pelunasan 70%',
    desc: 'Diverifikasi oleh Admin/Owner saat transfer lunas',
    actor: 'Owner / Admin'
  },
  {
    step: 5,
    title: 'Proyek Selesai & File Diserahkan',
    desc: 'Ditutup oleh Member atau Owner',
    actor: 'Talent / Owner'
  },
];

function TrackContent() {
  const searchParams = useSearchParams();
  const initialTicket = searchParams.get('ticket') || '';

  const [ticketInput, setTicketInput] = useState(initialTicket);
  const [waLast4Input, setWaLast4Input] = useState('');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [searched, setSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Verifikasi Ganda: Kode Tiket + 4 Digit Terakhir WA Klien
  const performSearch = async (ticket: string, wa4: string) => {
    const cleanTicket = ticket.trim().toUpperCase();
    const cleanWa4 = wa4.replace(/\D/g, '');

    if (!cleanTicket) {
      setErrorMessage('Silakan masukkan Kode Tiket pesanan Anda.');
      return;
    }

    if (cleanWa4.length !== 4) {
      setErrorMessage('Silakan masukkan tepat 4 digit terakhir nomor WhatsApp yang digunakan saat memesan.');
      return;
    }

    setLoading(true);
    setSearched(true);
    setErrorMessage(null);

    try {
      // Ambil data tiket via unified Data Layer (otomatis pilih snapshot demo atau live Supabase)
      const candidate: Booking | null = await dataLayer.getBookingByTicket(cleanTicket);

      // Verifikasi Keamanan 4 Digit Terakhir WhatsApp Klien
      if (candidate) {
        const rawPhone = (candidate.client_whatsapp || '').replace(/\D/g, '');
        const targetLast4 = rawPhone.slice(-4);

        if (targetLast4 === cleanWa4) {
          setBooking(candidate);
          setErrorMessage(null);
        } else {
          // Gagal verifikasi ganda: tolak akses
          setBooking(null);
          setErrorMessage('Data pesanan tidak ditemukan. Periksa kembali kode tiket dan nomor WA Anda.');
        }
      } else {
        setBooking(null);
        setErrorMessage('Data pesanan tidak ditemukan. Periksa kembali kode tiket dan nomor WA Anda.');
      }
    } catch (err) {
      setBooking(null);
      setErrorMessage('Terjadi gangguan saat memverifikasi tiket. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(ticketInput, waLast4Input);
  };

  // Tentukan step aktif
  const currentStepNumber = booking?.step_progress || (
    booking?.status === 'completed'
      ? 5
      : booking?.status === 'in_review'
      ? 3
      : booking?.status === 'in_progress'
      ? 2
      : 1
  );

  const isCompleted = booking?.status === 'completed' || currentStepNumber >= 5;
  const adminWhatsapp = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || '6285831041464';

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
      {/* Header Tracker */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-300 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>SECURE PROJECT TRACKER</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Lacak Status Proyek Anda
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto">
          Pantau 5 tahapan progres pengerjaan karya, konfirmasi termin pembayaran, dan koordinasi langsung dengan talent agensi pelajar secara aman & transparan.
        </p>
      </div>

      {/* Form Input: Dual Verification (Kode Tiket + 4 Digit Terakhir WA) */}
      <div className="max-w-2xl mx-auto">
        <form
          onSubmit={handleSearchSubmit}
          className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-4"
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Verifikasi Ganda Keamanan Klien</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Input 1: Kode Tiket */}
            <div className="sm:col-span-7 relative">
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Kode Tiket Pesanan
              </label>
              <div className="relative flex items-center">
                <Ticket className="absolute left-3.5 h-4 w-4 text-zinc-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Contoh: #CH-2609-4821"
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 rounded-xl border border-zinc-700 bg-zinc-950 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/50 uppercase"
                />
              </div>
            </div>

            {/* Input 2: 4 Digit Terakhir Nomor WhatsApp */}
            <div className="sm:col-span-5 relative">
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                4 Digit Terakhir No. WA
              </label>
              <div className="relative flex items-center">
                <Phone className="absolute left-3.5 h-4 w-4 text-zinc-500 pointer-events-none" />
                <input
                  type="text"
                  maxLength={4}
                  placeholder="Contoh: 5432"
                  value={waLast4Input}
                  onChange={(e) => setWaLast4Input(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-10 pr-3 py-3 rounded-xl border border-zinc-700 bg-zinc-950 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/50 font-mono text-center tracking-widest"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !ticketInput.trim() || waLast4Input.length !== 4}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-xs sm:text-sm font-bold text-zinc-950 hover:from-amber-300 hover:to-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-gold-glow flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                <span>Memverifikasi Tiket & No. WhatsApp...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Lacak Progres Proyek</span>
              </>
            )}
          </button>

          {/* Panduan Format Tiket */}
          <div className="pt-3 border-t border-zinc-800/80 space-y-1.5 text-[11px] text-zinc-500">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-zinc-400 font-medium">Contoh format penulisan tiket:</span>
              <button
                type="button"
                onClick={() => {
                  setTicketInput('#CH-2609-4821');
                  setWaLast4Input('5432');
                  setErrorMessage(null);
                }}
                className="font-mono text-amber-400/90 hover:text-amber-300 hover:underline inline-flex items-center gap-1.5 bg-zinc-950 px-2 py-0.5 rounded-md border border-zinc-800"
                title="Klik untuk mengisi contoh format"
              >
                <span>#CH-2609-4821</span>
                <span className="text-zinc-500">•</span>
                <span>WA: 5432</span>
              </button>
            </div>
            <p className="text-[10px] text-zinc-500 italic">
              * Kode di atas hanya contoh format tiket. Masukkan kode tiket resmi yang tercantum pada konfirmasi pemesanan Anda.
            </p>
          </div>
        </form>
      </div>

      {/* Pesan Kesalahan Ramah jika data tidak cocok */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl mx-auto p-4 rounded-2xl border border-red-500/50 bg-red-950/30 text-center space-y-1.5 shadow-xl"
        >
          <div className="flex items-center justify-center gap-2 text-red-400 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Verifikasi Tidak Berhasil</span>
          </div>
          <p className="text-xs text-red-300">
            {errorMessage}
          </p>
        </motion.div>
      )}

      {/* Hasil Pelacakan Pesanan */}
      {searched && booking && !errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Ringkasan Tiket & Talent */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm sm:text-base font-extrabold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/30">
                    {booking.ticket_code}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    currentStepNumber === 5
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : currentStepNumber === 4
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : currentStepNumber === 3
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : currentStepNumber === 2
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {currentStepNumber === 5
                      ? '✅ Tahap 5: Proyek Selesai'
                      : currentStepNumber === 4
                      ? '💳 Tahap 4: Pelunasan 70%'
                      : currentStepNumber === 3
                      ? '🔍 Tahap 3: Review & Revisi'
                      : currentStepNumber === 2
                      ? '⚡ Tahap 2: Pengerjaan Draft'
                      : '⏳ Tahap 1: DP 30% Terverifikasi'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white pt-1">
                  Klien: {booking.client_name}
                </h2>
                <p className="text-xs text-zinc-400 line-clamp-1">
                  Brief: {booking.project_brief}
                </p>
              </div>

              <div className="text-left sm:text-right space-y-1">
                <span className="text-xs text-zinc-400">Dikerjakan oleh Talent:</span>
                <p className="text-base font-bold text-amber-400">{booking.talent_name}</p>
                <div className="flex items-center sm:justify-end gap-1.5 text-xs text-zinc-400">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span>
                    Target Selesai: <strong className="text-zinc-200">{booking.deadline_date}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* VISUAL STEPPER 5 TAHAP */}
            <div className="pt-8 pb-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Tahapan Pengerjaan Proyek (Tahap {currentStepNumber} dari 5)
                </h3>
                <span className="text-xs font-semibold text-amber-400">
                  {Math.round((currentStepNumber / 5) * 100)}% Selesai
                </span>
              </div>

              {/* Stepper Progress Bar Horizontal */}
              <div className="relative">
                <div className="hidden md:block absolute top-5 left-6 right-6 h-1 bg-zinc-800 -z-0">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 via-blue-400 to-emerald-400 transition-all duration-500"
                    style={{ width: `${((currentStepNumber - 1) / 4) * 100}%` }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative z-10">
                  {STEPS.map((item) => {
                    const isDone = item.step < currentStepNumber;
                    const isCurrent = item.step === currentStepNumber;

                    return (
                      <div
                        key={item.step}
                        className={`flex md:flex-col items-start md:items-center md:text-center gap-3 p-3.5 rounded-2xl border transition-all ${
                          isCurrent
                            ? 'bg-amber-500/10 border-amber-400/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/30'
                            : isDone
                            ? 'bg-zinc-950/70 border-emerald-500/30 text-zinc-300'
                            : 'bg-zinc-950/30 border-zinc-800/50 opacity-60'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                            isDone
                              ? 'bg-emerald-500 text-zinc-950 shadow-md'
                              : isCurrent
                              ? 'bg-amber-400 text-zinc-950 ring-4 ring-amber-400/20 font-extrabold animate-pulse'
                              : 'bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="w-5 h-5" /> : item.step}
                        </div>
                        <div className="space-y-0.5">
                          <p
                            className={`text-xs font-bold ${
                              isCurrent ? 'text-amber-300' : isDone ? 'text-white' : 'text-zinc-400'
                            }`}
                          >
                            {item.title}
                          </p>
                          <p className="text-[10px] text-zinc-400 leading-snug">
                            {item.desc}
                          </p>
                          <span className="inline-block text-[9px] uppercase tracking-wider text-zinc-500 font-semibold pt-0.5">
                            Otoritas: {item.actor}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* KETERANGAN KEAMANAN PENGIRIMAN FILE WHATSAPP (PENGGANTI KOTAK DOWNLOAD DRIVE) */}
              <div className="mt-6 rounded-2xl border border-zinc-800/90 bg-zinc-950/80 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Info className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    <strong className="text-amber-300">Catatan:</strong> Penyerahan draf preview dan master file final dilakukan langsung melalui WhatsApp talent demi keamanan & privasi.
                  </p>
                </div>

                <a
                  href={`https://wa.me/${adminWhatsapp}?text=${encodeURIComponent(`Halo Admin Creative Hub, saya ingin berkonsultasi mengenai status tiket pesanan ${booking.ticket_code}.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 text-xs font-bold transition-all shrink-0 whitespace-nowrap"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Hubungi Admin Hub</span>
                </a>
              </div>
            </div>
          </div>

          {/* Rincian Finansial & Pembayaran */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rincian Termin Biaya Pelajar */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <span>Rincian Pembayaran Bertahap</span>
              </h3>
              <div className="space-y-2.5 text-xs text-zinc-300">
                <div className="flex justify-between">
                  <span>Total Tagihan Proyek:</span>
                  <strong className="text-white text-sm">{formatRupiahDisplay(booking.estimated_total)}</strong>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Termin 1 (DP 30%):</span>
                  <strong>{formatRupiahDisplay(booking.dp_amount)} (Terverifikasi)</strong>
                </div>
                <div className="flex justify-between text-amber-400/90 pt-2 border-t border-zinc-800">
                  <span>Termin 2 (Pelunasan 70%):</span>
                  <strong className="text-sm">{formatRupiahDisplay(booking.estimated_total - booking.dp_amount)}</strong>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                <span>Status Pelunasan:</span>
                <span className={`px-2.5 py-0.5 rounded-full font-bold ${
                  currentStepNumber >= 4 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {currentStepNumber >= 4 ? 'LUNAS (100% Verified)' : 'MENUNGGU PELUNASAN (30% DP Paid)'}
                </span>
              </div>
            </div>

            {/* Rekap Item Pesanan & Add-ons */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
                Layanan & Opsi Tambahan
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-zinc-300">
                  <span>Pengerjaan Kilat 24 Jam:</span>
                  <span className={booking.is_rush_order ? 'text-amber-400 font-semibold' : 'text-zinc-500'}>
                    {booking.is_rush_order ? 'Ya (Aktif)' : 'Standar'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-300">
                  <span>Master File Mentah / PPT Editable:</span>
                  <span className={booking.include_source_file ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}>
                    {booking.include_source_file ? 'Ya (Disertakan)' : 'Hanya High-Res'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-300">
                  <span>Ekstra Revisi Minor:</span>
                  <span className={booking.include_extra_revision ? 'text-blue-400 font-semibold' : 'text-zinc-500'}>
                    {booking.include_extra_revision ? 'Ya (+2x Ekstra)' : '1x Free'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 text-[11px] text-zinc-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Seluruh pengerjaan dijamin oleh garansi kepatuhan brief Creative Hub.</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-zinc-400">Memuat Lacak Proyek...</p>
          </div>
        </div>
      }
    >
      <TrackContent />
    </Suspense>
  );
}
