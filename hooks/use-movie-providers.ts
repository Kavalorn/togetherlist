// hooks/use-movie-providers.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { MovieProviders, CountryProviders } from '@/lib/tmdb';

// Список пріоритетних країн у порядку переваги
const PRIORITY_COUNTRIES = ['UA', 'PL', 'US', 'GB', 'DE'];

export function useMovieProviders(movieId: number | null) {
  // Використовуємо enabled, щоб завантажувати дані тільки якщо movieId не null
  // Це дозволяє відкласти завантаження даних до моменту відкриття випадайки
  const { data, isLoading, error } = useQuery({
    queryKey: ['movie', movieId, 'providers'],
    queryFn: async () => {
      if (!movieId) return null;
      
      console.log(`Завантаження провайдерів для фільму ID:${movieId}`);
      const response = await fetch(`/api/movies/${movieId}/providers`);
      if (!response.ok) {
        throw new Error('Не вдалося отримати провайдерів');
      }
      
      return response.json() as Promise<MovieProviders>;
    },
    enabled: !!movieId, // Запит виконується тільки якщо movieId присутній
    staleTime: 1000 * 60 * 10, // Кешуємо результат на 10 хвилин
  });
  
  // Функція для отримання найбільш релевантної країни
  const getBestCountry = (): { countryCode: string, providers: CountryProviders } | null => {
    if (!data || !data.results || Object.keys(data.results).length === 0) {
      return null;
    }
    
    // Шукаємо першу доступну країну за пріоритетом
    for (const country of PRIORITY_COUNTRIES) {
      if (data.results[country]) {
        return { 
          countryCode: country, 
          providers: data.results[country] 
        };
      }
    }
    
    // Якщо жодна з пріоритетних країн не знайдена, беремо першу доступну
    const firstCountryCode = Object.keys(data.results)[0];
    return { 
      countryCode: firstCountryCode, 
      providers: data.results[firstCountryCode] 
    };
  };
  
  // Отримуємо всі доступні країни
  const getAvailableCountries = (): string[] => {
    if (!data || !data.results) return [];
    
    // Сортуємо країни: спочатку пріоритетні, потім інші в алфавітному порядку
    return Object.keys(data.results).sort((a, b) => {
      const aPriority = PRIORITY_COUNTRIES.indexOf(a);
      const bPriority = PRIORITY_COUNTRIES.indexOf(b);
      
      // Якщо обидві країни у списку пріоритетних
      if (aPriority !== -1 && bPriority !== -1) {
        return aPriority - bPriority;
      }
      
      // Якщо тільки одна країна у списку пріоритетних
      if (aPriority !== -1) return -1;
      if (bPriority !== -1) return 1;
      
      // Інакше сортуємо алфавітно
      return a.localeCompare(b);
    });
  };
  
  return {
    providers: data,
    isLoading,
    error,
    bestCountry: getBestCountry(),
    availableCountries: getAvailableCountries(),
  };
}