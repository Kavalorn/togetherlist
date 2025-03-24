// hooks/use-llm-movie-recommendations.ts
'use client';

import { useState } from 'react';
import { MovieDetails, Movie } from '@/lib/tmdb';
import { useUIStore } from '@/store/ui-store';

// Моделі для рекомендацій фільмів
export const LLM_MODELS = [
    { id: 'mistralai/Mistral-7B-Instruct-v0.2', name: 'Mistral-7B' },
    { id: 'google/flan-t5-xl', name: 'Flan-T5 XL' },
    { id: 'google/flan-t5-xxl', name: 'Flan-T5 XXL' },
    { id: 'microsoft/phi-2', name: 'Phi-2' },
    { id: 'TheBloke/Wizard-Vicuna-7B-Uncensored-HF', name: 'Wizard Vicuna 7B' },
    { id: 'stabilityai/stablelm-base-alpha-7b', name: 'StableLM 7B' },
    { id: 'Salesforce/blip-image-captioning-large', name: 'BLIP (для аналізу постерів)' }
  ];


// Типи для рекомендацій
export interface MovieRecommendation {
  title: string;
  year?: string;
  tmdbMovie?: Movie;
  notFound?: boolean;
}

export function useLLMMovieRecommendations() {
  const [recommendations, setRecommendations] = useState<MovieRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(LLM_MODELS[0].id);
  
  // Отримання рекомендацій на основі поточного фільму
  const getRecommendations = async (movie: MovieDetails) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Формуємо запит до моделі
      const prompt = createRecommendationPrompt(movie);
      
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
          genres: movie.genres?.map(g => g.name)
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
  const createRecommendationPrompt = (movie: MovieDetails): string => {
    const genresText = movie.genres?.map(g => g.name).join(', ') || '';
    
    return `recommend only 3 films, similar to "${movie.title}" (${movie.release_date?.substring(0, 4) || 'unknown year'}).
    
genre: ${genresText}
description: ${movie.overview || 'no description'}

response fromat - three rows with movie title and year:
1. "movie name" (year)
2. "movie name" (year)
3. "movie name" (year)

there shouldnt be anything except this three rows in the response. no new lines, no extra spaces. strictly follow the format. only real movie names and years are allowed.
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