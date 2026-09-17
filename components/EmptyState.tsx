'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon, FolderKanban, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon: Icon = FolderKanban,
  title,
  description,
  actionText,
  actionHref,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto backdrop-blur-sm shadow-xl ${className}`}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/60 border border-zinc-700/60 text-amber-400 mb-4 shadow-inner">
        <Icon size={32} />
      </div>

      <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-xs sm:text-sm text-zinc-400 max-w-md leading-relaxed mb-6">
        {description}
      </p>

      {actionText && (
        <>
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-zinc-950 shadow-gold-glow hover:bg-amber-400 transition-all hover:scale-105 active:scale-95"
            >
              <span>{actionText}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-zinc-950 shadow-gold-glow hover:bg-amber-400 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>{actionText}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}
