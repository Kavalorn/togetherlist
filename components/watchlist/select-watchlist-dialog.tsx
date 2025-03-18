// components/watchlist/select-watchlist-dialog.tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MovieDetails } from '@/lib/tmdb';
import { useWatchlists, Watchlist } from '@/hooks/use-watchlists';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  PlusCircle,
  Loader2,
  List,
  Inbox,
  BookmarkIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';

interface SelectWatchlistDialogProps {
  movie: MovieDetails;
  isOpen: boolean;
  onClose: () => void;
}

export function SelectWatchlistDialog({ movie, isOpen, onClose }: SelectWatchlistDialogProps) {
  const { watchlists, isLoading, createWatchlist, isCreating, getDefaultWatchlist } = useWatchlists();
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [newWatchlistColor, setNewWatchlistColor] = useState('#3b82f6'); // Синій за замовчуванням
  
  // При відкритті діалогу вибираємо список за замовчуванням
  if (isOpen && !selectedWatchlistId && !showCreateForm && !isLoading) {
    const defaultWatchlist = getDefaultWatchlist();
    if (defaultWatchlist) {
      setSelectedWatchlistId(defaultWatchlist.id);
    }
  }
  
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
  
  // Обробник створення нового списку
  const handleCreateWatchlist = () => {
    if (!newWatchlistName.trim()) {
      toast.error('Введіть назву списку');
      return;
    }
    
    createWatchlist({
      name: newWatchlistName.trim(),
      color: newWatchlistColor
    }, {
      onSuccess: (data) => {
        toast.success(`Список "${newWatchlistName}" створено`);
        setShowCreateForm(false);
        setNewWatchlistName('');
        setSelectedWatchlistId(data.id);
      },
      onError: (error: Error) => {
        toast.error(`Помилка: ${error.message}`);
      }
    });
  };
  
  // Обробник відправки форми створення списку
  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    handleCreateWatchlist();
  };
  
  // Функція для отримання іконки списку
  const getWatchlistIcon = (watchlist: Watchlist) => {
    if (watchlist.isDefault) return <Inbox className="h-5 w-5" />;
    return <List className="h-5 w-5" />;
  };
  
  // Функція для вибору списку і закриття діалогу
  const handleSelectWatchlist = async (watchlistId: number) => {
    setSelectedWatchlistId(watchlistId);
    
    // Знаходимо вибраний список
    const watchlist = watchlists.find(w => w.id === watchlistId);
    
    if (watchlist) {
      // Закриваємо діалог і викликаємо колбек
      onClose();
      
      // Показуємо повідомлення про успішне додавання
      toast.success(`"${movie.title}" додано до списку "${watchlist.name}"`);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Додати до списку перегляду</DialogTitle>
        </DialogHeader>
      
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Завантаження списків...</span>
          </div>
        ) : showCreateForm ? (
          <form onSubmit={handleSubmitCreate} className="space-y-4 py-2">
            <div className="space-y-2">
              <Input
                placeholder="Назва списку"
                value={newWatchlistName}
                onChange={(e) => setNewWatchlistName(e.target.value)}
                className="w-full"
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Колір</label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={cn(
                      "w-6 h-6 rounded-full border border-gray-300",
                      newWatchlistColor === color.value && "ring-2 ring-black dark:ring-white ring-offset-2"
                    )}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setNewWatchlistColor(color.value)}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setShowCreateForm(false)}
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
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Створити
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="py-2">
              <p className="text-sm text-muted-foreground mb-4">
                Виберіть список, до якого хочете додати "{movie.title}"
              </p>
              
              <ScrollArea className="max-h-60 pr-4">
                <div className="space-y-2">
                  {watchlists.map((watchlist) => (
                    <button
                      key={watchlist.id}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-md transition-colors",
                        selectedWatchlistId === watchlist.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      )}
                      onClick={() => handleSelectWatchlist(watchlist.id)}
                    >
                      <div 
                        className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center"
                        style={{ backgroundColor: watchlist.color }}
                      >
                        {getWatchlistIcon(watchlist)}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">{watchlist.name}</p>
                        <p className="text-xs truncate opacity-70">
                          {watchlist.movies?.length || 0} фільмів • 
                          Оновлено {formatDistanceToNow(new Date(watchlist.updatedAt), { locale: uk, addSuffix: true })}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
              
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setShowCreateForm(true)}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Створити новий список
              </Button>
            </div>
            
            <DialogFooter>
              <Button 
                onClick={() => selectedWatchlistId && handleSelectWatchlist(selectedWatchlistId)}
                disabled={!selectedWatchlistId}
                className="w-full sm:w-auto"
              >
                <BookmarkIcon className="mr-2 h-4 w-4" />
                Додати до списку
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}