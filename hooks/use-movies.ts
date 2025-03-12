'use client';

import { useQuery } from '@tanstack/react-query';
import { 
  tmdbApi, 
  Movie, 
  MovieDetails, 
  MovieCredits, 
  MovieImages,
  PersonDetails,
  PersonMovieCredits 
} from '@/lib/tmdb';

// Хук для пошуку фільмів
export function useSearchMovies(query: string, page = 1) {
  return useQuery({
    queryKey: ['movies', 'search', query, page],
    queryFn: () => tmdbApi.searchMovies(query, page),
    enabled: query.length > 2, // Виконувати запит тільки якщо довжина запиту > 2 символів
    staleTime: 10 * 60 * 1000, // 10 хвилин
  });
}

// Хук для отримання деталей фільму
export function useMovieDetails(movieId: number | null) {
  return useQuery({
    queryKey: ['movie', movieId],
    queryFn: () => (movieId ? tmdbApi.getMovieDetails(movieId) : Promise.reject('No movie ID')),
    enabled: !!movieId, // Виконувати запит тільки якщо є ID фільму
  });
}

// Хук для отримання акторського складу фільму
export function useMovieCredits(movieId: number | null) {
  return useQuery({
    queryKey: ['movie', movieId, 'credits'],
    queryFn: () => (movieId ? tmdbApi.getMovieCredits(movieId) : Promise.reject('No movie ID')),
    enabled: !!movieId,
  });
}

// Хук для отримання зображень фільму
export function useMovieImages(movieId: number | null) {
  return useQuery({
    queryKey: ['movie', movieId, 'images'],
    queryFn: () => (movieId ? tmdbApi.getMovieImages(movieId) : Promise.reject('No movie ID')),
    enabled: !!movieId,
  });
}

// Хук для отримання деталей актора
export function usePersonDetails(personId: number | null) {
  return useQuery({
    queryKey: ['person', personId],
    queryFn: () => (personId ? tmdbApi.getPersonDetails(personId) : Promise.reject('No person ID')),
    enabled: !!personId,
  });
}

// Хук для отримання фільмографії актора
export function usePersonMovieCredits(personId: number | null) {
  return useQuery({
    queryKey: ['person', personId, 'movie_credits'],
    queryFn: () => (personId ? tmdbApi.getPersonMovieCredits(personId) : Promise.reject('No person ID')),
    enabled: !!personId,
  });
}

// Хук для отримання популярних фільмів
export function usePopularMovies(page = 1) {
  return useQuery({
    queryKey: ['movies', 'popular', page],
    queryFn: () => tmdbApi.getPopularMovies(page),
  });
}

// Хук для отримання фільмів у прокаті
export function useNowPlayingMovies(page = 1) {
  return useQuery({
    queryKey: ['movies', 'now_playing', page],
    queryFn: () => tmdbApi.getNowPlayingMovies(page),
  });
}