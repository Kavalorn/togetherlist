// components/movie/movie-card-for-swiper.tsx
'use client';

import Image from 'next/image';
import { Star, Eye } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Movie } from '@/lib/tmdb';

// Функція для безпечного перетворення значення на число
function safeNumberConversion(value: any): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseInt(value, 10) || 0;
  return 0;
}

// Функція для форматування дати
function formatYear(dateString: string) {
  if (!dateString) return '';
  return new Date(dateString).getFullYear().toString();
}

interface MovieCardProps {
  movie: Movie;
  watched: boolean;
}

export function MovieCard({ movie, watched }: MovieCardProps) {
  // Отримуємо коректне значення vote_count
  const voteCount = safeNumberConversion(movie.vote_count);
  
  return (
    <Card className="relative w-full h-full overflow-hidden rounded-2xl shadow-xl">
      {/* Зображення фільму */}
      <div className="absolute inset-0 bg-muted">
        {movie.poster_path ? (
          <Image
            src={`https://image.tmdb.org/t/p/w780${movie.poster_path}`}
            alt={movie.title}
            fill
            className={`object-cover ${watched ? 'opacity-80' : ''}`}
            priority
            sizes="(max-width: 768px) 100vw, 500px"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Немає зображення</p>
          </div>
        )}

        {/* Індикатор переглянутого фільму */}
        {watched && (
          <div className="absolute top-4 right-4 bg-blue-500/80 text-white px-3 py-1 rounded-full flex items-center gap-2 z-20">
            <Eye className="h-4 w-4" />
            <span>Переглянуто</span>
          </div>
        )}

        {/* Оверлей для переглянутих фільмів */}
        {watched && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10 z-10">
            <div className="bg-blue-500/40 p-4 rounded-full">
              <Eye className="h-16 w-16 text-white" />
            </div>
          </div>
        )}

        {/* Інформація про фільм з більш прозорою підложкою і градієнтним переходом */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          {/* Градієнтний перехід, який починається вище на постері */}
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/100 via-black/90 to-transparent"></div>

          {/* Контент з інформацією */}
          <div className="relative p-3 pb-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                {movie.vote_average ? (
                  <Badge variant="secondary" className="bg-yellow-500/80 text-white">
                    <Star className="w-3 h-3 mr-1" />
                    {movie.vote_average.toFixed(1)} ({voteCount})
                  </Badge>
                ) : null}
                {movie.release_date && (
                  <Badge variant="outline" className="bg-black/20 text-white border-none">
                    {formatYear(movie.release_date)}
                  </Badge>
                )}
                {watched && (
                  <Badge variant="secondary" className="bg-blue-500/80 text-white ml-auto">
                    <Eye className="w-3 h-3 mr-1" />
                    Переглянуто
                  </Badge>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 drop-shadow-md line-clamp-2">
                {movie.title}
              </h2>
              <p className="text-white/90 text-xs sm:text-sm line-clamp-2 drop-shadow-md mb-2">
                {movie.overview}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}