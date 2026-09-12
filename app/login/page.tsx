'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Mail, Lock, LogIn, Shield, User, Loader2, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuthSession } from '@/lib/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Jika akun belum dibuat di Supabase Auth atau offline, berikan fallback demo login
        if (email.toLowerCase().includes('owner')) {
          login({
            role: 'owner',
            user_id: 'demo-owner-id',
            name: 'Demo Owner',
            email: email || 'owner@creativehub.id',
          });
          router.push('/dashboard/owner');
          return;
        } else {
          login({
            role: 'member',
            user_id: 'demo-member-id',
            name: 'Demo Member',
            email: email || 'member@creativehub.id',
          });
          router.push('/dashboard/member');
          return;
        }
      }

      if (data?.user) {
        const role: 'owner' | 'member' =
          data.user.user_metadata?.role || (data.user.email?.includes('owner') ? 'owner' : 'member');
        const name =
          data.user.user_metadata?.full_name ||
          (role === 'owner' ? 'Owner Agensi' : 'Creative Member');

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
      setErrorMessage(err?.message || 'Gagal login.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Access Buttons
  const loginAsOwnerDemo = () => {
    login({
      role: 'owner',
      user_id: 'demo-owner-id',
      name: 'Owner Agensi (Demo)',
      email: 'owner@creativehub.id',
    });
    router.push('/dashboard/owner');
  };

  const loginAsMemberDemo = () => {
    login({
      role: 'member',
      user_id: 'demo-member-id',
      name: 'Devan Putra (Demo)',
      email: 'devan@creativehub.id',
    });
    router.push('/dashboard/member');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 p-0.5 shadow-gold-glow mb-2">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-zinc-950">
              <Sparkles className="h-6 w-6 text-amber-400" />
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
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-8 backdrop-blur-xl shadow-2xl space-y-6">
          {errorMessage && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-400">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="email"
                  required
                  placeholder="nama@creativehub.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-bold text-zinc-950 shadow-gold-glow hover:bg-amber-400 transition-all duration-200 disabled:opacity-50"
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

          {/* Quick Demo Access Bar */}
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
