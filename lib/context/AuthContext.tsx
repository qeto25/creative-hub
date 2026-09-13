'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isDemoMode } from '@/lib/config';
import { logoutDemoAction } from '@/app/actions/demo-auth';

export interface UserSession {
  role: 'owner' | 'member';
  user_id: string;
  name: string;
  email?: string;
}

interface AuthContextType {
  session: UserSession | null;
  isLoading: boolean;
  login: (userSession: UserSession) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'creativehub_user_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 1. Cek dari localStorage secara persisten
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.role === 'owner' || parsed.role === 'member')) {
          setSession(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to read local session', e);
    }

    // 2. Cek juga dari Supabase Session jika ada
    try {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session: sbSession } }) => {
        if (sbSession?.user) {
          const role: 'owner' | 'member' =
            sbSession.user.user_metadata?.role ||
            (sbSession.user.email?.includes('owner') ? 'owner' : 'member');
          const name =
            sbSession.user.user_metadata?.full_name ||
            (role === 'owner' ? 'Owner Agensi' : 'Creative Member');

          const newSession: UserSession = {
            role,
            user_id: sbSession.user.id,
            name,
            email: sbSession.user.email,
          };
          setSession(newSession);
          localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
          document.cookie = `${SESSION_KEY}=${encodeURIComponent(
            JSON.stringify(newSession)
          )}; path=/; max-age=604800; SameSite=Lax`;
        }
      });
    } catch (e) {
      console.warn('Supabase session check error', e);
    }

    setIsLoading(false);
  }, []);

  const login = (userSession: UserSession) => {
    setSession(userSession);
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(userSession));
      document.cookie = `${SESSION_KEY}=${encodeURIComponent(
        JSON.stringify(userSession)
      )}; path=/; max-age=604800; SameSite=Lax`;
    } catch (e) {
      console.warn('Failed to save session', e);
    }
  };

  const logout = async () => {
    setSession(null);
    try {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.clear();
      document.cookie = `${SESSION_KEY}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      document.cookie = `creativehub_demo_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      if (isDemoMode()) {
        await logoutDemoAction();
      }
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Error during logout', e);
    }
  };

  return (
    <AuthContext.Provider value={{ session, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthSession() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthSession must be used within an AuthProvider');
  }
  return context;
}
