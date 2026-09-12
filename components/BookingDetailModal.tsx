'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, User, MessageSquare, Check, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { Booking, BookingStatus } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

interface BookingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onStatusUpdated: (updatedBooking: Booking) => void;
}

export default function BookingDetailModal({
  isOpen,
  onClose,
  booking,
  onStatusUpdated,
}: BookingDetailModalProps) {
  const [currentStatus, setCurrentStatus] = useState<BookingStatus>(booking?.status || 'pending_dp');
  const [updating, setUpdating] = useState(false);

  React.useEffect(() => {
    if (booking) {
      setCurrentStatus(booking.status);
    }
  }, [booking]);

  if (!isOpen || !booking) return null;

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);

  const handleUpdateStatus = async (newStatus: BookingStatus) => {
    setUpdating(true);
    setCurrentStatus(newStatus);

    const updated = { ...booking, status: newStatus };

    try {
      const supabase = createClient();
      await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', booking.id);
    } catch (err) {
      // Mock fallback
    }

    onStatusUpdated(updated);
    setUpdating(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative z-10 my-8 w-full max-w-xl rounded-3xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 shadow-2xl space-y-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400">
                <span>{booking.ticket_code}</span>
              </div>
              <h3 className="text-xl font-extrabold text-white mt-0.5">
                Inspeksi Tiket & Brief Pesanan
              </h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Status Switcher */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-400">
              Update Status Pesanan
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { value: 'pending_dp', label: 'Pending DP', color: 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10' },
                  { value: 'in_progress', label: 'In Progress', color: 'border-blue-500/50 text-blue-400 bg-blue-500/10' },
                  { value: 'completed', label: 'Completed', color: 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' },
                  { value: 'cancelled', label: 'Cancelled', color: 'border-red-500/50 text-red-400 bg-red-500/10' },
                ] as const
              ).map((st) => (
                <button
                  key={st.value}
                  type="button"
                  onClick={() => handleUpdateStatus(st.value)}
                  className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                    currentStatus === st.value
                      ? `${st.color} shadow-sm ring-1 ring-white/20`
                      : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Detail Grid */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3 border-b border-zinc-900 pb-3">
              <div>
                <span className="text-zinc-500 block">Talent Terpilih:</span>
                <strong className="text-white text-sm">{booking.talent_name}</strong>
              </div>
              <div>
                <span className="text-zinc-500 block">Target Deadline:</span>
                <strong className="text-amber-400">{booking.deadline_date}</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-b border-zinc-900 pb-3">
              <div>
                <span className="text-zinc-500 block">Nama Klien:</span>
                <strong className="text-white">{booking.client_name}</strong>
              </div>
              <div>
                <span className="text-zinc-500 block">WhatsApp Klien:</span>
                <a
                  href={`https://wa.me/${booking.client_whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:underline font-mono"
                >
                  +{booking.client_whatsapp}
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-b border-zinc-900 pb-3">
              <div>
                <span className="text-zinc-500 block">Layanan Tambahan:</span>
                <span className="text-zinc-300">
                  {booking.is_rush_order && '⚡ Rush Order '}
                  {booking.include_source_file && '📁 Source File '}
                  {!booking.is_rush_order && !booking.include_source_file && 'Tidak ada add-on'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">Estimasi Total / DP:</span>
                <span className="text-white font-bold">{formatRupiah(booking.estimated_total)}</span>
                <span className="text-amber-400 ml-1.5 font-bold">
                  (DP: {formatRupiah(booking.dp_amount)})
                </span>
              </div>
            </div>

            {/* Brief */}
            <div>
              <span className="text-zinc-500 block mb-1">Rincian Brief Klien:</span>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {booking.project_brief}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-zinc-950 shadow-gold-glow hover:bg-amber-400"
            >
              Tutup
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
