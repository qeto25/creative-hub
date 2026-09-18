'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, User, Lock, LogIn, Shield, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuthSession } from '@/lib/context/AuthContext';
import { isDemoMode } from '@/lib/config';
import { loginDemoAction } from '@/app/actions/demo-auth';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthSession();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isLive = process.env.NEXT_PUBLIC_APP_MODE === 'live' || !isDemoMode();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      // Auto-mapping: jika input adalah "grown" atau tidak memiliki '@', petakan menjadi "grown@creativehub.id"
      const rawInput = usernameOrEmail.trim();
      let resolvedEmail = rawInput.toLowerCase();

      if (resolvedEmail === 'grown' || !resolvedEmail.includes('@')) {
        resolvedEmail = 'grown@creativehub.id';
      }

      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password,
      });

      if (error) {
        // Hanya berikan fallback demo login jika aplikasi BERJALAN di mode demo
        if (!isLive) {
          const demoRole: 'owner' | 'member' =
            resolvedEmail.includes('owner') || rawInput.toLowerCase() === 'grown' ? 'owner' : 'member';
          const res = await loginDemoAction(demoRole);
          if (res.success && res.redirectUrl) {
            if (res.session) {
              login(res.session);
            }
            window.location.href = res.redirectUrl;
            return;
          }
        }

        // Mode Live: Tampilkan pesan error resmi dari Supabase
        setErrorMessage(
          error.message === 'Invalid login credentials'
            ? 'Username/email atau kata sandi tidak cocok. Periksa kembali kredensial Anda.'
            : error.message || 'Gagal masuk. Silakan coba lagi.'
        );
        return;
      }

      if (data?.user) {
        // Ambil profil dari Supabase untuk menentukan role & nama yang akurat
        let role: 'owner' | 'member' =
          (data.user.user_metadata?.role as 'owner' | 'member') ||
          (resolvedEmail === 'grown@creativehub.id' || resolvedEmail.includes('owner') ? 'owner' : 'member');
        let name =
          data.user.user_metadata?.full_name ||
          (role === 'owner' ? 'Owner Grown' : 'Creative Member');

        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role, full_name')
            .eq('id', data.user.id)
            .maybeSingle();

          if (profileData?.role) {
            role = profileData.role as 'owner' | 'member';
            if (profileData.full_name) {
              name = profileData.full_name;
            }
          }
        } catch {
          // Gunakan fallback role dari metadata/email
        }

        login({
          role,
          user_id: data.user.id,
          name,
          email: data.user.email,
        });

        if (role === 'owner') {
          router.push('/dashboard/owner');
        } else {
          router.push('/dashboard/member');
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan sistem saat mencoba masuk.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Access Buttons (Hanya aktif di mode Demo)
  const loginAsOwnerDemo = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await loginDemoAction('owner');
      if (res.success && res.redirectUrl) {
        if (res.session) {
          login(res.session);
        }
        window.location.href = res.redirectUrl;
      } else {
        setErrorMessage(res.error || 'Gagal masuk sebagai Demo Owner.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal masuk mode demo.');
    } finally {
      setLoading(false);
    }
  };

  const loginAsMemberDemo = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await loginDemoAction('member');
      if (res.success && res.redirectUrl) {
        if (res.session) {
          login(res.session);
        }
        window.location.href = res.redirectUrl;
      } else {
        setErrorMessage(res.error || 'Gagal masuk sebagai Demo Member.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal masuk mode demo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 relative overflow-hidden w-full">
      {/* Background glow - constrained to prevent mobile horizontal scroll */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none max-w-full" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 p-0.5 shadow-gold-glow mb-2">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-zinc-950">
              <Sparkles size={24} className="text-amber-400" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
            Member & Owner Portal
          </h2>
          <p className="text-xs text-zinc-400">
            Masuk ke panel manajemen talenta Creative Hub
          </p>
        </div>

        {/* Login Form Card */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 sm:p-8 backdrop-blur-md shadow-xl space-y-6">
          {errorMessage && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-400 font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Username / Email
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  required
                  placeholder="Username / Email"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 text-sm text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 text-sm text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-bold text-zinc-950 shadow-gold-glow hover:bg-amber-400 transition-colors duration-200 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Masuk ke Dashboard</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Bar (HANYA tampil saat mode DEMO) */}
          {!isLive && (
            <div className="pt-4 border-t border-zinc-800 space-y-3">
              <span className="block text-[11px] uppercase tracking-wider text-center text-zinc-500 font-semibold">
                Mode Demo Cepat (1-Click Access)
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={loginAsOwnerDemo}
                  className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-colors"
                >
                  <Shield className="h-3.5 w-3.5 text-amber-400" />
                  <span>Demo Owner</span>
                </button>

                <button
                  type="button"
                  onClick={loginAsMemberDemo}
                  className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                >
                  <User className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Demo Member</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <Link href="/" className="text-xs text-zinc-500 hover:text-amber-400 transition-colors">
            ← Kembali ke Beranda Utama
          </Link>
        </div>
      </div>
    </div>
  );
}

