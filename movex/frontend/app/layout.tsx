import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import Navbar from '@/components/ui/Navbar';

export const metadata: Metadata = {
  title: 'MoveX — AI Perp DEX on Movement',
  description: 'The first AI-powered perpetual futures DEX on Movement Network. Trade with 20x leverage or let AI agents trade for you.',
  openGraph: {
    title: 'MoveX',
    description: 'AI-powered perp DEX on Movement Network',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-surface text-white antialiased min-h-screen">
        <Providers>
          <Navbar />
          <main className="max-w-[1440px] mx-auto px-4 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
