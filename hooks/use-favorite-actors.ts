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
  
  // Query to get the list of favorite actors
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
  
  // Mutation to add an actor to favorites
  const addMutation = useMutation({
    mutationFn: async (actor: Person | PersonDetails) => {
      if (!token) throw new Error('Not authenticated');
      
      // Prepare actor data, handle null values
      const actorData = {
        id: actor.id,
        name: actor.name,
        profile_path: actor.profile_path || null,
        known_for_department: actor.known_for_department || null,
        popularity: actor.popularity !== undefined && actor.popularity !== null 
          ? actor.popularity 
          : null
      };
      
      console.log("Adding actor to favorites:", actorData);
      
      const response = await fetch('/api/favorite-actors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(actorData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add to favorites');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate cache after successful addition
      queryClient.invalidateQueries({ queryKey: ['favorite-actors'] });
    },
  });
  
  // Mutation to remove an actor from favorites
  const removeMutation = useMutation({
    mutationFn: async (actorId: number) => {
      if (!token) throw new Error('Not authenticated');
      
      console.log("Removing actor from favorites:", actorId);
      
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
      // Invalidate cache after successful deletion
      queryClient.invalidateQueries({ queryKey: ['favorite-actors'] });
    },
  });
  
  // Check if an actor is in the favorites list
  const isInFavorites = (actorId: number) => {
    if (!favoriteActorsQuery.data) return false;
    return favoriteActorsQuery.data.some((actor: any) => {
      const favoriteId = actor.actor_id || actor.id;
      return favoriteId === actorId;
    });
  };
  
  // Function to toggle favorite status of an actor
  const toggleFavorite = (actor: Person | PersonDetails) => {
    console.log("Toggle favorite for actor:", actor.id, isInFavorites(actor.id));
    
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