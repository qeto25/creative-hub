import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'CREATIVE HUB — Elite Freelancer Agency & Creative Collective',
  description: 'Kolektif kurasi kreator presentasi, editor video komersial, fotografer produk, dan arsitek UI/UX elit Indonesia dengan jaminan kepuasan dan transparansi DP.',
};

import { AuthProvider } from '@/lib/context/AuthContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen flex flex-col selection:bg-amber-400 selection:text-zinc-950">
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
