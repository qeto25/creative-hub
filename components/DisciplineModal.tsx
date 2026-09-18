'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, X, AlertTriangle, Lock, Unlock, Ban, CheckCircle2, RotateCcw, DollarSign } from 'lucide-react';
import { Profile } from '@/lib/types';
import * as dataLayer from '@/lib/dataLayer';
import { formatRupiah } from '@/lib/utils/currency';

interface DisciplineModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  onSaved: (updatedProfile: Profile) => void;
}

export default function DisciplineModal({ isOpen, onClose, profile, onSaved }: DisciplineModalProps) {
  const [isSuspended, setIsSuspended] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [reason, setReason] = useState('');
  const [forcedPrice, setForcedPrice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setIsSuspended(!!profile.is_suspended);
      setIsLocked(!!profile.is_locked);
      setReason(profile.suspension_reason || '');
      setForcedPrice(profile.forced_price !== undefined && profile.forced_price !== null ? profile.forced_price.toString() : '');
      setMessage(null);
    }
  }, [profile, isOpen]);

  if (!isOpen || !profile) return null;

  const handleSaveSaction = async () => {
    setLoading(true);
    setMessage(null);

    const parsedForcedPrice = forcedPrice.trim() === '' ? null : Number(forcedPrice.replace(/\D/g, ''));

    const updates = {
      is_suspended: isSuspended,
      is_locked: isLocked,
      suspension_reason: reason.trim() ? reason.trim() : null,
      forced_price: isNaN(parsedForcedPrice as number) ? null : parsedForcedPrice,
      updated_at: new Date().toISOString(),
    };

    try {
      await dataLayer.updateProfile(profile.id, updates);

      const updated: Profile = {
        ...profile,
        ...updates,
      };

      onSaved(updated);
      setMessage({ type: 'success', text: 'Sanksi disiplin berhasil diperbarui.' });
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      console.error('Error saving discipline status:', err);
      // Still update locally
      const updated: Profile = {
        ...profile,
        ...updates,
      };
      onSaved(updated);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSaction = async () => {
    setLoading(true);
    setMessage(null);

    const revokedUpdates = {
      is_suspended: false,
      is_locked: false,
      suspension_reason: null,
      forced_price: null,
      updated_at: new Date().toISOString(),
    };

    try {
      await dataLayer.updateProfile(profile.id, revokedUpdates);

      const updated: Profile = {
        ...profile,
        ...revokedUpdates,
      };

      setIsSuspended(false);
      setIsLocked(false);
      setReason('');
      setForcedPrice('');

      onSaved(updated);
      setMessage({ type: 'success', text: 'Semua sanksi disiplin berhasil dicabut.' });
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      console.error('Error revoking sanctions:', err);
      const updated: Profile = {
        ...profile,
        ...revokedUpdates,
      };
      onSaved(updated);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-zinc-950 border border-red-900/30 rounded-2xl shadow-xl overflow-hidden my-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-red-950/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Tindakan Disiplin Member
                </h3>
                <p className="text-xs text-zinc-400">
                  Target: <span className="text-zinc-200 font-semibold">{profile.full_name}</span> ({profile.slug})
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {message && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}
              >
                {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{message.text}</span>
              </div>
            )}

            {/* Current Status Preview */}
            {(isSuspended || isLocked || forcedPrice !== '') && (
              <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 text-red-400 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4" />
                  Sanksi Aktif:
                </div>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {isSuspended && (
                    <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/30">
                      ⛔ Akun Ditangguhkan (Skorsing)
                    </span>
                  )}
                  {isLocked && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      🔒 Profil Terkunci (Read-Only)
                    </span>
                  )}
                  {forcedPrice !== '' && (
                    <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                      💰 Override Tarif: {formatRupiah(Number(forcedPrice))}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 1. Toggle Skorsing Akun */}
            <div className="flex items-center justify-between p-3.5 bg-zinc-900/90 border border-zinc-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isSuspended ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-400'}`}>
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Skorsing Akun (Suspend)</div>
                  <div className="text-xs text-zinc-400">
                    Sembunyikan tombol booking dan beri label ditangguhkan pada profil publik.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSuspended(!isSuspended)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                  isSuspended ? 'bg-red-600 justify-end' : 'bg-zinc-700 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md transform" />
              </button>
            </div>

            {/* 2. Toggle Kunci Profil Member */}
            <div className="flex items-center justify-between p-3.5 bg-zinc-900/90 border border-zinc-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isLocked ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800 text-zinc-400'}`}>
                  {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Kunci Profil Member (Lock)</div>
                  <div className="text-xs text-zinc-400">
                    Cegah member mengubah tarif, upload portfolio, cover, bio, atau status ketersediaan.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLocked(!isLocked)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                  isLocked ? 'bg-amber-600 justify-end' : 'bg-zinc-700 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md transform" />
              </button>
            </div>

            {/* 3. Input Alasan Skorsing */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-300">
                Alasan Tindakan Disiplin <span className="text-zinc-500 font-normal">(Muncul di dashboard member)</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Contoh: Terlambat deadline proyek #CH-2609 tanpa konfirmasi, dalam masa evaluasi 7 hari."
                rows={2}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:border-red-500/50 focus-visible:ring-2 focus-visible:ring-red-400"
              />
            </div>

            {/* 4. Override Tarif Penalti */}
            <div className="space-y-2 p-3.5 bg-zinc-900/50 border border-zinc-800/80 rounded-xl">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                  Override Tarif Penalti / Kompensasi
                </label>
                <span className="text-[11px] text-zinc-500">Tarif asli: {formatRupiah(profile.base_price)}</span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-xs text-zinc-500">Rp</span>
                  <input
                    type="number"
                    value={forcedPrice}
                    onChange={(e) => setForcedPrice(e.target.value)}
                    placeholder="Kosongkan untuk tarif normal"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-amber-500/50 focus-visible:ring-2 focus-visible:ring-amber-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setForcedPrice('0')}
                  className="px-3 py-2 rounded-xl text-xs font-medium bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 whitespace-nowrap transition"
                  title="Paksa tarif menjadi Rp 0 sebagai proyek kompensasi ganti rugi"
                >
                  Paksa Rp 0 (Kompensasi)
                </button>
              </div>
              {forcedPrice !== '' && (
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-amber-400">
                    {Number(forcedPrice) === 0 ? '⚠️ Proyek Wajib Gratis (Kompensasi Pelanggaran)' : `Tarif dipaksa: ${formatRupiah(Number(forcedPrice))}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setForcedPrice('')}
                    className="text-zinc-500 hover:text-zinc-300 underline"
                  >
                    Reset Normal
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-zinc-800 bg-zinc-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleRevokeSaction}
              disabled={loading || (!profile.is_suspended && !profile.is_locked && profile.forced_price === null && !profile.suspension_reason)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700 flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Cabut Semua Sanksi
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:bg-zinc-800 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveSaction}
                disabled={loading}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Menyimpan...' : 'Simpan Sanksi'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
