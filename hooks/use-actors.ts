'use client';

import { useQuery } from '@tanstack/react-query';
import { Person } from '@/lib/tmdb';

// Хук для пошуку акторів
export function useSearchActors(query: string, page = 1) {
  return useQuery({
    queryKey: ['actors', 'search', query, page],
    queryFn: async () => {
      if (!query || query.length < 2) {
        return { results: [], total_results: 0, total_pages: 0 };
      }
      
      const response = await fetch(`/api/actors/search?query=${encodeURIComponent(query)}&page=${page}`);
      
      if (!response.ok) {
        throw new Error('Failed to search actors');
      }
      
      return response.json();
    },
    enabled: query.length > 1, // Виконувати запит тільки якщо довжина запиту > 1 символів
    staleTime: 10 * 60 * 1000, // 10 хвилин
  });
}

// Хук для отримання популярних акторів
export function usePopularActors(page = 1) {
  return useQuery({
    queryKey: ['actors', 'popular', page],
    queryFn: async () => {
      const response = await fetch(`/api/actors/popular?page=${page}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch popular actors');
      }
      
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 хвилин
  });
}