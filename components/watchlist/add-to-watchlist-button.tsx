// components/watchlist/add-to-watchlist-button.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark, BookmarkCheck, Loader2, ChevronDown } from 'lucide-react';
import { MovieDetails } from '@/lib/tmdb';
import { useWatchlists, useWatchlistDetails } from '@/hooks/use-watchlists';
import { SelectWatchlistDialog } from './select-watchlist-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AddToWatchlistButtonProps {
  movie: MovieDetails;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
  showText?: boolean;
  showTooltip?: boolean;
  iconOnly?: boolean;
}

export function AddToWatchlistButton({
  movie,
  size = 'default',
  variant = 'outline',
  className,
  showText = true,
  showTooltip = false,
  iconOnly = false
}: AddToWatchlistButtonProps) {
  const { watchlists, isLoading: isLoadingWatchlists } = useWatchlists();
  const [isSelectDialogOpen, setIsSelectDialogOpen] = useState(false);
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<number | null>(null);
  const { watchlist, isMovieInWatchlist, addMovie, removeMovie, isAddingMovie, isRemovingMovie } = 
    useWatchlistDetails(selectedWatchlistId);
  
  // Перевіряємо, чи фільм додано хоча б до одного списку
  const isInAnyWatchlist = watchlists.some(list => {
    const watchlistDetails = useWatchlistDetails(list.id);
    return watchlistDetails.isMovieInWatchlist && watchlistDetails.isMovieInWatchlist(movie.id);
  });
  
  // Вибираємо перший список при завантаженні для перевірки
  useEffect(() => {
    if (!isLoadingWatchlists && watchlists.length > 0 && !selectedWatchlistId) {
      setSelectedWatchlistId(watchlists[0].id);
    }
  }, [isLoadingWatchlists, watchlists, selectedWatchlistId]);
  
  // Обробник відкриття діалогу вибору списку
  const handleOpenSelectDialog = () => {
    setIsSelectDialogOpen(true);
  };
  
  // Обробник додавання/видалення фільму зі списку
  const handleToggleInWatchlist = (watchlistId: number) => {
    setSelectedWatchlistId(watchlistId);
    
    const selectedWatchlist = watchlists.find(w => w.id === watchlistId);
    if (!selectedWatchlist) return;
    
    const watchlistDetails = useWatchlistDetails(watchlistId);
    const isInWatchlist = watchlistDetails.isMovieInWatchlist && 
      watchlistDetails.isMovieInWatchlist(movie.id);
    
    if (isInWatchlist) {
      // Видаляємо фільм зі списку
      watchlistDetails.removeMovie(movie.id, {
        onSuccess: () => {
          toast.success(`"${movie.title}" видалено зі списку "${selectedWatchlist.name}"`);
        },
        onError: (error: Error) => {
          toast.error(`Помилка: ${error.message}`);
        }
      });
    } else {
      // Додаємо фільм до списку
      watchlistDetails.addMovie(movie, {
        onSuccess: () => {
          toast.success(`"${movie.title}" додано до списку "${selectedWatchlist.name}"`);
        },
        onError: (error: Error) => {
          toast.error(`Помилка: ${error.message}`);
        }
      });
    }
  };
  
  // Якщо є лише один список, використовуємо просту кнопку
  if (watchlists.length === 1 && !isLoadingWatchlists) {
    const isInWatchlist = useWatchlistDetails(watchlists[0].id).isMovieInWatchlist?.(movie.id);
    const isPending = isAddingMovie || isRemovingMovie;
    
    if (showTooltip) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isInWatchlist ? "default" : variant}
                size={size}
                className={cn(
                  isInWatchlist ? "bg-yellow-600 hover:bg-yellow-700" : "",
                  className
                )}
                onClick={() => handleToggleInWatchlist(watchlists[0].id)}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isInWatchlist ? (
                  <BookmarkCheck className="h-4 w-4" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
                {showText && !iconOnly && (
                  <span className="ml-2">
                    {isInWatchlist ? "У списку" : "До списку"}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isInWatchlist
                ? `Видалити зі списку "${watchlists[0].name}"`
                : `Додати до списку "${watchlists[0].name}"`}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    return (
      <Button
        variant={isInWatchlist ? "default" : variant}
        size={size}
        className={cn(
          isInWatchlist ? "bg-yellow-600 hover:bg-yellow-700" : "",
          className
        )}
        onClick={() => handleToggleInWatchlist(watchlists[0].id)}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isInWatchlist ? (
          <BookmarkCheck className="h-4 w-4" />
        ) : (
          <Bookmark className="h-4 w-4" />
        )}
        {showText && !iconOnly && (
          <span className="ml-2">
            {isInWatchlist ? "У списку" : "До списку"}
          </span>
        )}
      </Button>
    );
  }
  
  // Для кількох списків використовуємо випадаюче меню
  if (watchlists.length > 1 && !isLoadingWatchlists) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={isInAnyWatchlist ? "default" : variant}
              size={size}
              className={cn(
                isInAnyWatchlist ? "bg-yellow-600 hover:bg-yellow-700" : "",
                className
              )}
              disabled={isAddingMovie || isRemovingMovie}
            >
              {isAddingMovie || isRemovingMovie ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isInAnyWatchlist ? (
                <BookmarkCheck className="h-4 w-4" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
              {showText && !iconOnly && (
                <span className="ml-2">
                  {isInAnyWatchlist ? "У списку" : "До списку"}
                </span>
              )}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {watchlists.map((list) => {
              const watchlistDetails = useWatchlistDetails(list.id);
              const isInThisWatchlist = watchlistDetails.isMovieInWatchlist && 
                watchlistDetails.isMovieInWatchlist(movie.id);
              
              return (
                <DropdownMenuItem 
                  key={list.id}
                  onClick={() => handleToggleInWatchlist(list.id)}
                  className="cursor-pointer"
                >
                  {isInThisWatchlist ? (
                    <BookmarkCheck className="mr-2 h-4 w-4 text-yellow-600" />
                  ) : (
                    <Bookmark className="mr-2 h-4 w-4" />
                  )}
                  <span className="flex-1">{list.name}</span>
                  {isInThisWatchlist && (
                    <span className="text-xs text-muted-foreground">Додано</span>
                  )}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleOpenSelectDialog}
              className="cursor-pointer"
            >
              <span className="text-center w-full">Створити новий список</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <SelectWatchlistDialog
          movie={movie}
          isOpen={isSelectDialogOpen}
          onClose={() => setIsSelectDialogOpen(false)}
        />
      </>
    );
  }
  
  // Для стану завантаження або відсутності списків
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleOpenSelectDialog}
      disabled={isLoadingWatchlists}
    >
      {isLoadingWatchlists ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
      {showText && !iconOnly && (
        <span className="ml-2">До списку</span>
      )}
    </Button>
  );
}