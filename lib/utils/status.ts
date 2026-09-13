/**
 * Standard Talent Availability Status Definition
 * Menyediakan label, indikator visual, dan warna status yang 100% konsisten di seluruh platform
 * Sesuai panduan audit:
 * 1. "Tersedia menerima order"
 * 2. "Sedang mengerjakan pesanan"
 * 3. "Tidak tersedia sementara"
 */

export type TalentStatusKey = 'available' | 'busy' | 'resting' | 'suspended';
export type TalentStatusVariant = 'success' | 'info' | 'warning' | 'danger';

export interface TalentStatusMeta {
  key: TalentStatusKey;
  label: string;
  badgeClass: string;
  dotClass: string;
  shortLabel: string;
  variant: TalentStatusVariant;
  dotColor: string;
  pulse: boolean;
}

export function getTalentStatus(options?: {
  availabilityStatus?: string | null;
  availability_status?: string | null;
  isWorking?: boolean;
  is_working?: boolean;
  isAvailable?: boolean;
  is_available?: boolean;
  isSuspended?: boolean;
  is_suspended?: boolean;
  [key: string]: any;
}): TalentStatusMeta {
  const isSuspended = options?.isSuspended ?? options?.is_suspended ?? false;
  const isAvailable = options?.isAvailable ?? options?.is_available;
  const isWorking = options?.isWorking ?? options?.is_working ?? false;
  const rawStatus = (options?.availabilityStatus ?? options?.availability_status ?? '').toLowerCase();

  if (isSuspended) {
    return {
      key: 'suspended',
      label: 'Tidak tersedia sementara',
      shortLabel: 'Tidak tersedia sementara',
      variant: 'danger',
      badgeClass: 'border-red-500/60 bg-red-950/80 text-red-300',
      dotClass: 'bg-red-400 animate-pulse',
      dotColor: 'bg-red-400',
      pulse: true,
    };
  }

  if (rawStatus === 'resting' || isAvailable === false) {
    return {
      key: 'resting',
      label: 'Tidak tersedia sementara',
      shortLabel: 'Tidak tersedia sementara',
      variant: 'warning',
      badgeClass: 'border-amber-500/50 bg-amber-950/50 text-amber-300',
      dotClass: 'bg-amber-400',
      dotColor: 'bg-amber-400',
      pulse: false,
    };
  }

  if (rawStatus === 'busy' || isWorking) {
    return {
      key: 'busy',
      label: 'Sedang mengerjakan pesanan',
      shortLabel: 'Sedang mengerjakan pesanan',
      variant: 'info',
      badgeClass: 'border-blue-500/50 bg-blue-950/50 text-blue-300',
      dotClass: 'bg-blue-400 animate-pulse',
      dotColor: 'bg-blue-400',
      pulse: true,
    };
  }

  return {
    key: 'available',
    label: 'Tersedia menerima order',
    shortLabel: 'Tersedia menerima order',
    variant: 'success',
    badgeClass: 'border-emerald-500/50 bg-emerald-950/50 text-emerald-300',
    dotClass: 'bg-emerald-400',
    dotColor: 'bg-emerald-400',
    pulse: false,
  };
}
