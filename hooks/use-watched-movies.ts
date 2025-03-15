// hooks/use-watched-movies.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MovieDetails } from '@/lib/tmdb';
import { useAuthStore } from '@/store/auth-store';

// Функція для безпечного перетворення значення на число
function safeNumberConversion(value: any): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseInt(value, 10) || 0;
  return 0;
}

// Функції для API запитів
const fetchWatchedMovies = async (token: string | null = null): Promise<any[]> => {
  if (!token) return [];
  
  const response = await fetch('/api/watched', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch watched movies');
  }
  
  const data = await response.json();
  
  // Переконуємося, що vote_count є числом
  return data.map((item: any) => ({
    ...item,
    vote_count: safeNumberConversion(item.vote_count)
  }));
};

const markAsWatched = async (movie: MovieDetails, options: { comment?: string, rating?: number } = {}, token: string | null = null) => {
  if (!token) throw new Error('Not authenticated');
  
  // Переконуємося, що vote_count має якесь значення, якщо воно відсутнє
  const vote_count = safeNumberConversion(movie.vote_count);
  
  // Виведемо в консоль дані, які надсилаємо
  console.log("Дані фільму, що позначається як переглянутий:", {
    id: movie.id,
    title: movie.title,
    vote_count: vote_count,
    comment: options.comment,
    rating: options.rating
  });
  
  const response = await fetch('/api/watched', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      release_date: movie.release_date,
      overview: movie.overview,
      vote_average: movie.vote_average,
      vote_count: vote_count,
      comment: options.comment,
      rating: options.rating
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to mark movie as watched');
  }
  
  return response.json();
};

const removeFromWatched = async (movieId: number, token: string | null = null) => {
  if (!token) throw new Error('Not authenticated');
  
  const response = await fetch(`/api/watched/${movieId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to remove from watched movies');
  }
  
  return response.json();
};

const fetchFriendsWhoWatched = async (movieId: number, token: string | null = null) => {
  if (!token) return [];
  
  const response = await fetch(`/api/watched/${movieId}/friends`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch friends who watched');
  }
  
  return response.json();
};

// Хук для роботи з переглянутими фільмами
export function useWatchedMovies() {
  const queryClient = useQueryClient();
  const token = useAuthStore(state => state.session?.access_token);
  const isAuthenticated = useAuthStore(state => !!state.session);
  
  // Запит на отримання списку переглянутих фільмів
  const watchedMoviesQuery = useQuery({
    queryKey: ['watched-movies'],
    queryFn: () => fetchWatchedMovies(token),
    enabled: isAuthenticated,
  });
  
  // Мутація для позначення фільму як переглянутого
  const markAsWatchedMutation = useMutation({
    mutationFn: ({ movie, options }: { movie: MovieDetails, options?: { comment?: string, rating?: number } }) => 
      markAsWatched(movie, options || {}, token),
    onSuccess: () => {
      // Інвалідація кешу після успішного додавання
      queryClient.invalidateQueries({ queryKey: ['watched-movies'] });
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });
  
  // Мутація для видалення фільму зі списку переглянутих
  const removeFromWatchedMutation = useMutation({
    mutationFn: (movieId: number) => removeFromWatched(movieId, token),
    onSuccess: () => {
      // Інвалідація кешу після успішного видалення
      queryClient.invalidateQueries({ queryKey: ['watched-movies'] });
    },
  });
  
  // Перевірка чи фільм у списку переглянутих
  const isWatched = (movieId: number) => {
    if (!watchedMoviesQuery.data) return false;
    return watchedMoviesQuery.data.some(movie => {
      const watchedId = movie.movie_id || movie.id;
      return watchedId === movieId;
    });
  };
  
  return {
    watchedMovies: watchedMoviesQuery.data || [],
    isLoading: watchedMoviesQuery.isLoading,
    isError: watchedMoviesQuery.isError,
    error: watchedMoviesQuery.error,
    isWatched,
    markAsWatched: markAsWatchedMutation.mutate,
    removeFromWatched: removeFromWatchedMutation.mutate,
    isMarking: markAsWatchedMutation.isPending,
    isRemoving: removeFromWatchedMutation.isPending,
    refetch: watchedMoviesQuery.refetch,
    getFriendsWhoWatched: (movieId: number) => {
      return useQuery({
        queryKey: ['friends-who-watched', movieId],
        queryFn: () => fetchFriendsWhoWatched(movieId, token),
        enabled: isAuthenticated && !!movieId,
      });
    }
  };
}