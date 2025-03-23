// hooks/use-llm-movie-recommendations.ts
'use client';

import { useState } from 'react';
import { MovieDetails, Movie } from '@/lib/tmdb';
import { useUIStore } from '@/store/ui-store';

// Доступні LLM моделі для рекомендацій
export const LLM_MODELS = [
  { id: 'facebook/bart-large-cnn', name: 'BART Large CNN' },
  { id: 'google/flan-t5-xxl', name: 'Flan-T5 XXL' },
  { id: 'mistralai/Mistral-7B-Instruct-v0.2', name: 'Mistral-7B' },
  { id: 'meta-llama/Llama-2-70b-chat-hf', name: 'Llama 2 70B' },
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
    
    return `Порекомендуй лише 3 фільми, схожих на "${movie.title}" (${movie.release_date?.substring(0, 4) || 'невідомий рік'}).
    
Жанри фільму: ${genresText}
Опис фільму: ${movie.overview || 'опис відсутній'}

Формат відповіді - просто 3 рядки з назвами і роками:
1. "Назва фільму" (Рік)
2. "Назва фільму" (Рік)
3. "Назва фільму" (Рік)

Потрібно вказати лише 3 найбільш релевантних фільми. Без опису і причин.`;
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