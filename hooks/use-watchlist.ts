// hooks/use-watchlist.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MovieDetails } from '@/lib/tmdb';
import { useAuthStore } from '@/store/auth-store';
import { useMovieDetails } from '@/hooks/use-movies';
import { useWatchedMovies } from '@/hooks/use-watched-movies';

// Функція для безпечного перетворення значення на число
function safeNumberConversion(value: any): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseInt(value, 10) || 0;
  return 0;
}

// Функції для API запитів
const fetchWatchlist = async (token: string | null = null): Promise<any[]> => {
  if (!token) return [];
  
  const response = await fetch('/api/email-watchlist', {
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
  
  // Переконуємося, що vote_count має якесь значення, якщо воно відсутнє
  const vote_count = safeNumberConversion(movie.vote_count);
  
  // Виведемо в консоль дані, які надсилаємо
  console.log("Дані фільму, що надсилаються до API:", {
    id: movie.id,
    title: movie.title,
    vote_count: vote_count
  });
  
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
      vote_count: vote_count // Явно передаємо vote_count як число
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to add to watchlist');
  }
  
  return response.json();
};

const removeFromWatchlist = async (movieId: number, token: string | null = null) => {
  if (!token) throw new Error('Not authenticated');
  
  console.log(`Attempting to remove movie from watchlist, ID: ${movieId}`);
  
  const response = await fetch(`/api/email-watchlist/${movieId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  console.log(`Response status: ${response.status}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Error response: ${errorText}`);
    throw new Error(`Failed to remove from watchlist: ${response.status}`);
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
    queryKey: ['email-watchlist'],
    queryFn: () => fetchWatchlist(token),
    enabled: isAuthenticated,
  });
  
  // Мутація для видалення фільму зі списку перегляду
  const removeMutation = useMutation({
    mutationFn: (movieId: number) => removeFromWatchlist(movieId, token),
    onSuccess: () => {
      // Інвалідація кешу після успішного видалення
      queryClient.invalidateQueries({ queryKey: ['email-watchlist'] });
    },
  });
  
  // Функція перевірки чи фільм у списку перегляду
  const isInWatchlist = (movieId: number) => {
    if (!watchlistQuery.data) return false;
    return watchlistQuery.data.some(movie => {
      const watchlistId = movie.movie_id || movie.id;
      return watchlistId === movieId;
    });
  };
  
  return {
    watchlist: watchlistQuery.data || [],
    isLoading: watchlistQuery.isLoading,
    isError: watchlistQuery.isError,
    error: watchlistQuery.error,
    isInWatchlist,
    removeFromWatchlist: removeMutation.mutate,
    isRemovingFromWatchlist: removeMutation.isPending,
    refetch: watchlistQuery.refetch,
  };
}