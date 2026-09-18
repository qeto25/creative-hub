'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Check, Loader2, Send, ShieldCheck, Ticket } from 'lucide-react';
import { submitReview } from '@/app/actions/submit-review';
import { Review } from '@/lib/types';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: string;
  talentName: string;
  onReviewSubmitted: (newReview: Review) => void;
}

export default function ReviewModal({
  isOpen,
  onClose,
  profileId,
  talentName,
  onReviewSubmitted,
}: ReviewModalProps) {
  const [ticketCode, setTicketCode] = useState('');
  const [clientWhatsapp, setClientWhatsapp] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketCode.trim() || !clientWhatsapp.trim()) {
      setErrorMessage('Nomor tiket pesanan dan nomor WhatsApp wajib diisi.');
      return;
    }

    if (!comment.trim()) {
      setErrorMessage('Mohon berikan ulasan singkat mengenai hasil pengerjaan.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await submitReview({
        profileId,
        ticketCode: ticketCode.trim(),
        clientWhatsapp: clientWhatsapp.trim(),
        rating,
        comment: comment.trim(),
      });

      if (res.success && res.review) {
        setSuccess(true);
        onReviewSubmitted(res.review);
        setTimeout(() => {
          setSuccess(false);
          setTicketCode('');
          setClientWhatsapp('');
          setComment('');
          setRating(5);
          onClose();
        }, 1800);
      } else {
        setErrorMessage(res.error || 'Gagal memverifikasi ulasan.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative z-10 my-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900/95 p-4 sm:p-6 backdrop-blur-md shadow-xl"
        >
          <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Verified Client Review</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white">
                Beri Ulasan untuk <span className="text-amber-400">{talentName}</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Ulasan terverifikasi wajib menggunakan tiket pesanan yang sudah selesai (Completed).
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {success ? (
            <div className="py-8 text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <Check className="h-7 w-7" />
              </div>
              <h4 className="text-lg font-extrabold text-white">Ulasan Terverifikasi Berhasil!</h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Terima kasih! Ulasan Anda telah divalidasi dengan tiket pesanan dan skor rating talent telah diperbarui.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {errorMessage && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3.5 text-xs text-red-400 font-medium leading-relaxed">
                  {errorMessage}
                </div>
              )}

              {/* Info Banner Verifikasi */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2.5 text-[11px] text-amber-300">
                <Ticket className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  Proteksi anti-ulasan palsu aktif. Masukkan nomor tiket dari bukti pemesanan WhatsApp Anda (contoh: <strong className="text-white">#CH-2609-8269</strong>).
                </p>
              </div>

              {/* 1. Nomor Tiket Pesanan */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Nomor Tiket Pesanan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: #CH-2609-8269"
                  value={ticketCode}
                  onChange={(e) => setTicketCode(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-3 px-4 text-xs font-mono font-bold text-amber-400 uppercase placeholder-zinc-600 focus:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400"
                />
              </div>

              {/* 2. WhatsApp Klien yang Terdaftar */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Nomor WhatsApp Pemesan
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Nomor WA saat booking (contoh: 081234567890)"
                  value={clientWhatsapp}
                  onChange={(e) => setClientWhatsapp(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-3 px-4 text-xs text-white placeholder-zinc-500 focus:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400"
                />
              </div>

              {/* 3. Star Rating Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Rating Kepuasan
                </label>
                <div className="flex items-center gap-1.5 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1.5 transition-transform hover:scale-115 focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          (hoverRating || rating) >= star
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-zinc-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-amber-400">
                    {hoverRating || rating} / 5.0 Bintang
                  </span>
                </div>
              </div>

              {/* 4. Textarea Ulasan */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Ulasan & Testimoni Kerja Sama
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ceritakan pengalaman Anda, ketepatan deadline tugas, kerapihan file PPT/video, dan komunikasinya..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-3 px-4 text-xs text-white placeholder-zinc-500 focus:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400"
                />
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
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 px-5 text-xs font-bold text-zinc-950 shadow-gold-glow hover:bg-amber-400 transition-colors duration-200 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Kirim Ulasan Terverifikasi</span>
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
