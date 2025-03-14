// hooks/use-watchlist.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MovieDetails } from '@/lib/tmdb';
import { useAuthStore } from '@/store/auth-store';
import { useMovieDetails } from '@/hooks/use-movies'; // додаємо імпорт для отримання повних деталей фільму

// Функції для API запитів
const fetchWatchlist = async (token: string | null = null): Promise<any[]> => {
  if (!token) return [];
  
  const response = await fetch('/api/watchlist', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch watchlist');
  }
  
  return response.json();
};

const addToWatchlist = async (movie: MovieDetails, token: string | null = null) => {
  if (!token) throw new Error('Not authenticated');
  
  const response = await fetch('/api/watchlist', {
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
      vote_count: movie.vote_count // Додаємо кількість голосів
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to add to watchlist');
  }
  
  return response.json();
};

const removeFromWatchlist = async (movieId: number, token: string | null = null) => {
  if (!token) throw new Error('Not authenticated');
  
  const response = await fetch(`/api/watchlist/${movieId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to remove from watchlist');
  }
  
  return response.json();
};

// Хук для роботи зі списком перегляду
export function useWatchlist() {
  const queryClient = useQueryClient();
  const token = useAuthStore(state => state.session?.access_token);
  const isAuthenticated = useAuthStore(state => !!state.session);
  
  // Запит на отримання списку перегляду
  const watchlistQuery = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => fetchWatchlist(token),
    enabled: isAuthenticated,
  });
  
  // Мутація для додавання фільму до списку перегляду
  const addMutation = useMutation({
    mutationFn: (movie: MovieDetails) => addToWatchlist(movie, token),
    onSuccess: () => {
      // Інвалідація кешу після успішного додавання
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });
  
  // Мутація для видалення фільму зі списку перегляду
  const removeMutation = useMutation({
    mutationFn: (movieId: number) => removeFromWatchlist(movieId, token),
    onSuccess: () => {
      // Інвалідація кешу після успішного видалення
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });
  
  // Перевірка чи фільм у списку перегляду
  const isInWatchlist = (movieId: number) => {
    if (!watchlistQuery.data) return false;
    return watchlistQuery.data.some(movie => {
      // Перевірка різних можливих імен полів ID
      const watchlistId = movie.movie_id || movie.id;
      return watchlistId === movieId;
    });
  };
  
  // Функція для переключення фільму у списку перегляду з отриманням більш повних даних
  const toggleWatchlist = async (movie: MovieDetails) => {
    if (isInWatchlist(movie.id)) {
      removeMutation.mutate(movie.id);
    } else {
      try {
        // Якщо vote_count відсутній, спробуємо отримати повні дані фільму
        if (movie.vote_count === undefined || movie.vote_count === null) {
          const response = await fetch(`/api/movies/${movie.id}`);
          if (response.ok) {
            const fullMovieData = await response.json();
            addMutation.mutate({
              ...movie,
              vote_count: fullMovieData.vote_count || 0
            });
            return;
          }
        }
        // Якщо неможливо отримати додаткові дані або вони вже є
        addMutation.mutate(movie);
      } catch (error) {
        console.error('Помилка при отриманні повних даних фільму:', error);
        // Додаємо фільм як є, якщо сталася помилка
        addMutation.mutate(movie);
      }
    }
  };
  
  // Отримання повних даних фільмів для списку перегляду
  const watchlistWithFullData = watchlistQuery.data || [];
  
  return {
    watchlist: watchlistWithFullData,
    isLoading: watchlistQuery.isLoading,
    isError: watchlistQuery.isError,
    error: watchlistQuery.error,
    isInWatchlist,
    toggleWatchlist,
    isAddingToWatchlist: addMutation.isPending,
    isRemovingFromWatchlist: removeMutation.isPending,
    refetch: watchlistQuery.refetch,
  };
}