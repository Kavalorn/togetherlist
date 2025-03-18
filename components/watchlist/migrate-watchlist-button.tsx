// components/watchlist/migrate-watchlist-button.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Loader2, MoveRight } from 'lucide-react';
import { useWatchlists } from '@/hooks/use-watchlists';
import { toast } from 'sonner';

export function MigrateWatchlistButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { migrateWatchlist, isMigrating, hasDefaultWatchlist, getDefaultWatchlist } = useWatchlists();
  
  const handleMigrate = () => {
    migrateWatchlist({
      onSuccess: (data) => {
        toast.success(`Міграцію завершено успішно! Перенесено ${data.stats.migratedMovies} фільмів.`);
        setIsDialogOpen(false);
      },
      onError: (error: any) => {
        toast.error(`Помилка міграції: ${error.message}`);
      }
    });
  };
  
  // Якщо вже є список за замовчуванням, ховаємо кнопку
  if (hasDefaultWatchlist()) {
    return null;
  }
  
  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsDialogOpen(true)}
        className="flex items-center gap-2"
      >
        <MoveRight className="h-4 w-4" />
        <span>Мігрувати старий список</span>
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Міграція списку перегляду</DialogTitle>
            <DialogDescription>
              Перенесення фільмів зі старого списку перегляду до нової системи з багатьма списками.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
          <p className="mb-2">
              Ця дія перенесе всі фільми з вашого старого списку перегляду до нового списку "Невідсортоване".
            </p>
            <p className="text-muted-foreground">
              Це дозволить вам організувати фільми за категоріями в майбутньому. 
              Оригінальні дані залишаться незмінними.
            </p>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Скасувати
            </Button>
            <Button 
              onClick={handleMigrate}
              disabled={isMigrating}
            >
              {isMigrating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Міграція...
                </>
              ) : (
                "Мігрувати фільми"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}