// app/discover/page.tsx
'use client';

import { Suspense } from 'react';
import { MovieSwiper } from '@/components/movie/movie-swiper';
import { Loader2 } from 'lucide-react';

export default function DiscoverPage() {
  return (
    <div className="p-0 m-0 h-full w-full">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center h-screen w-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Завантаження...</p>
        </div>
      }>
        <MovieSwiper />
      </Suspense>
    </div>
  );
}