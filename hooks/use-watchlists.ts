// hooks/use-watchlists.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { MovieDetails } from '@/lib/tmdb';

// Типи для списків перегляду
export interface Watchlist {
  id: number;
  name: string;
  description: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  color: string;
  icon: string;
  sortOrder: number;
  movies?: WatchlistMovie[];
}

export interface WatchlistMovie {
  id: number;
  movie_id: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  overview: string | null;
  vote_average: number | null;
  vote_count: number | null;
  created_at: string;
  notes: string | null;
  priority: number;
}

// Функція для безпечного перетворення значення на число
function safeNumberConversion(value: any): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseInt(value, 10) || 0;
  return 0;
}

// Функція для отримання списків перегляду
const fetchWatchlists = async (token: string | null = null): Promise<Watchlist[]> => {
  if (!token) return [];
  
  console.log('Отримання списків перегляду');
  
  const response = await fetch('/api/watchlists', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Помилка отримання списків перегляду: ${errorText}`);
    throw new Error('Failed to fetch watchlists');
  }
  
  const data = await response.json();
  console.log(`Отримано ${data.length} списків перегляду`);
  return data;
};

// Функція для отримання деталей списку з фільмами
const fetchWatchlistDetails = async (watchlistId: number, token: string | null = null): Promise<Watchlist> => {
  if (!token) throw new Error('Not authenticated');
  
  console.log(`Отримання деталей списку ${watchlistId}`);
  
  const response = await fetch(`/api/watchlists/${watchlistId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Помилка отримання деталей списку: ${errorText}`);
    throw new Error('Failed to fetch watchlist details');
  }
  
  const data = await response.json();
  console.log(`Отримано деталі списку ${watchlistId} із ${data.movies?.length || 0} фільмами`);
  return data;
};

// Функція для створення нового списку
const createWatchlist = async (data: { name: string; description?: string; color?: string; icon?: string }, token: string | null = null) => {
  if (!token) throw new Error('Not authenticated');
  
  console.log(`Створення нового списку "${data.name}"`);
  
  const response = await fetch('/api/watchlists', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    console.error(`Помилка створення списку: ${JSON.stringify(errorData)}`);
    throw new Error(errorData.error || 'Failed to create watchlist');
  }
  
  const result = await response.json();
  console.log(`Список створено з ID ${result.id}`);
  return result;
};

// Функція для оновлення списку
const updateWatchlist = async (
  { id, data }: { 
    id: number; 
    data: { name?: string; description?: string; color?: string; icon?: string; sortOrder?: number }
  }, 
  token: string | null = null
) => {
  if (!token) throw new Error('Not authenticated');
  
  console.log(`Оновлення списку ${id}`);
  
  const response = await fetch(`/api/watchlists/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    console.error(`Помилка оновлення списку: ${JSON.stringify(errorData)}`);
    throw new Error(errorData.error || 'Failed to update watchlist');
  }
  
  const result = await response.json();
  console.log(`Список ${id} оновлено`);
  return result;
};

// Функція для видалення списку
const deleteWatchlist = async (id: number, token: string | null = null) => {
  if (!token) throw new Error('Not authenticated');
  
  console.log(`Видалення списку ${id}`);
  
  const response = await fetch(`/api/watchlists/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    console.error(`Помилка видалення списку: ${JSON.stringify(errorData)}`);
    throw new Error(errorData.error || 'Failed to delete watchlist');
  }
  
  const result = await response.json();
  console.log(`Список ${id} видалено`);
  return result;
};

// Функція для додавання фільму до списку
const addMovieToWatchlist = async (
  { watchlistId, movie }: { watchlistId: number; movie: MovieDetails & { notes?: string; priority?: number } }, 
  token: string | null = null
) => {
  if (!token) throw new Error('Not authenticated');
  
  // Переконуємося, що vote_count має значення
  const vote_count = safeNumberConversion(movie.vote_count);
  
  console.log(`Додавання фільму ${movie.id} до списку ${watchlistId}`);
  
  const response = await fetch(`/api/watchlists/${watchlistId}/movies`, {
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
      notes: movie.notes,
      priority: movie.priority
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Помилка додавання фільму до списку: ${errorText}`);
    throw new Error('Failed to add movie to watchlist');
  }
  
  const result = await response.json();
  console.log(`Фільм ${movie.id} додано до списку ${watchlistId}`);
  return result;
};

// Функція для видалення фільму зі списку
const removeMovieFromWatchlist = async (
  { watchlistId, movieId }: { watchlistId: number; movieId: number }, 
  token: string | null = null
) => {
  if (!token) throw new Error('Not authenticated');
  
  console.log(`Видалення фільму ${movieId} зі списку ${watchlistId}`);
  
  const response = await fetch(`/api/watchlists/${watchlistId}/movies/${movieId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Помилка видалення фільму зі списку: ${errorText}`);
    throw new Error('Failed to remove movie from watchlist');
  }
  
  const result = await response.json();
  console.log(`Фільм ${movieId} видалено зі списку ${watchlistId}`);
  return result;
};

// Функція для оновлення деталей фільму в списку
const updateMovieInWatchlist = async (
  { watchlistId, movieId, data }: { watchlistId: number; movieId: number; data: { notes?: string; priority?: number } }, 
  token: string | null = null
) => {
  if (!token) throw new Error('Not authenticated');
  
  console.log(`Оновлення фільму ${movieId} у списку ${watchlistId}`);
  
  const response = await fetch(`/api/watchlists/${watchlistId}/movies/${movieId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Помилка оновлення фільму у списку: ${errorText}`);
    throw new Error('Failed to update movie details');
  }
  
  const result = await response.json();
  console.log(`Фільм ${movieId} оновлено у списку ${watchlistId}`);
  return result;
};

// Функція для міграції фільмів зі старого списку
const migrateWatchlist = async (token: string | null = null) => {
  if (!token) throw new Error('Not authenticated');
  
  console.log('Початок міграції списку');
  
  const response = await fetch(`/api/migrate-watchlist`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Помилка міграції списку: ${errorText}`);
    throw new Error('Failed to migrate watchlist');
  }
  
  const result = await response.json();
  console.log(`Міграцію завершено, перенесено ${result.stats?.migratedMovies || 0} фільмів`);
  return result;
};

// Хук для роботи зі списками перегляду
export function useWatchlists() {
  const queryClient = useQueryClient();
  const token = useAuthStore(state => state.session?.access_token);
  const isAuthenticated = useAuthStore(state => !!state.session);
  
  // Запит на отримання всіх списків перегляду
  const watchlistsQuery = useQuery({
    queryKey: ['watchlists'],
    queryFn: () => fetchWatchlists(token),
    enabled: isAuthenticated,
  });
  
  // Мутація для створення нового списку
  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; color?: string; icon?: string }) => 
      createWatchlist(data, token),
    onSuccess: () => {
      // Інвалідація кешу після успішного створення
      queryClient.invalidateQueries({ queryKey: ['watchlists'] });
    },
  });
  
  // Мутація для оновлення списку
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { 
      id: number; 
      data: { name?: string; description?: string; color?: string; icon?: string; sortOrder?: number } 
    }) => updateWatchlist({ id, data }, token),
    onSuccess: (_, variables) => {
      // Інвалідація кешу після успішного оновлення
      queryClient.invalidateQueries({ queryKey: ['watchlists'] });
      queryClient.invalidateQueries({ queryKey: ['watchlist', variables.id] });
    },
  });
  
  // Мутація для видалення списку
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteWatchlist(id, token),
    onSuccess: () => {
      const defaultWatchlist = getDefaultWatchlist();
      // Інвалідація кешу після успішного видалення
      queryClient.invalidateQueries({ queryKey: ['watchlists'] });
      queryClient.invalidateQueries({ queryKey: ['watchlist', defaultWatchlist?.id] }); // Unsorted watchlist
    },
  });
  
  // Мутація для міграції фільмів
  const migrateMutation = useMutation({
    mutationFn: () => migrateWatchlist(token),
    onSuccess: () => {
      // Інвалідація кешу після успішної міграції
      queryClient.invalidateQueries({ queryKey: ['watchlists'] });
    },
  });
  
  // Функція для перевірки, чи існує список за замовчуванням
  const hasDefaultWatchlist = (): boolean => {
    if (!watchlistsQuery.data) return false;
    return watchlistsQuery.data.some(list => list.isDefault);
  };
  
  // Функція для отримання списку за замовчуванням
  const getDefaultWatchlist = (): Watchlist | undefined => {
    if (!watchlistsQuery.data) return undefined;
    return watchlistsQuery.data.find(list => list.isDefault);
  };
  
  return {
    watchlists: watchlistsQuery.data || [],
    isLoading: watchlistsQuery.isLoading,
    isError: watchlistsQuery.isError,
    error: watchlistsQuery.error,
    
    createWatchlist: createMutation.mutate,
    updateWatchlist: updateMutation.mutate,
    deleteWatchlist: deleteMutation.mutate,
    migrateWatchlist: migrateMutation.mutate,
    
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isMigrating: migrateMutation.isPending,
    
    hasDefaultWatchlist,
    getDefaultWatchlist,
    
    refetch: watchlistsQuery.refetch
  };
}

// Хук для роботи з конкретним списком перегляду та його фільмами
export function useWatchlistDetails(watchlistId: number | null) {
  const queryClient = useQueryClient();
  const token = useAuthStore(state => state.session?.access_token);
  const isAuthenticated = useAuthStore(state => !!state.session);
  
  // Запит на отримання деталей списку з фільмами
  const watchlistQuery = useQuery({
    queryKey: ['watchlist', watchlistId],
    queryFn: () => fetchWatchlistDetails(watchlistId!, token),
    enabled: isAuthenticated && watchlistId !== null,
  });
  
  // Мутація для додавання фільму до списку
  const addMovieMutation = useMutation({
    mutationFn: (movie: MovieDetails & { notes?: string; priority?: number }) => 
      addMovieToWatchlist({ watchlistId: watchlistId!, movie }, token),
    onSuccess: () => {
      // Інвалідація кешу після успішного додавання
      queryClient.invalidateQueries({ queryKey: ['watchlist', watchlistId] });
    },
  });
  
  // Мутація для видалення фільму зі списку
  const removeMovieMutation = useMutation({
    mutationFn: (movieId: number) => 
      removeMovieFromWatchlist({ watchlistId: watchlistId!, movieId }, token),
    onSuccess: () => {
      // Інвалідація кешу після успішного видалення
      queryClient.invalidateQueries({ queryKey: ['watchlist', watchlistId] });
    },
  });
  
  // Мутація для оновлення деталей фільму
  const updateMovieMutation = useMutation({
    mutationFn: ({ movieId, data }: { movieId: number; data: { notes?: string; priority?: number } }) => 
      updateMovieInWatchlist({ watchlistId: watchlistId!, movieId, data }, token),
    onSuccess: () => {
      // Інвалідація кешу після успішного оновлення
      queryClient.invalidateQueries({ queryKey: ['watchlist', watchlistId] });
    },
  });
  
  // Перевірка, чи фільм є в списку
  const isMovieInWatchlist = (movieId: number): boolean => {
    if (!watchlistQuery.data?.movies) return false;
    return watchlistQuery.data.movies.some(movie => movie.movie_id === movieId);
  };
  
  // Функція для отримання фільму зі списку за ID
  const getMovieById = (movieId: number): WatchlistMovie | undefined => {
    if (!watchlistQuery.data?.movies) return undefined;
    return watchlistQuery.data.movies.find(movie => movie.movie_id === movieId);
  };
  
  return {
    watchlist: watchlistQuery.data,
    movies: watchlistQuery.data?.movies || [],
    isLoading: watchlistQuery.isLoading,
    isError: watchlistQuery.isError,
    error: watchlistQuery.error,
    
    addMovie: addMovieMutation.mutate,
    removeMovie: removeMovieMutation.mutate,
    updateMovie: updateMovieMutation.mutate,
    
    isAddingMovie: addMovieMutation.isPending,
    isRemovingMovie: removeMovieMutation.isPending,
    isUpdatingMovie: updateMovieMutation.isPending,
    
    isMovieInWatchlist,
    getMovieById,
    
    refetch: watchlistQuery.refetch
  };
}