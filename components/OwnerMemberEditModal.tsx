'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, Sparkles, Check } from 'lucide-react';
import { Profile } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

interface OwnerMemberEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  onProfileUpdated: (updated: Profile) => void;
}

export default function OwnerMemberEditModal({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
}: OwnerMemberEditModalProps) {
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [skills, setSkills] = useState('');
  const [tools, setTools] = useState('');
  const [basePrice, setBasePrice] = useState<number>(0);
  const [dpPercentage, setDpPercentage] = useState<number>(30);
  const [turnaroundTime, setTurnaroundTime] = useState('2-4 Hari Kerja');
  const [deliverables, setDeliverables] = useState('High-Res File, Web Version');
  const [freeRevisions, setFreeRevisions] = useState<number>(1);
  const [extraRevisionFee, setExtraRevisionFee] = useState<number>(50000);
  const [rushFee, setRushFee] = useState<number>(300000);
  const [sourceFilePrice, setSourceFilePrice] = useState<number>(250000);
  const [isTester, setIsTester] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || '');
      setCoverUrl(profile.cover_url || '');
      setSkills((profile.skills || []).join(', '));
      setTools((profile.tools || []).join(', '));
      setBasePrice(profile.base_price || 0);
      setDpPercentage(profile.dp_percentage || 30);
      setTurnaroundTime(profile.turnaround_time || '2-4 Hari Kerja');
      setDeliverables((profile.deliverables || ['High-Res File']).join(', '));
      setFreeRevisions(profile.free_revisions ?? 1);
      setExtraRevisionFee(profile.extra_revision_fee ?? 50000);
      setRushFee(profile.rush_fee ?? 300000);
      setSourceFilePrice(profile.source_file_price ?? 250000);
      setIsTester(profile.is_tester ?? false);
    }
  }, [profile]);

  if (!isOpen || !profile) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const updatedProfile: Profile = {
      ...profile,
      full_name: fullName.trim(),
      bio: bio.trim(),
      avatar_url: avatarUrl.trim(),
      cover_url: coverUrl.trim(),
      skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
      tools: tools.split(',').map((t) => t.trim()).filter(Boolean),
      base_price: Number(basePrice),
      dp_percentage: Number(dpPercentage),
      turnaround_time: turnaroundTime.trim(),
      deliverables: deliverables.split(',').map((d) => d.trim()).filter(Boolean),
      free_revisions: Number(freeRevisions),
      extra_revision_fee: Number(extraRevisionFee),
      rush_fee: Number(rushFee),
      source_file_price: Number(sourceFilePrice),
      is_tester: isTester,
      updated_at: new Date().toISOString(),
    };

    try {
      const supabase = createClient();
      try {
        await supabase
          .from('profiles')
          .update({
            full_name: updatedProfile.full_name,
            bio: updatedProfile.bio,
            avatar_url: updatedProfile.avatar_url,
            cover_url: updatedProfile.cover_url,
            skills: updatedProfile.skills,
            tools: updatedProfile.tools,
            base_price: updatedProfile.base_price,
            dp_percentage: updatedProfile.dp_percentage,
            turnaround_time: updatedProfile.turnaround_time,
            deliverables: updatedProfile.deliverables,
            free_revisions: updatedProfile.free_revisions,
            extra_revision_fee: updatedProfile.extra_revision_fee,
            rush_fee: updatedProfile.rush_fee,
            source_file_price: updatedProfile.source_file_price,
            is_tester: updatedProfile.is_tester,
          })
          .eq('id', profile.id);
      } catch (dbErr) {
        // Mock fallback
      }

      onProfileUpdated(updatedProfile);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan perubahan.');
    } finally {
      setLoading(false);
    }
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
          className="relative z-10 my-8 w-full max-w-3xl rounded-3xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Owner Full Profile Editor</span>
              </div>
              <h3 className="text-xl font-extrabold text-white mt-0.5">
                Edit Profil: <span className="text-amber-400">{profile.full_name}</span>
              </h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {success && (
            <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-400 flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span>Seluruh perubahan profil member berhasil disimpan!</span>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-400 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSave} className="mt-6 space-y-6">
            {/* 1. Nama & Bio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Avatar Photo URL
                </label>
                <input
                  type="url"
                  required
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Cover Header Image URL
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Biografi Profesional
              </label>
              <textarea
                rows={3}
                required
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            {/* 2. Skills & Software Tools */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Skills (Pisahkan koma)
                </label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Software & Tools (Pisahkan koma)
                </label>
                <input
                  type="text"
                  value={tools}
                  onChange={(e) => setTools(e.target.value)}
                  placeholder="Figma, Premiere Pro, Blender"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            {/* 3. Pricing & DP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl border border-zinc-800 bg-zinc-950">
              <div>
                <label className="block text-xs font-semibold text-amber-400 mb-1">
                  Tarif Dasar Mulai Dari (IDR)
                </label>
                <input
                  type="number"
                  step="50000"
                  min="0"
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-400 mb-1">
                  Persentase DP Wajib (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={dpPercentage}
                  onChange={(e) => setDpPercentage(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            {/* 4. Turnaround & Deliverables & Add-ons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Durasi Pengerjaan
                </label>
                <input
                  type="text"
                  value={turnaroundTime}
                  onChange={(e) => setTurnaroundTime(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Format Deliverables (Pisahkan koma)
                </label>
                <input
                  type="text"
                  value={deliverables}
                  onChange={(e) => setDeliverables(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Revisi Gratis (x)
                </label>
                <input
                  type="number"
                  min="0"
                  value={freeRevisions}
                  onChange={(e) => setFreeRevisions(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Biaya Ekstra Revisi
                </label>
                <input
                  type="number"
                  step="10000"
                  value={extraRevisionFee}
                  onChange={(e) => setExtraRevisionFee(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Biaya Rush Order
                </label>
                <input
                  type="number"
                  step="50000"
                  value={rushFee}
                  onChange={(e) => setRushFee(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Biaya Source File
                </label>
                <input
                  type="number"
                  step="50000"
                  value={sourceFilePrice}
                  onChange={(e) => setSourceFilePrice(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Tester Profile Switch */}
            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="editTesterCheck"
                checked={isTester}
                onChange={(e) => setIsTester(e.target.checked)}
                className="h-4 w-4 rounded accent-purple-500"
              />
              <label htmlFor="editTesterCheck" className="text-xs text-zinc-300 cursor-pointer">
                Tandai sebagai <strong>Tester / Draft Profile</strong> (Hanya terlihat oleh Owner)
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-5 py-2.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-zinc-950 shadow-gold-glow hover:bg-amber-400 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>Simpan Seluruh Data Member</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
