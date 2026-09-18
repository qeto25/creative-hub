'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Portfolio } from '@/lib/types';
import { Sparkles, ArrowUpRight, Play } from 'lucide-react';

interface ProjectCardProps {
  portfolio: Portfolio;
}

export default function ProjectCard({ portfolio }: ProjectCardProps) {
  return (
    <motion.div
      className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/80 backdrop-blur-md transition-colors duration-200 duration-300 hover:border-amber-500/50 h-full"
      whileHover={{ y: -4, boxShadow: '0 0 20px rgba(234, 179, 8, 0.15)' }}
      transition={{ duration: 0.2 }}
    >
      {/* Media Box: Aspect Video 16:9 */}
      <div className="relative w-full aspect-video overflow-hidden rounded-t-xl bg-zinc-900">
        <Image
          src={portfolio.media_url}
          alt={portfolio.title || 'Project Thumbnail'}
          width={640}
          height={360}
          className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-80" />

        {/* Category Pill */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="rounded-full border border-amber-500/40 bg-zinc-950/85 px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold text-amber-300 backdrop-blur-md shadow-sm">
            {portfolio.category}
          </span>
        </div>

        {portfolio.media_type === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/90 text-zinc-950 shadow-gold-glow group-hover:scale-110 transition-transform">
              <Play className="h-4 w-4 fill-zinc-950 ml-0.5" />
            </div>
          </div>
        )}
      </div>

      {/* Project Details & Body */}
      <div className="p-4 space-y-2 bg-zinc-900/90 rounded-b-xl border-x border-b border-zinc-800/80 flex flex-col justify-between flex-1">
        <div className="space-y-1">
          <h4 className="text-sm sm:text-base font-bold text-zinc-100 group-hover:text-amber-400 transition-colors line-clamp-1">
            {portfolio.title}
          </h4>
          {portfolio.description && (
            <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
              {portfolio.description}
            </p>
          )}
        </div>

        {/* Talent Attribution Footer */}
        <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
          {portfolio.profile ? (
            <Link
              href={`/freelancers/${portfolio.profile.id}`}
              className="flex items-center gap-2 text-xs text-zinc-400 hover:text-amber-400 transition-colors group/talent truncate mr-2"
            >
              <Image
                src={portfolio.profile.avatar_url}
                alt={portfolio.profile.full_name || 'Talent Avatar'}
                width={20}
                height={20}
                className="w-5 h-5 rounded-full object-cover border border-amber-500/40 shrink-0"
              />
              <span className="font-medium truncate text-xs">
                Oleh: <strong className="text-zinc-200 group-hover/talent:text-amber-400 font-semibold">{portfolio.profile.full_name}</strong>
              </span>
              <span className="hidden sm:inline-block text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-medium shrink-0">
                Karya Pelajar
              </span>
            </Link>
          ) : (
            <Link
              href={`/freelancers/${portfolio.profile_id}`}
              className="text-xs text-zinc-400 hover:text-amber-400 transition-colors flex items-center gap-1 truncate mr-2"
            >
              <span>Lihat Detail Talent</span>
            </Link>
          )}

          <Link
            href={`/freelancers/${portfolio.profile?.id || portfolio.profile_id}`}
            className="rounded-lg p-1 text-zinc-500 hover:text-amber-400 transition-colors shrink-0"
            aria-label="Lihat profil kreator"
          >
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
