import { useState, useEffect } from 'react';
import { MovieVideo } from '@/lib/tmdb';

export function useMovieTrailer(movieId: number | null) {
  const [hasTrailer, setHasTrailer] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!movieId) {
      setHasTrailer(false);
      return;
    }

    const checkTrailer = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/movies/${movieId}/videos`);
        if (!response.ok) {
          throw new Error('Не вдалося перевірити наявність трейлерів');
        }
        
        const data = await response.json();
        
        // Перевіряємо наявність трейлерів на YouTube
        const youtubeTrailers = data.results.filter(
          (video: MovieVideo) => 
            video.site === 'YouTube' && 
            (video.type === 'Trailer' || video.type === 'Teaser')
        );
        
        setHasTrailer(youtubeTrailers.length > 0);
      } catch (error) {
        console.error('Помилка при перевірці трейлерів:', error);
        setError('Не вдалося перевірити наявність трейлерів');
        setHasTrailer(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkTrailer();
  }, [movieId]);

  return { hasTrailer, isLoading, error };
}