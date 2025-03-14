'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Info, Bookmark, BookmarkCheck } from 'lucide-react';
import { Movie } from '@/lib/tmdb';
import { useWatchlist } from '@/hooks/use-watchlist';
import { useUIStore } from '@/store/ui-store';
import { useMovieDetails } from '@/hooks/use-movies';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface MovieCardProps {
  movie: Movie;
  variant?: 'default' | 'compact';
}

export function MovieCard({ movie, variant = 'default' }: MovieCardProps) {
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { openMovieDetailsModal } = useUIStore();
  const { data: movieDetails } = useMovieDetails(movie.id);
  const [imageError, setImageError] = useState(false);

  // Забезпечуємо, що у нас є значення рейтингу та кількості голосів
  const voteAverage = movie.vote_average !== undefined ? movie.vote_average : movieDetails?.vote_average || 0;
  const voteCount = movie.vote_count !== undefined ? movie.vote_count : movieDetails?.vote_count || 0;

  // Обробник відкриття деталей фільму
  const handleOpenDetails = () => {
    if (movieDetails) {
      openMovieDetailsModal(movieDetails);
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
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            onError={() => setImageError(true)}
          />
          {voteAverage > 0 && (
            <div className="absolute top-2 left-2 bg-black/75 text-white px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
              <span>{voteAverage.toFixed(1)} ({voteCount})</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-white/80 hover:bg-white p-1 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              toggleWatchlist(movie as any);
            }}
          >
            {isInWatchlist(movie.id) ? (
              <BookmarkCheck className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            ) : (
              <Bookmark className="h-5 w-5 text-gray-500" />
            )}
          </Button>
        </div>
        <CardContent className="p-3">
          <h3 className="font-bold text-sm line-clamp-2 cursor-pointer" onClick={handleOpenDetails}>
            {movie.title}
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
          className="object-cover cursor-pointer"
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
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-white/80 hover:bg-white p-1.5 rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            toggleWatchlist(movie as any);
          }}
        >
          {isInWatchlist(movie.id) ? (
            <BookmarkCheck className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 fill-yellow-500" />
          ) : (
            <Bookmark className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
          )}
        </Button>
      </div>
      <div className='flex flex-col justify-between flex-grow'>
        <CardContent className="p-4">
          <h2
            className="text-base sm:text-xl font-bold tracking-tight mb-1 cursor-pointer"
            onClick={handleOpenDetails}
          >
            {movie.title}
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
            className="w-full sm:flex-1"
            onClick={handleOpenDetails}
          >
            <Info className="mr-2 h-4 w-4" />
            Деталі
          </Button>
          <Button
            variant={isInWatchlist(movie.id) ? "secondary" : "outline"}
            className={`w-full sm:flex-1 ${isInWatchlist(movie.id) ? "text-yellow-600" : ""}`}
            onClick={() => toggleWatchlist(movie as any)}
          >
            {isInWatchlist(movie.id) ? (
              <>
                <BookmarkCheck className="mr-2 h-4 w-4 text-yellow-500 fill-yellow-500" />
                В списку
              </>
            ) : (
              <>
                <Bookmark className="mr-2 h-4 w-4" />
                Додати
              </>
            )}
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}