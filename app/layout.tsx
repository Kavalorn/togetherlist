import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { MainNav } from '@/components/layout/main-nav';
import { ThemeProvider } from '@/components/layout/theme-provider';
import TanstackQueryProvider from '@/components/providers/query-provider';
import { Toaster } from '@/components/ui/sonner';
import { MovieDetailsModal } from '@/components/movie/movie-details-modal';
import { useEffect } from 'react';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'WatchPick - Список перегляду фільмів',
  description: 'Додаток для пошуку фільмів та створення списку перегляду',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="uk" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans min-h-screen bg-background antialiased`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TanstackQueryProvider>
            <div className="relative flex min-h-screen flex-col">
              <MainNav />
              <main className="flex-1 container mx-auto py-8 px-4">{children}</main>
              <MovieDetailsModal />
              <Toaster />
            </div>
          </TanstackQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}