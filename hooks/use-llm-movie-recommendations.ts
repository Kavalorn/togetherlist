// hooks/use-llm-movie-recommendations.ts
'use client';

import { useState } from 'react';
import { MovieDetails, Movie } from '@/lib/tmdb';

// Моделі для рекомендацій фільмів
export const LLM_MODELS = [
    { id: 'mistralai/Mistral-7B-Instruct-v0.2', name: 'Mistral-7B' },
];

// Типи для рекомендацій
export interface MovieRecommendation {
  title: string;
  year?: string;
  description?: string;
  reasons?: string[];
  tmdbMovie?: Movie;
  notFound?: boolean;
}

export function useLLMMovieRecommendations() {
  const [recommendations, setRecommendations] = useState<MovieRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(LLM_MODELS[0].id);
  
  // Отримання рекомендацій на основі поточного фільму
  const getRecommendations = async (movie: MovieDetails, excludedTitles: string[] = []) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Формуємо запит до моделі
      const prompt = createRecommendationPrompt(movie, excludedTitles);
      
      // Виконуємо запит до API
      const response = await fetch('/api/llm/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          prompt,
          movieId: movie.id,
          movieTitle: movie.title,
          genres: movie.genres?.map(g => g.name),
          excludedTitles
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Помилка при отриманні рекомендацій');
      }
      
      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (err) {
      console.error('Помилка при отриманні рекомендацій:', err);
      setError(err instanceof Error ? err.message : 'Невідома помилка');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Створення промпту для моделі
  const createRecommendationPrompt = (movie: MovieDetails, excludedTitles: string[] = []): string => {
    const genresText = movie.genres?.map(g => g.name).join(', ') || '';
    const excludeList = excludedTitles.length > 0 
      ? `\n\nDO NOT recommend any of these films: ${excludedTitles.join(', ')}`
      : '';
    
    return `recommend only 3 films, similar to "${movie.title}" (${movie.release_date?.substring(0, 4) || 'unknown year'}).
    
genre: ${genresText}
description: ${movie.overview || 'no description'}${excludeList}

response fromat - three rows with movie title and year:
{"movie name" (year)}
{"movie name" (year)}
{"movie name" (year)}

there shouldnt be anything except this three rows in the response. no new lines, no extra spaces. strictly follow the format. only real movie names and years are allowed. limit yourself EXCLUSIVELY to real, verified film names and years. Never invent the names of films, the years of their release.
`;
  };
  
  return {
    recommendations,
    isLoading,
    error,
    getRecommendations,
    selectedModel,
    setSelectedModel,
    models: LLM_MODELS
  };
}