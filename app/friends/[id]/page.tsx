'use client';

import { useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '@/store/auth-store';
import { useFriendWatchlist } from '@/hooks/use-friends';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Loader2, Bookmark, Film, UserCheck, AlertCircle } from 'lucide-react';
import { MovieCard } from '@/components/movie/movie-card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function FriendWatchlistPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Завантаження...</p>
      </div>
    }>
      <FriendWatchlistContent />
    </Suspense>
  );
}

function FriendWatchlistContent() {
  const router = useRouter();
  const params = useParams();
  const friendEmail = params.id as string;
  
  console.log('Friend Email from params:', friendEmail);
  
  const { user, isLoading: isAuthLoading } = useAuthStore();
  const { data, isLoading, isError, error, refetch } = useFriendWatchlist(friendEmail);
  
  console.log('useFriendWatchlist result:', { 
    data: data ? { friend: data.friend, watchlistLength: data.watchlist?.length } : null, 
    isLoading, 
    isError, 
    error 
  });
  
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
  
  // Ручне тестування API
  const testApi = async () => {
    try {
      const token = useAuthStore.getState().session?.access_token;
      
      const response = await fetch(`/api/friends/${encodeURIComponent(friendEmail)}/watchlist`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      console.log('API test response:', data);
      alert('Перевірте консоль для деталей відповіді API');
      
      // Оновити дані після тесту
      refetch();
    } catch (error) {
      console.error('API test error:', error);
      alert('Тест API не вдався. Перевірте консоль.');
    }
  };
  
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
        <h1 className="text-2xl font-bold mb-4">Авторизуйтесь для доступу до списку фільмів друга</h1>
        <p className="text-muted-foreground mb-6">Для використання цієї функції необхідно увійти в свій обліковий запис</p>
      </div>
    );
  }
  
  // Якщо сталася помилка при завантаженні
  if (isError) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.push('/friends')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад до списку друзів
        </Button>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>
            {error instanceof Error ? error.message : 'Не вдалося завантажити список фільмів друга'}
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={testApi}>
            Тест API
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <Button variant="outline" onClick={() => router.push('/friends')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад до списку друзів
      </Button>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Завантаження списку фільмів...</p>
        </div>
      ) : data ? (
        <>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                {data.friend?.avatar_url ? (
                  <Image
                    src={data.friend.avatar_url}
                    alt={data.friend?.display_name || data.friend?.email || ''}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span className="text-2xl text-muted-foreground">
                    {(data.friend?.display_name || data.friend?.email || '').substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {data.friend?.display_name || data.friend?.email || 'Друг'}
                </h1>
                {data.friend?.display_name && data.friend?.email && (
                  <p className="text-muted-foreground">{data.friend.email}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-auto">
              <div className="flex items-center text-muted-foreground">
                <UserCheck className="h-4 w-4 mr-1" />
                <span>Друзі</span>
              </div>
              <div className="flex items-center text-muted-foreground ml-4">
                <Film className="h-4 w-4 mr-1" />
                <span>{data.watchlist.length} фільмів у списку</span>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {data.watchlist.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data.watchlist.map((movie) => (
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
              <Bookmark className="h-16 w-16 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Список перегляду порожній</h2>
              <p className="text-muted-foreground max-w-md text-center">
                У цього користувача ще немає фільмів у списку перегляду
              </p>
              <div className="mt-4">
                <Button variant="outline" onClick={testApi}>
                  Тест API
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold mb-2">Дані не знайдено</h2>
          <p className="text-muted-foreground">Не вдалося завантажити інформацію</p>
          <div className="mt-4">
            <Button variant="outline" onClick={testApi}>
              Тест API
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}