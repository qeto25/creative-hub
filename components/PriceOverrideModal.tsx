'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Percent, Check, Loader2 } from 'lucide-react';
import { Profile } from '@/lib/types';
import * as dataLayer from '@/lib/dataLayer';
import { formatRupiah, parseRupiah, formatRupiahDisplay } from '@/lib/utils/currency';

interface PriceOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  onUpdated: (updatedProfile: Profile) => void;
}

export default function PriceOverrideModal({
  isOpen,
  onClose,
  profile,
  onUpdated,
}: PriceOverrideModalProps) {
  const [basePrice, setBasePrice] = useState<number>(profile?.base_price || 50000);
  const [basePriceInput, setBasePriceInput] = useState<string>(formatRupiah(profile?.base_price || 50000));
  const [dpPercentage, setDpPercentage] = useState<number>(profile?.dp_percentage || 30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update form states when profile changes
  React.useEffect(() => {
    if (profile) {
      const price = profile.base_price || 0;
      setBasePrice(price);
      setBasePriceInput(formatRupiah(price));
      setDpPercentage(profile.dp_percentage || 30);
    }
  }, [profile]);

  if (!isOpen || !profile) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const updatedData = {
        ...profile,
        base_price: Number(basePrice),
        dp_percentage: Number(dpPercentage),
        updated_at: new Date().toISOString(),
      };

      try {
        await dataLayer.updateProfile(profile.id, {
          base_price: Number(basePrice),
          dp_percentage: Number(dpPercentage),
        });
      } catch (err) {
        console.warn('DataLayer update note:', err);
      }

      onUpdated(updatedData);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan perubahan tarif.');
    } finally {
      setLoading(false);
    }
  };

  const calculatedDp = Math.round((basePrice * dpPercentage) / 100);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">Price & DP Override (Owner)</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Member: <strong className="text-amber-400">{profile.full_name}</strong>
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="mt-5 space-y-4">
            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-400">
                {error}
              </div>
            )}

            {/* Base Price Input */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Tarif Dasar / Mulai Dari (IDR)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400 text-xs font-bold">
                  Rp
                </div>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 50.000"
                  value={basePriceInput}
                  onChange={(e) => {
                    const formatted = formatRupiah(e.target.value);
                    setBasePriceInput(formatted);
                    setBasePrice(parseRupiah(formatted));
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 text-sm font-semibold text-white focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">
                Nilai tersimpan: <span className="text-zinc-300 font-semibold">{formatRupiahDisplay(basePrice)}</span>
              </p>
            </div>

            {/* DP Percentage Input */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Persentase DP Wajib (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  required
                  value={dpPercentage}
                  onChange={(e) => setDpPercentage(Number(e.target.value))}
                  className="w-full pl-4 pr-9 py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 text-sm text-white focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-400 text-sm">
                  <Percent className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Quick Preview Calculation */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200">
              <div className="flex justify-between items-center">
                <span>Nilai DP Klien:</span>
                <span className="font-bold text-amber-400">
                  {formatRupiahDisplay(calculatedDp)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1 text-[11px] text-zinc-400">
                <span>Sisa Pelunasan:</span>
                <span>
                  {formatRupiahDisplay(basePrice - calculatedDp)}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-zinc-950 shadow-gold-glow hover:bg-amber-400 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Terapkan Tarif Baru
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
