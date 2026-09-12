import React from 'react';
import Link from 'next/link';
import { Sparkles, Shield, Mail, Phone, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800/80 bg-zinc-950 text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 p-0.5 shadow-gold-glow">
                <div className="flex h-full w-full items-center justify-center rounded-[6px] bg-zinc-950">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                </div>
              </div>
              <span className="font-extrabold tracking-wider text-white text-lg">
                CREATIVE<span className="text-amber-400">.</span>HUB
              </span>
            </div>
            <p className="text-sm text-zinc-400 max-w-md leading-relaxed">
              Kolektif kurasi desainer presentasi, editor video komersial, fotografer produk, dan arsitek UI/UX elit Indonesia. Menghadirkan karya visual berstandar internasional dengan transparansi tarif & komitmen DP terjamin.
            </p>
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <Shield className="h-3.5 w-3.5 text-amber-400" /> Guaranteed Quality
              </span>
              <span>•</span>
              <span>Verified Super Talents</span>
              <span>•</span>
              <span>Secure DP Escrow</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
              Eksplorasi
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/freelancers" className="hover:text-amber-400 transition-colors flex items-center gap-1">
                  Direktori Talent <ArrowUpRight className="h-3 w-3" />
                </Link>
              </li>
              <li>
                <Link href="/projects" className="hover:text-amber-400 transition-colors flex items-center gap-1">
                  Koleksi Portofolio <ArrowUpRight className="h-3 w-3" />
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-amber-400 transition-colors flex items-center gap-1">
                  Member Portal <ArrowUpRight className="h-3 w-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact & Concierge */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
              Agency Concierge
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Butuh kurasi khusus tim kreatif untuk proyek skala besar atau retainers? Hubungi tim kurator kami.
            </p>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-zinc-300">
                <Mail className="h-3.5 w-3.5 text-amber-400" />
                <span>concierge@creativehub.id</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <Phone className="h-3.5 w-3.5 text-amber-400" />
                <span>+62 812-3456-7890</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-zinc-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} CREATIVE HUB Collective. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-zinc-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-zinc-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-zinc-400 cursor-pointer">Escrow Guarantee</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
