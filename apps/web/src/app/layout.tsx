import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ReactNode } from 'react';

import './globals.css';
import Header from '@/components/Header';
import { QueryProvider } from '@/providers/queryProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '2025 KAMF',
  description: 'KAMF official website',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Header />
        <main className="pt-16">
          <QueryProvider>{children}</QueryProvider>
        </main>
      </body>
    </html>
  );
}
