import type { User } from '@supabase/supabase-js';

/**
 * Satu-satunya sumber kebenaran untuk "siapa owner".
 *
 * JANGAN pernah pakai email.includes('owner') — siapa pun bisa daftar
 * dengan alamat seperti owner123@gmail.com lalu otomatis jadi owner.
 * Owner = metadata role === 'owner' ATAU email persis sama dengan OWNER_EMAIL.
 */
export function isOwnerUser(
  user: Pick<User, 'email' | 'user_metadata'> | null | undefined
): boolean {
  if (!user) return false;
  if (user.user_metadata?.role === 'owner') return true;

  const ownerEmail = (process.env.OWNER_EMAIL || 'grown@creativehub.id').toLowerCase().trim();
  const email = (user.email || '').toLowerCase().trim();
  return email !== '' && email === ownerEmail;
}