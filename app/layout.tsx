import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { SITE_CONFIG } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: {
    default: `${SITE_CONFIG.name} — Elite Freelancer Agency & Creative Collective`,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  metadataBase: new URL(SITE_CONFIG.url),
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    title: `${SITE_CONFIG.name} — Elite Freelancer Agency & Creative Collective`,
    description: SITE_CONFIG.description,
    images: [
      {
        url: SITE_CONFIG.ogImage,
        width: 1200,
        height: 630,
        alt: `${SITE_CONFIG.name} — Spesialis Presentasi, Video, Fotografi & UI/UX`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_CONFIG.name} — Elite Freelancer Agency`,
    description: SITE_CONFIG.description,
    images: [SITE_CONFIG.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

import { AuthProvider } from '@/lib/context/AuthContext';
import SecurityGuard from '@/components/SecurityGuard';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen flex flex-col selection:bg-amber-400 selection:text-zinc-950">
        <SecurityGuard />
        <AuthProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
