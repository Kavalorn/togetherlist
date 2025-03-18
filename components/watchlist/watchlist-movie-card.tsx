// components/watchlist/watchlist-movie-card.tsx
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Star, Info, BookmarkCheck, Eye, EyeOff, Loader2, 
  Trash2, MoreHorizontal, NotebookPen 
} from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import { useWatchlistDetails, WatchlistMovie } from '@/hooks/use-watchlists';
import { useWatchedMovies } from '@/hooks/use-watched-movies';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMovieDetails } from '@/hooks/use-movies';

interface WatchlistMovieCardProps {
  movie: WatchlistMovie;
  watchlistId: number;
}

export function WatchlistMovieCard({ movie, watchlistId }: WatchlistMovieCardProps) {
  const { data: movieDetails, isLoading: isLoadingDetails } = useMovieDetails(movie.movie_id);
  const { openMovieDetailsModal } = useUIStore();
  const { isWatched, markAsWatched, removeFromWatched } = useWatchedMovies();
  const { removeMovie, updateMovie, isRemovingMovie } = useWatchlistDetails(watchlistId);
  const [imageError, setImageError] = useState(false);
  const [isMarkingWatched, setIsMarkingWatched] = useState(false);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [notes, setNotes] = useState(movie.notes || '');
  
  // Перевіряємо, чи фільм переглянуто
  const movieWatched = isWatched(movie.movie_id);
  
  // Функція для відкриття деталей фільму
  const handleOpenDetails = () => {
    if (movieDetails) {
      openMovieDetailsModal(movieDetails);
    }
  };
  
  // Функція для видалення фільму зі списку
  const handleRemoveFromWatchlist = () => {
    if (removeMovie) {
      removeMovie(movie.movie_id);
      toast.success(`"${movie.title}" видалено зі списку перегляду`);
    }
  };
  
  // Функція для зміни статусу перегляду
  const handleToggleWatched = () => {
    setIsMarkingWatched(true);
    
    if (movieWatched) {
      // Видаляємо зі списку переглянутих
      removeFromWatched(movie.movie_id);
      toast.success(`"${movie.title}" прибрано з переглянутих фільмів`);
      setIsMarkingWatched(false);
    } else {
      // Додаємо до переглянутих
      const movieData = {
        id: movie.movie_id,
        title: movie.title,
        poster_path: movie.poster_path || '',
        release_date: movie.release_date || '',
        overview: movie.overview || '',
        vote_average: movie.vote_average || 0,
        vote_count: movie.vote_count || 0
      };
      
      markAsWatched({ movie: movieData });
      toast.success(`"${movie.title}" позначено як переглянутий`);
      setIsMarkingWatched(false);
    }
  };
  
// Функція для збереження нотаток
const handleSaveNotes = () => {
  if (updateMovie) {
    updateMovie({
      movieId: movie.movie_id,
      data: { notes }
    });
    toast.success(`Нотатки до фільму "${movie.title}" збережено`);
    setIsNotesDialogOpen(false);
  }
};
  
  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200 p-0 h-full flex flex-col">
        <div className="relative aspect-[2/3] w-full cursor-pointer" onClick={handleOpenDetails}>
          <Image
            src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder-poster.png'}
            alt={movie.title}
            fill
            className={`object-cover ${movieWatched ? 'opacity-70' : ''}`}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onError={() => setImageError(true)}
          />
          
          {movie.vote_average && movie.vote_average > 0 && (
            <div className="absolute top-2 left-2 bg-black/75 text-white px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
              <span>{movie.vote_average.toFixed(1)} {movie.vote_count && `(${movie.vote_count})`}</span>
            </div>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white text-gray-600 hover:text-gray-800"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsNotesDialogOpen(true)}>
                <NotebookPen className="h-4 w-4 mr-2" />
                {movie.notes ? "Редагувати нотатки" : "Додати нотатки"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleWatched}>
                {movieWatched ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Непереглянуто
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Переглянуто
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleRemoveFromWatchlist}
                className="text-red-500 focus:text-red-500"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Видалити зі списку
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Індикатор переглянутого фільму */}
          {movieWatched && (
            <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10">
              <div className="bg-blue-500/30 rounded-full p-3">
                <Eye className="h-10 w-10 text-white" />
              </div>
            </div>
          )}
          
          {/* Індикатор нотаток */}
          {movie.notes && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute bottom-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white text-gray-600 hover:text-gray-800"
              onClick={(e) => {
                e.stopPropagation();
                setIsNotesDialogOpen(true);
              }}
            >
              <NotebookPen className="h-5 w-5" />
            </Button>
          )}
        </div>
        
        <CardContent className="p-3 flex-grow flex flex-col">
          <h3 
            className="text-sm font-bold line-clamp-2 cursor-pointer" 
            onClick={handleOpenDetails}
          >
            {movie.title}
            {movieWatched && <Eye className="inline h-3 w-3 ml-1 text-blue-500" />}
          </h3>
          
          {movie.release_date && (
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(movie.release_date), 'yyyy')}
            </p>
          )}
          
          {movie.notes && (
            <div 
              className="mt-2 text-xs line-clamp-3 bg-muted p-2 rounded-md cursor-pointer"
              onClick={() => setIsNotesDialogOpen(true)}
            >
              {movie.notes}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="p-3 pt-0 grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleOpenDetails}
          >
            <Info className="mr-2 h-4 w-4" />
            Деталі
          </Button>
          
          <Button
            variant={movieWatched ? "default" : "secondary"}
            size="sm"
            className={`w-full ${movieWatched ? "bg-blue-500 hover:bg-blue-600" : ""}`}
            onClick={handleToggleWatched}
            disabled={isMarkingWatched}
          >
            {isMarkingWatched ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : movieWatched ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Непереглянуто
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Переглянуто
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Діалог для редагування нотаток */}
      <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Нотатки до фільму</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-3">
              {movie.poster_path && (
                <div className="relative w-12 h-16 flex-shrink-0">
                  <Image
                    src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                    alt={movie.title}
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
              )}
              <div>
                <h3 className="font-semibold">{movie.title}</h3>
                {movie.release_date && (
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(movie.release_date), 'yyyy')}
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Ваші нотатки</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Напишіть свої думки, враження або нотатки про фільм..."
                className="h-32"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNotesDialogOpen(false)}
            >
              Скасувати
            </Button>
            <Button onClick={handleSaveNotes}>
              Зберегти
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}