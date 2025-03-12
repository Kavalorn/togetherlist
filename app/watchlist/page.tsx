'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWatchlist } from '@/hooks/use-watchlist';
import { useAuthStore } from '@/store/auth-store';
import { MovieCard } from '@/components/movie/movie-card';
import { Button } from '@/components/ui/button';
import { BookmarkX, Loader2, Search } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function WatchlistPage() {
  const { watchlist, isLoading, refetch } = useWatchlist();
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
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <h1 className="text-2xl font-bold mb-4">Авторизуйтесь для доступу до списку перегляду</h1>
        <p className="text-muted-foreground mb-6">Для використання цієї функції необхідно увійти в свій обліковий запис</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Список перегляду</h1>
          <p className="text-muted-foreground">
            {watchlist.length
              ? `${watchlist.length} фільм${watchlist.length > 1 ? 'ів' : ''} у вашому списку`
              : 'Ваш список перегляду порожній'
            }
          </p>
        </div>
        
        <Button onClick={() => router.push('/')} variant="outline" className="ml-auto">
          <Search className="mr-2 h-4 w-4" />
          Шукати фільми
        </Button>
      </div>
      
      <Separator />
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : watchlist.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {watchlist.map((movie) => (
            <MovieCard
              key={movie.id || movie.movie_id}
              movie={{
                id: movie.movie_id || movie.id,
                title: movie.title,
                poster_path: movie.poster_path,
                release_date: movie.release_date,
                overview: movie.overview,
                vote_average: movie.vote_average
              }}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <BookmarkX className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Список перегляду порожній</h2>
          <p className="text-muted-foreground max-w-md text-center">
            Додавайте фільми до списку перегляду, щоб швидко повернутися до них пізніше
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