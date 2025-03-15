// components/movie/movie-card.tsx
'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Info, Bookmark, BookmarkCheck, Eye, EyeOff } from 'lucide-react';
import { Movie } from '@/lib/tmdb';
import { useWatchlist } from '@/hooks/use-watchlist';
import { useWatchedMovies } from '@/hooks/use-watched-movies';
import { useUIStore } from '@/store/ui-store';
import { useMovieDetails } from '@/hooks/use-movies';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Функція для безпечного перетворення значення на число
function safeNumberConversion(value: any): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseInt(value, 10) || 0;
  return 0;
}

interface MovieCardProps {
  movie: Movie;
  variant?: 'default' | 'compact';
}

export function MovieCard({ movie, variant = 'default' }: MovieCardProps) {
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { isWatched, markAsWatched, removeFromWatched } = useWatchedMovies();
  const { openMovieDetailsModal } = useUIStore();
  const { data: movieDetails } = useMovieDetails(movie.id);
  const [imageError, setImageError] = useState(false);

  // Забезпечуємо, що у нас є значення рейтингу та кількості голосів
  const voteAverage = movie.vote_average !== undefined ? movie.vote_average : movieDetails?.vote_average || 0;
  
  // Перевіряємо строго на undefined або null для vote_count і перетворюємо на число
  const voteCount = safeNumberConversion(
    movie.vote_count !== undefined && movie.vote_count !== null
      ? movie.vote_count
      : movieDetails?.vote_count
  );
  
  // Перевіряємо чи фільм переглянуто
  const movieWatched = isWatched(movie.id);

  // Обробник відкриття деталей фільму
  const handleOpenDetails = () => {
    if (movieDetails) {
      openMovieDetailsModal(movieDetails);
    }
  };
  
  // Обробник додавання до списку перегляду
  const handleAddToWatchlist = () => {
    // Переконуємося, що передаємо всі необхідні дані, включаючи vote_count
    const movieData = {
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      release_date: movie.release_date,
      overview: movie.overview,
      vote_average: voteAverage,
      vote_count: voteCount
    };
    
    toggleWatchlist(movieData as any);
  };
  
  // Обробник позначення фільму як переглянутого
  const handleMarkAsWatched = () => {
    if (movieWatched) {
      removeFromWatched(movie.id);
    } else {
      const movieData = {
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        overview: movie.overview,
        vote_average: voteAverage,
        vote_count: voteCount
      };
      
      markAsWatched({ movie: movieData as any });
    }
  };

  // Компактний варіант картки для списку фільмів актора
  if (variant === 'compact') {
    return (
      <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200 p-0 h-full">
        <div className="relative aspect-[2/3] w-full">
          <Image
            src={movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : '/placeholder-poster.png'}
            alt={movie.title}
            fill
            className={`object-cover ${movieWatched ? 'opacity-70' : ''}`}
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            onError={() => setImageError(true)}
          />
          {voteAverage > 0 && (
            <div className="absolute top-2 left-2 bg-black/75 text-white px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
              <span>{voteAverage.toFixed(1)} ({voteCount})</span>
            </div>
          )}
          
          <TooltipProvider>
            {/* Кнопка статусу перегляду */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`absolute bottom-2 left-2 p-1.5 rounded-full ${
                    movieWatched 
                      ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                      : 'bg-white/80 hover:bg-white text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAsWatched();
                  }}
                >
                  {movieWatched ? (
                    <Eye className="h-5 w-5" />
                  ) : (
                    <EyeOff className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {movieWatched ? "Прибрати з переглянутих" : "Позначити як переглянутий"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            {/* Кнопка списку перегляду */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`absolute top-2 right-2 p-1.5 rounded-full ${
                    isInWatchlist(movie.id) 
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                      : 'bg-white/80 hover:bg-white text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToWatchlist();
                  }}
                >
                  {isInWatchlist(movie.id) ? (
                    <BookmarkCheck className="h-5 w-5" />
                  ) : (
                    <Bookmark className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isInWatchlist(movie.id) ? "Прибрати зі списку" : "Додати до списку"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {movieWatched && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-blue-500/30 rounded-full p-2">
                <Eye className="h-8 w-8 text-white" />
              </div>
            </div>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="font-bold text-sm line-clamp-2 cursor-pointer" onClick={handleOpenDetails}>
            {movie.title} {movieWatched && <Eye className="inline h-3 w-3 ml-1 text-blue-500" />}
          </h3>
          <p className="text-xs text-muted-foreground">
            {movie.release_date ? format(new Date(movie.release_date), 'yyyy') : 'Невідома дата'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Повний варіант картки для результатів пошуку
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200 p-0 h-full flex flex-col">
      <div className="relative aspect-[2/3] w-full">
        <Image
          src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder-poster.png'}
          alt={movie.title}
          fill
          className={`object-cover cursor-pointer ${movieWatched ? 'opacity-70' : ''}`}
          onClick={handleOpenDetails}
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          onError={() => setImageError(true)}
        />
        {voteAverage > 0 && (
          <div className="absolute top-2 left-2 bg-black/75 text-white px-2 py-1 rounded-md text-xs sm:text-sm font-semibold flex items-center gap-1">
            <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-yellow-400" />
            <span>{voteAverage.toFixed(1)} ({voteCount})</span>
          </div>
        )}
        
        <TooltipProvider>
          {/* Кнопка списку перегляду */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`absolute top-2 right-2 p-1.5 rounded-full ${
                  isInWatchlist(movie.id) 
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                    : 'bg-white/80 hover:bg-white text-gray-600 hover:text-gray-800'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToWatchlist();
                }}
              >
                {isInWatchlist(movie.id) ? (
                  <BookmarkCheck className="h-6 w-6" />
                ) : (
                  <Bookmark className="h-6 w-6" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isInWatchlist(movie.id) ? "Прибрати зі списку" : "Додати до списку"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          {/* Кнопка статусу перегляду */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`absolute bottom-2 right-2 p-1.5 rounded-full ${
                  movieWatched 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                    : 'bg-white/80 hover:bg-white text-gray-600 hover:text-gray-800'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkAsWatched();
                }}
              >
                {movieWatched ? (
                  <Eye className="h-6 w-6" />
                ) : (
                  <EyeOff className="h-6 w-6" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {movieWatched ? "Прибрати з переглянутих" : "Позначити як переглянутий"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {movieWatched && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-blue-500/30 rounded-full p-3">
              <Eye className="h-12 w-12 text-white" />
            </div>
          </div>
        )}
      </div>
      <div className='flex flex-col justify-between flex-grow'>
        <CardContent className="p-4">
          <h2
            className="text-base sm:text-xl font-bold tracking-tight mb-1 cursor-pointer"
            onClick={handleOpenDetails}
          >
            {movie.title} {movieWatched && <Eye className="inline h-4 w-4 ml-1 text-blue-500" />}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-2">
            {movie.release_date ? format(new Date(movie.release_date), 'dd MMM yyyy') : 'Невідома дата'}
          </p>
          <p className="text-xs sm:text-sm line-clamp-3 mb-3">
            {movie.overview || 'Опис відсутній'}
          </p>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex flex-col sm:flex-row gap-2">
          <Button
            variant="default"
            className="w-full"
            onClick={handleOpenDetails}
          >
            <Info className="mr-2 h-4 w-4" />
            Деталі
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}