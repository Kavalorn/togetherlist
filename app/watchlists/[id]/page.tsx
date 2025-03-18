'use client';

import { useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useWatchlistDetails } from '@/hooks/use-watchlists';
import { useAuthStore } from '@/store/auth-store';
import { MovieCard } from '@/components/movie/movie-card';
import { toast } from 'sonner';

export default function WatchlistPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Завантаження списку...</p>
      </div>
    }>
      <WatchlistContent />
    </Suspense>
  );
}

function WatchlistContent() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuthStore();
  
  // Отримуємо ID списку перегляду з URL
  const watchlistId = params.id ? parseInt(params.id as string, 10) : null;
  
  // Отримуємо дані про список та його фільми
  const { 
    watchlist, 
    movies, 
    isLoading, 
    isError, 
    error 
  } = useWatchlistDetails(watchlistId);
  
  // Ініціалізація стану аутентифікації
  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);
  
  // Перенаправлення неавторизованих користувачів
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/');
      toast.error('Авторизуйтесь для доступу до списків перегляду');
    }
  }, [isAuthLoading, user, router]);
  
  // Якщо ID списку некоректний або не вдалося отримати список
  if ((!watchlistId || isNaN(watchlistId)) && !isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.push('/watchlists')} className="w-full sm:w-auto">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад до списків
        </Button>
        
        <div className="flex flex-col items-center justify-center p-8 border rounded-lg">
          <h1 className="text-xl font-semibold mb-2">Невірний ID списку</h1>
          <p className="text-muted-foreground">Вказаний список перегляду не існує або ви не маєте до нього доступу.</p>
        </div>
      </div>
    );
  }
  
  if (isLoading || isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Завантаження списку...</p>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.push('/watchlists')} className="w-full sm:w-auto">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад до списків
        </Button>
        
        <div className="flex flex-col items-center justify-center p-8 border rounded-lg">
          <h1 className="text-xl font-semibold mb-2">Помилка при завантаженні списку</h1>
          <p className="text-muted-foreground">{error instanceof Error ? error.message : 'Не вдалося завантажити дані списку'}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Спробувати знову
          </Button>
        </div>
      </div>
    );
  }
  
  if (!watchlist) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.push('/watchlists')} className="w-full sm:w-auto">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад до списків
        </Button>
        
        <div className="flex flex-col items-center justify-center p-8 border rounded-lg">
          <h1 className="text-xl font-semibold mb-2">Список не знайдено</h1>
          <p className="text-muted-foreground">Вказаний список перегляду не існує або ви не маєте до нього доступу.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push('/watchlists')} className="w-auto">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад до списків
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-md flex items-center justify-center" 
            style={{ backgroundColor: watchlist.color || '#3b82f6' }}
          >
            <span className="text-white font-bold text-xl">{watchlist.name.charAt(0)}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{watchlist.name}</h1>
            {watchlist.description && (
              <p className="text-muted-foreground">{watchlist.description}</p>
            )}
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground">
          {movies.length} {movies.length === 1 ? 'фільм' : movies.length < 5 ? 'фільми' : 'фільмів'} у списку
        </p>
        
        {movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 border rounded-lg mt-6">
            <h2 className="text-lg font-semibold mb-2">Список порожній</h2>
            <p className="text-muted-foreground mb-4">У цьому списку поки немає фільмів.</p>
            <Button onClick={() => router.push('/')}>
              Додати фільми
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mt-6">
            {movies.map(movie => (
              <MovieCard
                key={movie.id}
                movie={{
                  id: movie.movie_id,
                  title: movie.title,
                  poster_path: movie.poster_path || '',
                  release_date: movie.release_date || '',
                  overview: movie.overview || '',
                  vote_average: movie.vote_average || 0,
                  vote_count: movie.vote_count || 0
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}