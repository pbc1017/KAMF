import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Inter } from 'next/font/google';
import { ReactNode } from 'react';

import './globals.css';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { AuthProvider } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/queryProvider';

// Header를 클라이언트에서만 렌더링
const Header = dynamic(() => import('@/components/Header'), {
  ssr: false,
  loading: () => (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-800/95 backdrop-blur-md border-b border-gray-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex-1" />
          <div className="flex-shrink-0 my-1">
            <div className="w-25 h-8 bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="flex-1 flex justify-end">
            <LoadingSpinner color="gray" />
          </div>
        </div>
      </div>
    </header>
  ),
});

// Toast 알림을 클라이언트에서만 렌더링
const Toaster = dynamic(() => import('react-hot-toast').then(mod => ({ default: mod.Toaster })), {
  ssr: false,
});

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '2025 KAMF',
  description: 'KAMF official website',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            <Header />
            <main className="pt-20">{children}</main>
            <Toaster
              position="top-center"
              reverseOrder={false}
              gutter={8}
              containerStyle={{ zIndex: 9999 }}
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#363636',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '500',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  boxShadow:
                    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                },
                success: {
                  duration: 3000,
                  style: {
                    background: '#10b981',
                    color: '#fff',
                  },
                },
                error: {
                  duration: 4000,
                  style: {
                    background: '#ef4444',
                    color: '#fff',
                  },
                },
              }}
            />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
