'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  Compass,
  Users,
  FolderKanban,
  ShieldCheck,
  User,
  Menu,
  X,
  LogIn,
  LogOut,
  Palette,
  FileCheck,
} from 'lucide-react';
import { useAuthSession } from '@/lib/context/AuthContext';
import { isDemoMode } from '@/lib/config';

export default function Navbar() {
  const pathname = usePathname();
  const { session, logout } = useAuthSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isDemo = isDemoMode();

  const navLinks = [
    { href: '/', label: 'Home', icon: Compass },
    { href: '/freelancers', label: 'Freelancers', icon: Users },
    { href: '/projects', label: 'Projects', icon: FolderKanban },
    { href: '/track', label: 'Lacak Proyek', icon: FileCheck },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* KIRI: Logo + Nama Agensi + Status Mode */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 p-0.5 shadow-gold-glow transition-all duration-300 group-hover:scale-105 group-hover:shadow-gold-glow-lg">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-zinc-950">
              <Sparkles className="h-5 w-5 text-amber-400" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-widest text-lg text-white group-hover:text-amber-400 transition-colors">
                CREATIVE<span className="text-amber-400">.</span>HUB
              </span>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                isDemo
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}>
                {isDemo ? 'Demo' : 'Live'}
              </span>
            </div>
            <span className="text-[10px] tracking-wider uppercase text-zinc-400 font-medium -mt-1">
              Agensi Kreatif Pelajar
            </span>
          </div>
        </Link>

        {/* TENGAH: Menu Navigasi Desktop */}
        <nav className="hidden md:flex items-center gap-1 rounded-full border border-zinc-800/80 bg-zinc-900/60 p-1.5 backdrop-blur-md">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-zinc-800 text-amber-400 shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-amber-400' : 'text-zinc-500'}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* KANAN: User Avatar / Dynamic Auth State */}
        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <div className="flex items-center gap-2.5">
              {session.role === 'owner' ? (
                <Link
                  href="/dashboard/owner"
                  className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-all shadow-gold-glow"
                >
                  <ShieldCheck className="h-4 w-4 text-amber-400" />
                  <span>🛡️ Dashboard Owner</span>
                </Link>
              ) : (
                <Link
                  href="/dashboard/member"
                  className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-all"
                >
                  <Palette className="h-4 w-4 text-emerald-400" />
                  <span>🎨 Dashboard Saya</span>
                </Link>
              )}

              {/* Tombol Logout */}
              <button
                onClick={logout}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-xs font-medium text-zinc-400 hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                title="Keluar dari akun"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-5 py-2.5 text-sm font-medium text-white hover:border-amber-500/60 hover:text-amber-400 hover:shadow-gold-glow transition-all duration-200"
            >
              <LogIn className="h-4 w-4 text-amber-400" />
              <span>Sign In</span>
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-800 bg-zinc-950/95 px-4 py-5 backdrop-blur-xl">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive ? 'bg-zinc-800 text-amber-400' : 'text-zinc-300 hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </Link>
              );
            })}

            <div className="mt-3 pt-3 border-t border-zinc-800 flex flex-col gap-2.5">
              {session ? (
                <>
                  <Link
                    href={session.role === 'owner' ? '/dashboard/owner' : '/dashboard/member'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-amber-500/20 border border-amber-500/50 py-3 text-sm font-semibold text-amber-300"
                  >
                    {session.role === 'owner' ? (
                      <>
                        <ShieldCheck className="h-4 w-4 text-amber-400" />
                        <span>🛡️ Buka Dashboard Owner</span>
                      </>
                    ) : (
                      <>
                        <Palette className="h-4 w-4 text-emerald-400" />
                        <span>🎨 Buka Dashboard Saya</span>
                      </>
                    )}
                  </Link>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 py-3 text-xs font-semibold text-red-400 hover:bg-red-500/10"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Keluar (Logout)</span>
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-zinc-700 py-3 text-sm font-medium text-white hover:text-amber-400"
                >
                  <LogIn className="h-4 w-4 text-amber-400" />
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
