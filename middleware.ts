import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;
  const isDashboardRoute = pathname.startsWith('/dashboard');

  // Hanya proses rute dashboard
  if (!isDashboardRoute) {
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ernwownclpnkrtczvuci.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_D1BL6OKh4PlRvd-d7x04IA_Lln37TsP';

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value,
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value: '',
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value: '',
          ...options,
        });
      },
    },
  });

  // 1. Verifikasi user session dari Supabase Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDemo = process.env.NEXT_PUBLIC_APP_MODE === 'demo';
  let role: 'owner' | 'member' | null = null;

  if (user) {
    const metaRole = user.user_metadata?.role as 'owner' | 'member' | undefined;
    const email = user.email?.toLowerCase() || '';

    if (metaRole === 'owner' || email === 'grown@creativehub.id' || email.includes('owner')) {
      role = 'owner';
    } else {
      role = 'member';
    }
  } else if (isDemo) {
    // Mode demo: cek cookie session lokal jika tidak ada user Supabase
    const sessionCookie = request.cookies.get('creativehub_user_session')?.value;
    if (sessionCookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(sessionCookie));
        if (parsed?.role === 'owner' || parsed?.role === 'member') {
          role = parsed.role;
        }
      } catch {
        // invalid cookie format
      }
    }
  }

  // JIKA BELUM LOGIN:
  if (!role) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // JIKA LOGIN SEBAGAI MEMBER:
  if (role === 'member') {
    // Member TIDAK BOLEH mengakses /dashboard/owner
    if (pathname.startsWith('/dashboard/owner')) {
      return NextResponse.redirect(new URL('/dashboard/member', request.url));
    }
  }

  // JIKA LOGIN SEBAGAI OWNER:
  if (role === 'owner') {
    // Owner diarahkan ke dashboard owner jika mencoba membuka /dashboard/member
    if (pathname.startsWith('/dashboard/member')) {
      return NextResponse.redirect(new URL('/dashboard/owner', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
  ],
};
