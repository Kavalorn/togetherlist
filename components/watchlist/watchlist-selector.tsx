// components/watchlist/watchlist-selector.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle, BookmarkCheck, Bookmark, List, Inbox } from 'lucide-react';
import { useWatchlists, useWatchlistDetails, Watchlist } from '@/hooks/use-watchlists';
import { MovieDetails } from '@/lib/tmdb';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface WatchlistSelectorProps {
  movie: MovieDetails;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  iconOnly?: boolean;
}

export function WatchlistSelector({
  movie,
  variant = 'outline',
  size = 'default',
  className,
  iconOnly = false
}: WatchlistSelectorProps) {
  const { watchlists, isLoading, createWatchlist, isCreating } = useWatchlists();
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [newWatchlistDescription, setNewWatchlistDescription] = useState('');
  const [newWatchlistColor, setNewWatchlistColor] = useState('#3b82f6');
  
  // Кольори для списків
  const colorOptions = [
    { value: '#3b82f6', name: 'Синій' },
    { value: '#ef4444', name: 'Червоний' },
    { value: '#22c55e', name: 'Зелений' },
    { value: '#eab308', name: 'Жовтий' },
    { value: '#ec4899', name: 'Рожевий' },
    { value: '#a855f7', name: 'Фіолетовий' },
    { value: '#f97316', name: 'Помаранчевий' },
    { value: '#06b6d4', name: 'Блакитний' },
    { value: '#6b7280', name: 'Сірий' },
  ];
  
  // Перевіряємо, чи фільм є хоча б в одному списку
  const isInAnyWatchlist = watchlists.some(list => {
    const { isMovieInWatchlist } = useWatchlistDetails(list.id);
    return isMovieInWatchlist && isMovieInWatchlist(movie.id);
  });
  
  // Обробник створення нового списку
  const handleCreateWatchlist = () => {
    if (!newWatchlistName.trim()) {
      toast.error('Введіть назву списку');
      return;
    }
    
    createWatchlist({
      name: newWatchlistName.trim(),
      description: newWatchlistDescription.trim(),
      color: newWatchlistColor,
    }, {
      onSuccess: (data) => {
        toast.success(`Список "${newWatchlistName}" створено`);
        setIsCreateDialogOpen(false);
        setNewWatchlistName('');
        setNewWatchlistDescription('');
        
        // Додаємо фільм до нового списку
        const { addMovie } = useWatchlistDetails(data.id);
        if (addMovie) {
          addMovie(movie, {
            onSuccess: () => {
              toast.success(`"${movie.title}" додано до списку "${data.name}"`);
            }
          });
        }
      },
      onError: (error: Error) => {
        toast.error(`Помилка: ${error.message}`);
      }
    });
  };
  
  // Функція для додавання/видалення фільму зі списку
  const handleToggleInWatchlist = (watchlist: Watchlist) => {
    const { isMovieInWatchlist, addMovie, removeMovie } = useWatchlistDetails(watchlist.id);
    
    if (isMovieInWatchlist && isMovieInWatchlist(movie.id)) {
      // Видаляємо фільм зі списку
      if (removeMovie) {
        removeMovie(movie.id, {
          onSuccess: () => {
            toast.success(`"${movie.title}" видалено зі списку "${watchlist.name}"`);
          },
          onError: (error: Error) => {
            toast.error(`Помилка: ${error.message}`);
          }
        });
      }
    } else {
      // Додаємо фільм до списку
      if (addMovie) {
        addMovie(movie, {
          onSuccess: () => {
            toast.success(`"${movie.title}" додано до списку "${watchlist.name}"`);
          },
          onError: (error: Error) => {
            toast.error(`Помилка: ${error.message}`);
          }
        });
      }
    }
  };
  
  if (isLoading) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={true}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        {!iconOnly && <span className="ml-2">Завантаження...</span>}
      </Button>
    );
  }
  
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
          >
            {isInAnyWatchlist ? (
              <BookmarkCheck className="h-4 w-4" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
            {!iconOnly && (
              <span className="ml-2">
                {isInAnyWatchlist ? "У списку" : "До списку"}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {watchlists.map((watchlist) => {
            const { isMovieInWatchlist } = useWatchlistDetails(watchlist.id);
            const isInThisWatchlist = isMovieInWatchlist && isMovieInWatchlist(movie.id);
            
            return (
              <DropdownMenuItem 
                key={watchlist.id}
                onClick={() => handleToggleInWatchlist(watchlist)}
                className="cursor-pointer"
              >
                <div 
                  className="h-4 w-4 mr-2 rounded-sm flex items-center justify-center"
                  style={{ backgroundColor: watchlist.color }}
                >
                  {watchlist.isDefault ? (
                    <Inbox className="h-3 w-3 text-white" />
                  ) : (
                    <List className="h-3 w-3 text-white" />
                  )}
                </div>
                <span className="flex-1">{watchlist.name}</span>
                {isInThisWatchlist && (
                  <BookmarkCheck className="h-4 w-4 ml-2 text-yellow-600" />
                )}
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setIsCreateDialogOpen(true)}
            className="cursor-pointer"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            <span className="flex-1">Створити новий список</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Діалог для створення нового списку */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Створити новий список</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleCreateWatchlist(); }}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">Назва списку</Label>
                <Input
                  id="name"
                  value={newWatchlistName}
                  onChange={(e) => setNewWatchlistName(e.target.value)}
                  placeholder="Наприклад: Бойовики"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Опис (необов'язково)</Label>
                <Textarea
                  id="description"
                  value={newWatchlistDescription}
                  onChange={(e) => setNewWatchlistDescription(e.target.value)}
                  placeholder="Короткий опис списку"
                />
              </div>
              <div className="space-y-2">
                <Label>Колір</Label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={cn(
                        "w-8 h-8 rounded-full border border-gray-300",
                        newWatchlistColor === color.value && "ring-2 ring-black dark:ring-white ring-offset-2"
                      )}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setNewWatchlistColor(color.value)}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Скасувати
              </Button>
              <Button 
                type="submit"
                disabled={isCreating || !newWatchlistName.trim()}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Створення...
                  </>
                ) : (
                  "Створити та додати фільм"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}