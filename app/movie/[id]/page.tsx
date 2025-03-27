'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useMovieDetails } from '@/hooks/use-movies';
import { MovieContent } from '@/components/movie/movie-content';
import { Button } from '@/components/ui/button';

export default function MoviePage() {
  const params = useParams();
  const router = useRouter();
  
  // Получаем ID фильма из URL
  const movieId = params.id ? parseInt(params.id as string, 10) : null;
  
  // Загружаем данные о фильме
  const { data: movieDetails, isLoading, isError } = useMovieDetails(movieId);
  
  // Обрабатываем ошибку
  if (isError || (!isLoading && !movieDetails)) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="flex flex-col items-center text-center space-y-4">
          <h1 className="text-2xl font-bold">Фільм не знайдено</h1>
          <p className="text-muted-foreground">Вибачте, але вказаний фільм не існує або був видалений.</p>
          <Button onClick={() => router.push('/')}>На головну сторінку</Button>
        </div>
      </div>
    );
  }
  
  // Если загрузка - показываем индикатор
  if (isLoading) {
    return (
      <div className="container mx-auto py-12 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Завантаження інформації про фільм...</p>
        </div>
      </div>
    );
  }
  
  // Имя для метатегов
  const title = movieDetails?.title || 'Фільм';
  const description = movieDetails?.overview 
    ? movieDetails.overview.substring(0, 160) + (movieDetails.overview.length > 160 ? '...' : '')
    : 'Детальна інформація про фільм на WatchPick';
  
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Используем общий компонент MovieContent */}
      <MovieContent movie={movieDetails} />
    </div>
  );
}