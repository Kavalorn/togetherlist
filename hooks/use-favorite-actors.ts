// hooks/use-favorite-actors.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Person, PersonDetails } from '@/lib/tmdb';
import { useAuthStore } from '@/store/auth-store';

// Хук для роботи з улюбленими акторами
export function useFavoriteActors() {
  const queryClient = useQueryClient();
  const token = useAuthStore(state => state.session?.access_token);
  const isAuthenticated = useAuthStore(state => !!state.session);
  
  // Запит на отримання списку улюблених акторів
  const favoriteActorsQuery = useQuery({
    queryKey: ['favorite-actors'],
    queryFn: async () => {
      if (!token) return [];
      
      const response = await fetch('/api/favorite-actors', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch favorite actors');
      }
      
      return response.json();
    },
    enabled: isAuthenticated,
  });
  
  // Мутація для додавання актора до улюблених
  const addMutation = useMutation({
    mutationFn: async (actor: Person | PersonDetails) => {
      if (!token) throw new Error('Not authenticated');
      
      // Підготовка даних актора, обробка null значень
      const actorData = {
        id: actor.id,
        name: actor.name,
        profile_path: actor.profile_path || null,
        known_for_department: actor.known_for_department || null,
        popularity: actor.popularity !== undefined && actor.popularity !== null 
          ? actor.popularity 
          : null
      };
      
      const response = await fetch('/api/favorite-actors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(actorData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to add to favorites');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Інвалідація кешу після успішного додавання
      queryClient.invalidateQueries({ queryKey: ['favorite-actors'] });
    },
  });
  
  // Мутація для видалення актора з улюблених
  const removeMutation = useMutation({
    mutationFn: async (actorId: number) => {
      if (!token) throw new Error('Not authenticated');
      
      const response = await fetch(`/api/favorite-actors/${actorId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove from favorites');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Інвалідація кешу після успішного видалення
      queryClient.invalidateQueries({ queryKey: ['favorite-actors'] });
    },
  });
  
  // Перевірка чи актор у списку улюблених
  const isInFavorites = (actorId: number) => {
    if (!favoriteActorsQuery.data) return false;
    return favoriteActorsQuery.data.some((actor: any) => {
      const favoriteId = actor.actor_id || actor.id;
      return favoriteId === actorId;
    });
  };
  
  // Функція для переключення статусу улюбленого актора
  const toggleFavorite = (actor: Person | PersonDetails) => {
    if (isInFavorites(actor.id)) {
      removeMutation.mutate(actor.id);
    } else {
      addMutation.mutate(actor);
    }
  };
  
  return {
    favoriteActors: favoriteActorsQuery.data || [],
    isLoading: favoriteActorsQuery.isLoading,
    isError: favoriteActorsQuery.isError,
    error: favoriteActorsQuery.error,
    isInFavorites,
    toggleFavorite,
    addToFavorites: addMutation.mutate,
    removeFromFavorites: removeMutation.mutate,
    isAddingToFavorites: addMutation.isPending,
    isRemovingFromFavorites: removeMutation.isPending,
    refetch: favoriteActorsQuery.refetch,
  };
}