// app/archive/page.tsx
'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useWatchedMovies } from '@/hooks/use-watched-movies';
import { useAuthStore } from '@/store/auth-store';
import { MovieCard } from '@/components/movie/movie-card';
import { Button } from '@/components/ui/button';
import { Eye, Loader2, Search } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

// Функція для безпечного перетворення значення на число
function safeNumberConversion(value: any): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseInt(value, 10) || 0;
  return 0;
}

export default function ArchivePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Завантаження...</p>
      </div>
    }>
      <ArchiveContent />
    </Suspense>
  );
}

function ArchiveContent() {
  const { watchedMovies, isLoading, refetch } = useWatchedMovies();
  const { user, isLoading: isAuthLoading } = useAuthStore();
  const router = useRouter();
  
  // Ініціалізація стану аутентифікації при завантаженні сторінки
  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);
  
  // Автоматичний перехід на сторінку входу, якщо користувач не авторизований
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/');
    }
  }, [isAuthLoading, user, router]);
  
  // Якщо перевіряється стан аутентифікації, показуємо індикатор завантаження
  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Завантаження...</p>
      </div>
    );
  }
  
  // Якщо користувач не авторизований, показуємо повідомлення про необхідність входу
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] p-4">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 text-center">Авторизуйтесь для доступу до архіву</h1>
        <p className="text-muted-foreground mb-6 text-center">Для використання цієї функції необхідно увійти в свій обліковий запис</p>
        <Button onClick={() => router.push('/')} variant="default">
          На головну
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Архів переглянутих фільмів</h1>
          <p className="text-muted-foreground">
            {watchedMovies.length
              ? `${watchedMovies.length} фільм${watchedMovies.length > 1 ? 'ів' : ''} у вашому архіві`
              : 'Ваш архів порожній'
            }
          </p>
        </div>
        
        <Button onClick={() => router.push('/')} variant="outline" className="sm:ml-auto w-full sm:w-auto">
          <Search className="mr-2 h-4 w-4" />
          Шукати фільми
        </Button>
      </div>
      
      <Separator />
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : watchedMovies.length > 0 ? (
        // app/archive/page.tsx (продовження)
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
       {watchedMovies.map((movie) => {
         // Явно перетворюємо vote_count на число
         const voteCount = safeNumberConversion(movie.vote_count);
         
         return (
           <MovieCard
             key={movie.id || movie.movie_id}
             movie={{
               id: movie.movie_id || movie.id,
               title: movie.title,
               poster_path: movie.poster_path,
               release_date: movie.release_date,
               overview: movie.overview,
               vote_average: movie.vote_average,
               vote_count: voteCount // Передаємо гарантовано число
             }}
           />
         );
       })}
     </div>
   ) : (
     <div className="flex flex-col items-center justify-center py-12 space-y-4 px-4">
       <Eye className="h-16 w-16 text-muted-foreground" />
       <h2 className="text-xl font-semibold text-center">Архів порожній</h2>
       <p className="text-muted-foreground max-w-md text-center">
         Позначайте фільми як переглянуті, щоб вони з'являлися в архіві
       </p>
       <Button onClick={() => router.push('/')} variant="default" className="mt-4">
         <Search className="mr-2 h-4 w-4" />
         Шукати фільми
       </Button>
     </div>
   )}
 </div>
);
}