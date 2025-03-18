// app/layout.tsx - оновлена версія з додаванням ActorDetailsModal
import './globals.css';
import { Inter } from 'next/font/google';
import { MainNav } from '@/components/layout/main-nav';
import { ThemeProvider } from '@/components/layout/theme-provider';
import TanstackQueryProvider from '@/components/providers/query-provider';
import { Toaster } from '@/components/ui/sonner';
import { MovieDetailsModal } from '@/components/movie/movie-details-modal';
import { ActorDetailsModal } from '@/components/actor/actor-details-modal';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-sans' });

export const metadata = {
  title: 'WatchPick - Список перегляду фільмів',
  description: 'Додаток для пошуку фільмів та створення списку перегляду',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'WatchPick'
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
  themeColor: '#3b82f6', // Синій колір для теми
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  manifest: '/manifest.json',
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
              <ActorDetailsModal />
              <Toaster />
            </div>
          </TanstackQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}