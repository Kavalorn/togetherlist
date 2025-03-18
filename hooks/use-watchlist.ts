// hooks/use-watchlist.ts
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
  
  console.log("Додавання фільму до списку перегляду:", {
    id: movie.id,
    title: movie.title,
    vote_count: vote_count
  });
  
  const response = await fetch('/api/email-watchlist', {
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
      vote_count: vote_count // Передаємо як число
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Error adding to watchlist: ${errorText}`);
    throw new Error('Failed to add to watchlist');
  }
  
  return response.json();
};

const removeFromWatchlist = async (movieId: number, token: string | null = null) => {
  if (!token) throw new Error('Not authenticated');
  
  console.log(`Видалення фільму зі списку перегляду, ID: ${movieId}`);
  
  const response = await fetch(`/api/email-watchlist/${movieId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  console.log(`Статус відповіді: ${response.status}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Помилка відповіді: ${errorText}`);
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
  
  // Мутація для додавання фільму до списку перегляду
  const addMutation = useMutation({
    mutationFn: (movie: MovieDetails) => addToWatchlist(movie, token),
    onSuccess: () => {
      // Інвалідація кешу після успішного додавання
      queryClient.invalidateQueries({ queryKey: ['email-watchlist'] });
    },
  });
  
  // Мутація для видалення фільму зі списку перегляду
  const removeMutation = useMutation({
    mutationFn: (movieId: number) => removeFromWatchlist(movieId, token),
    onSuccess: () => {
      // Інвалідація кешу після успішного видалення
      queryClient.invalidateQueries({ queryKey: ['email-watchlist'] });
    },
  });
  
  // Перевірка чи фільм у списку перегляду
  const isInWatchlist = (movieId: number) => {
    if (!watchlistQuery.data) return false;
    return watchlistQuery.data.some(movie => {
      const watchlistId = movie.movie_id || movie.id;
      return watchlistId === movieId;
    });
  };
  
  // Функція для переключення фільму у списку перегляду
  const toggleWatchlist = (movie: MovieDetails) => {
    if (isInWatchlist(movie.id)) {
      removeMutation.mutate(movie.id);
    } else {
      addMutation.mutate(movie);
    }
  };
  
  return {
    watchlist: watchlistQuery.data || [],
    isLoading: watchlistQuery.isLoading,
    isError: watchlistQuery.isError,
    error: watchlistQuery.error,
    isInWatchlist,
    toggleWatchlist,
    addToWatchlist: addMutation.mutate,
    removeFromWatchlist: removeMutation.mutate,
    isAddingToWatchlist: addMutation.isPending,
    isRemovingFromWatchlist: removeMutation.isPending,
    refetch: watchlistQuery.refetch,
  };
}