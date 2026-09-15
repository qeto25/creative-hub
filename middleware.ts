import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// ==============================================================================
// 1. IN-MEMORY SLIDING WINDOW RATE LIMITER (Zero Overhead, Pure Native Memory)
// ==============================================================================
interface RateLimitRecord {
  count: number;
  lastReset: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 Menit
const MAX_GENERAL_REQUESTS = 120;       // Max 120 req / menit untuk browsing publik
const MAX_SENSITIVE_REQUESTS = 30;     // Max 30 req / menit untuk API, Login, dan Server Actions POST

function cleanupRateLimitMap() {
  if (rateLimitMap.size > 5000) {
    const now = Date.now();
    rateLimitMap.forEach((record, key) => {
      if (now - record.lastReset > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.delete(key);
      }
    });
  }
}

// ==============================================================================
// 2. HTTP SECURITY HEADERS (OWASP Top 10 Hardened)
// ==============================================================================
function applySecurityHeaders(res: NextResponse): NextResponse {
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https: challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https: fonts.googleapis.com",
    "img-src 'self' data: blob: https: images.unsplash.com ernwownclpnkrtczvuci.supabase.co",
    "font-src 'self' data: https: fonts.gstatic.com",
    "connect-src 'self' https: wss: ernwownclpnkrtczvuci.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  res.headers.set('Content-Security-Policy', cspHeader);
  res.headers.set('X-Frame-Options', 'DENY'); // Cegah Clickjacking
  res.headers.set('X-Content-Type-Options', 'nosniff'); // Cegah MIME sniffing
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), browsing-topics=()');
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.headers.set('X-DNS-Prefetch-Control', 'on');

  return res;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  const now = Date.now();

  // ----------------------------------------------------------------------------
  // A. Proteksi Rate Limiting
  // ----------------------------------------------------------------------------
  const isSensitive = pathname.startsWith('/api') || pathname.startsWith('/login') || request.method === 'POST';
  const limit = isSensitive ? MAX_SENSITIVE_REQUESTS : MAX_GENERAL_REQUESTS;

  const clientRecord = rateLimitMap.get(ip) || { count: 0, lastReset: now };
  if (now - clientRecord.lastReset > RATE_LIMIT_WINDOW_MS) {
    clientRecord.count = 1;
    clientRecord.lastReset = now;
  } else {
    clientRecord.count += 1;
  }
  rateLimitMap.set(ip, clientRecord);
  cleanupRateLimitMap();

  if (clientRecord.count > limit) {
    const rateLimitResponse = new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Too Many Requests',
        message: 'Terlalu banyak permintaan dalam waktu singkat. Silakan tunggu 1 menit.',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
        },
      }
    );
    return applySecurityHeaders(rateLimitResponse);
  }

  // ----------------------------------------------------------------------------
  // B. Respon Dasar dengan Security Headers
  // ----------------------------------------------------------------------------
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const isDashboardRoute = pathname.startsWith('/dashboard');
  if (!isDashboardRoute) {
    return applySecurityHeaders(response);
  }

  // ----------------------------------------------------------------------------
  // C. Autentikasi & Otorisasi Rute Dashboard
  // ----------------------------------------------------------------------------
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ernwownclpnkrtczvuci.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_D1BL6OKh4PlRvd-d7x04IA_Lln37TsP';

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: '', ...options });
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value: '', ...options });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const appMode = (process.env.NEXT_PUBLIC_APP_MODE || 'demo').toLowerCase().trim();
  const isDemo = appMode === 'demo';
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
    const demoCookie =
      request.cookies.get('creativehub_demo_session')?.value ||
      request.cookies.get('creativehub_user_session')?.value;
    if (demoCookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(demoCookie));
        if (parsed?.role === 'owner' || parsed?.role === 'member') {
          role = parsed.role;
        }
      } catch {
        // format cookie tidak valid
      }
    }
  }

  // Jika belum login
  if (!role) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  // Jika member mencoba buka dashboard owner
  if (role === 'member' && pathname.startsWith('/dashboard/owner')) {
    return applySecurityHeaders(NextResponse.redirect(new URL('/dashboard/member', request.url)));
  }

  // Jika owner membuka dashboard member
  if (role === 'owner' && pathname.startsWith('/dashboard/member')) {
    return applySecurityHeaders(NextResponse.redirect(new URL('/dashboard/owner', request.url)));
  }

  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Berlaku untuk semua rute kecuali aset statis dan file gambar
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
