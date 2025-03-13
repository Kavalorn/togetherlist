'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';

// Типи
export type Friend = {
  id: number;
  userId: string;
  friendId: string; // Email замість ID
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
  friend?: {
    id: string; // Email замість ID
    email: string;
    display_name?: string;
    avatar_url?: string;
  };
  direction?: 'incoming' | 'outgoing';
};

export type FriendWatchlist = {
  friend: {
    id: string; // Email замість ID
    email: string;
    display_name?: string;
    avatar_url?: string;
  };
  watchlist: Array<{
    id: number;
    movie_id: number;
    title: string;
    poster_path?: string;
    release_date?: string;
    overview?: string;
    vote_average?: number;
    created_at?: string;
  }>;
};

// Функції для API запитів
const fetchFriends = async (token: string | null = null, status: string = 'accepted'): Promise<Friend[]> => {
  if (!token) return [];
  
  const response = await fetch(`/api/friends?status=${status}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch friends');
  }
  
  return response.json();
};

const addFriend = async (email: string, token: string | null = null) => {
  if (!token) throw new Error('Not authenticated');
  
  const response = await fetch('/api/friends', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ friendEmail: email })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to add friend');
  }
  
  return response.json();
};

const respondToFriendRequest = async (id: number, status: 'accepted' | 'rejected', token: string | null = null) => {
  if (!token) throw new Error('Not authenticated');
  
  const response = await fetch(`/api/friends/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });
  
  if (!response.ok) {
    throw new Error('Failed to respond to friend request');
  }
  
  return response.json();
};

const removeFriend = async (id: number, token: string | null = null) => {
  if (!token) throw new Error('Not authenticated');
  
  const response = await fetch(`/api/friends/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to remove friend');
  }
  
  return response.json();
};

const fetchFriendWatchlist = async (friendEmail: string, token: string | null = null): Promise<FriendWatchlist> => {
  if (!token) throw new Error('Not authenticated');
  
  const response = await fetch(`/api/friends/${encodeURIComponent(friendEmail)}/watchlist`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch friend watchlist');
  }
  
  return response.json();
};

// Хук для роботи з друзями
export function useFriends(status: string = 'accepted') {
  const queryClient = useQueryClient();
  const token = useAuthStore(state => state.session?.access_token);
  const isAuthenticated = useAuthStore(state => !!state.session);
  
  // Запит на отримання списку друзів
  const friendsQuery = useQuery({
    queryKey: ['friends', status],
    queryFn: () => fetchFriends(token, status),
    enabled: isAuthenticated,
  });
  
  // Мутація для додавання друга
  const addMutation = useMutation({
    mutationFn: (email: string) => addFriend(email, token),
    onSuccess: () => {
      // Інвалідація кешу після успішного додавання
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
  
  // Мутація для відповіді на запит дружби
  const respondMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: 'accepted' | 'rejected' }) => 
      respondToFriendRequest(id, status, token),
    onSuccess: () => {
      // Інвалідація кешу після успішної відповіді
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
  
  // Мутація для видалення друга
  const removeMutation = useMutation({
    mutationFn: (id: number) => removeFriend(id, token),
    onSuccess: () => {
      // Інвалідація кешу після успішного видалення
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
  
  return {
    friends: friendsQuery.data || [],
    isLoading: friendsQuery.isLoading,
    isError: friendsQuery.isError,
    error: friendsQuery.error,
    addFriend: addMutation.mutate,
    respondToFriendRequest: respondMutation.mutate,
    removeFriend: removeMutation.mutate,
    isAddingFriend: addMutation.isPending,
    isRespondingToRequest: respondMutation.isPending,
    isRemovingFriend: removeMutation.isPending,
    refetch: friendsQuery.refetch,
  };
}

// Хук для отримання списку перегляду друга
export function useFriendWatchlist(friendEmail: string | null) {
  const token = useAuthStore(state => state.session?.access_token);
  const isAuthenticated = useAuthStore(state => !!state.session);
  
  return useQuery({
    queryKey: ['friend', friendEmail, 'watchlist'],
    queryFn: () => fetchFriendWatchlist(friendEmail!, token),
    enabled: isAuthenticated && !!friendEmail,
  });
}