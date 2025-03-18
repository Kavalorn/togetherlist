// app/watchlists/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useWatchlists, Watchlist, useWatchlistDetails } from '@/hooks/use-watchlists';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2, 
  PlusCircle, 
  BookmarkIcon, 
  Film,
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Inbox,
  List,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { MovieCard } from '@/components/movie/movie-card';
import { WatchlistMovieCard } from '@/components/watchlist/watchlist-movie-card';

export default function WatchlistsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Завантаження...</p>
      </div>
    }>
      <WatchlistsContent />
    </Suspense>
  );
}

function WatchlistsContent() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuthStore();
  const { 
    watchlists, 
    isLoading, 
    createWatchlist, 
    updateWatchlist, 
    deleteWatchlist,
    migrateWatchlist,
    isCreating,
    isDeleting,
    isMigrating,
    hasDefaultWatchlist,
    getDefaultWatchlist,
    refetch
  } = useWatchlists();
  
  // Стани для діалогів
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedWatchlist, setSelectedWatchlist] = useState<Watchlist | null>(null);
  const [activeWatchlistId, setActiveWatchlistId] = useState<number | null>(null);
  
  // Стани для форм
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [newWatchlistDescription, setNewWatchlistDescription] = useState('');
  const [newWatchlistColor, setNewWatchlistColor] = useState('#3b82f6');
  const [editWatchlistName, setEditWatchlistName] = useState('');
  const [editWatchlistDescription, setEditWatchlistDescription] = useState('');
  const [editWatchlistColor, setEditWatchlistColor] = useState('');
  
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
  
  // Ініціалізація стану аутентифікації
  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);
  
  // Перенаправлення неавторизованих користувачів
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/');
    }
  }, [isAuthLoading, user, router]);
  
  // Встановлення активного списку
  useEffect(() => {
    if (!isLoading && watchlists.length > 0 && !activeWatchlistId) {
      setActiveWatchlistId(watchlists[0].id);
    }
  }, [isLoading, watchlists, activeWatchlistId]);
  
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
        setActiveWatchlistId(data.id);
      },
      onError: (error: Error) => {
        toast.error(`Помилка: ${error.message}`);
      }
    });
  };
  
  // Обробник оновлення списку
  const handleUpdateWatchlist = () => {
    if (!selectedWatchlist) return;
    
    if (!editWatchlistName.trim()) {
      toast.error('Введіть назву списку');
      return;
    }
    
    updateWatchlist({
      id: selectedWatchlist.id,
      data: {
        name: editWatchlistName.trim(),
        description: editWatchlistDescription.trim(),
        color: editWatchlistColor,
      }
    }, {
      onSuccess: () => {
        toast.success(`Список "${editWatchlistName}" оновлено`);
        setIsEditDialogOpen(false);
        setSelectedWatchlist(null);
      },
      onError: (error: Error) => {
        toast.error(`Помилка: ${error.message}`);
      }
    });
  };
  
  // Обробник видалення списку
  const handleDeleteWatchlist = () => {
    if (!selectedWatchlist) return;
    
    deleteWatchlist(selectedWatchlist.id, {
      onSuccess: () => {
        toast.success(`Список "${selectedWatchlist.name}" видалено`);
        setIsDeleteDialogOpen(false);
        setSelectedWatchlist(null);
        
        // Переключаємось на список за замовчуванням, якщо видаляємо активний список
        if (activeWatchlistId === selectedWatchlist.id) {
          const defaultWatchlist = getDefaultWatchlist();
          if (defaultWatchlist) {
            setActiveWatchlistId(defaultWatchlist.id);
          }
        }
      },
      onError: (error: Error) => {
        toast.error(`Помилка: ${error.message}`);
      }
    });
  };
  
  // Обробник міграції фільмів
  const handleMigrateWatchlist = () => {
    migrateWatchlist({
      onSuccess: (data) => {
        toast.success(`Міграція завершена. Перенесено ${data.stats.migratedMovies} фільмів.`);
        refetch();
      },
      onError: (error: Error) => {
        toast.error(`Помилка міграції: ${error.message}`);
      }
    });
  };
  
  // Відкриття діалогу редагування
  const handleOpenEditDialog = (watchlist: Watchlist) => {
    setSelectedWatchlist(watchlist);
    setEditWatchlistName(watchlist.name);
    setEditWatchlistDescription(watchlist.description || '');
    setEditWatchlistColor(watchlist.color);
    setIsEditDialogOpen(true);
  };
  
  // Відкриття діалогу видалення
  const handleOpenDeleteDialog = (watchlist: Watchlist) => {
    setSelectedWatchlist(watchlist);
    setIsDeleteDialogOpen(true);
  };
  
  // Функція для отримання іконки списку
  const getWatchlistIcon = (watchlist: Watchlist) => {
    if (watchlist.isDefault) return <Inbox className="h-5 w-5" />;
    return <List className="h-5 w-5" />;
  };
  
  // Якщо перевіряється стан аутентифікації, показуємо індикатор завантаження
  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Завантаження...</p>
      </div>
    );
  }
  
  // Якщо користувач не авторизований, показуємо повідомлення про необхідність входу
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] p-4">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 text-center">Авторизуйтесь для доступу до списків перегляду</h1>
        <p className="text-muted-foreground mb-6 text-center">Для використання цієї функції необхідно увійти в свій обліковий запис</p>
        <Button onClick={() => router.push('/')} variant="default">
          На головну
        </Button>
      </div>
    );
  }
  
  // Компонент для відображення вмісту списку
  const WatchlistContent = ({ watchlistId }: { watchlistId: number }) => {
    const { watchlist, movies, isLoading, isError } = useWatchlistDetails(watchlistId);
    
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    if (isError || !watchlist) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">Помилка завантаження списку</p>
          <Button onClick={() => refetch()} className="mt-4">
            Спробувати знову
          </Button>
        </div>
      );
    }
    
    if (movies.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Film className="h-16 w-16 text-muted-foreground" />
          <h3 className="text-xl font-semibold">Список порожній</h3>
          <p className="text-muted-foreground text-center max-w-md">
            У цьому списку ще немає фільмів. Додайте фільми, щоб вони з'явились тут.
          </p>
          <Button onClick={() => router.push('/')} className="mt-4">
            Шукати фільми
          </Button>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {movies.map(movie => (
          <MovieCard
            key={movie.id}
            movie={{
              id: movie.movie_id,
              title: movie.title,
              poster_path: movie.poster_path || '',
              release_date: movie.release_date || '',
              overview: movie.overview || '',
              vote_average: movie.vote_average || 0,
              vote_count: movie.vote_count || 0
            }}
          />
        ))}
      </div>
    );
  };
  
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Списки перегляду</h1>
          <p className="text-muted-foreground">
            {isLoading 
              ? 'Завантаження списків...' 
              : watchlists.length > 0 
                ? `${watchlists.length} ${watchlists.length === 1 ? 'список' : watchlists.length < 5 ? 'списки' : 'списків'}`
                : 'У вас ще немає списків перегляду'
            }
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto w-full sm:w-auto">
          {!hasDefaultWatchlist() && (
            <Button 
              variant="outline"
              onClick={handleMigrateWatchlist}
              disabled={isMigrating}
              className="w-full sm:w-auto"
            >
              {isMigrating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Міграція...
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Мігрувати старий список
                </>
              )}
            </Button>
          )}
          
          <Button
            variant="default"
            onClick={() => setIsCreateDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Створити список
          </Button>
        </div>
      </div>
      
      <Separator />
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : watchlists.length > 0 ? (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Бокова панель зі списками */}
          <div className="md:w-1/4 lg:w-1/5">
            <div className="bg-card rounded-lg border shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-4">Мої списки</h2>
              <ScrollArea className="h-[calc(100vh-220px)]">
                <div className="space-y-2 pr-4">
                  {watchlists.map(list => (
                    <button
                      key={list.id}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-md transition-colors group",
                        activeWatchlistId === list.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      )}
                      onClick={() => setActiveWatchlistId(list.id)}
                    >
                      <div 
                        className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center"
                        style={{ backgroundColor: list.color || '#3b82f6' }}
                      >
                        {getWatchlistIcon(list)}
                      </div>
                      <div className="flex-1 text-left overflow-hidden">
                        <p className="font-medium truncate">{list.name}</p>
                        <WatchlistMovieCount watchlistId={list.id} />
                      </div>
                      
                      {!list.isDefault && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100"
                              onClick={e => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditDialog(list);
                              }}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Редагувати
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDeleteDialog(list);
                              }}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Видалити
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Новий список
              </Button>
            </div>
          </div>
          
          {/* Вміст активного списку */}
          <div className="md:w-3/4 lg:w-4/5">
            {activeWatchlistId ? (
              <ActiveWatchlistContent watchlistId={activeWatchlistId} />
            ) : (
              <div className="flex flex-col items-center justify-center h-64 border rounded-lg">
                <p className="text-muted-foreground">Виберіть список перегляду з бічної панелі</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 space-y-6">
          <BookmarkIcon className="h-16 w-16 text-muted-foreground" />
          <div className="text-center max-w-md space-y-2">
            <h2 className="text-xl font-semibold">У вас ще немає списків перегляду</h2>
            <p className="text-muted-foreground">
              Створіть свій перший список перегляду для організації фільмів
            </p>
          </div>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            size="lg"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Створити перший список
          </Button>
        </div>
      )}
      
      {/* Діалог для створення нового списку */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Створити новий список</DialogTitle>
            <DialogDescription>
              Створіть новий список перегляду для організації фільмів.
            </DialogDescription>
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
                  "Створити список"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Діалог для редагування списку */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редагувати список</DialogTitle>
            <DialogDescription>
              Змініть деталі списку перегляду.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleUpdateWatchlist(); }}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Назва списку</Label>
                <Input
                  id="edit-name"
                  value={editWatchlistName}
                  onChange={(e) => setEditWatchlistName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Опис (необов'язково)</Label>
                <Textarea
                  id="edit-description"
                  value={editWatchlistDescription}
                  onChange={(e) => setEditWatchlistDescription(e.target.value)}
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
                        editWatchlistColor === color.value && "ring-2 ring-black dark:ring-white ring-offset-2"
                      )}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setEditWatchlistColor(color.value)}
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
                onClick={() => setIsEditDialogOpen(false)}
              >
                Скасувати
              </Button>
              <Button 
                type="submit"
                disabled={!editWatchlistName.trim()}
              >
                Зберегти зміни
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Діалог для видалення списку */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Видалити список</DialogTitle>
            <DialogDescription>
              Ви впевнені, що хочете видалити список "{selectedWatchlist?.name}"?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              Усі фільми з цього списку будуть перенесені до списку "Невідсортоване".
              Ця дія не може бути скасована.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Скасувати
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteWatchlist}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Видалення...
                </>
              ) : (
                "Видалити"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Компонент для відображення кількості фільмів у списку
function WatchlistMovieCount({ watchlistId }: { watchlistId: number }) {
  const { movies, isLoading } = useWatchlistDetails(watchlistId);
  
  if (isLoading) {
    return (
      <span className="text-xs text-muted-foreground opacity-70">
        Завантаження...
      </span>
    );
  }
  
  return (
    <span className="text-xs text-muted-foreground opacity-70">
      {movies.length} {movies.length === 1 ? 'фільм' : movies.length < 5 ? 'фільми' : 'фільмів'}
    </span>
  );
}

// Компонент для відображення вмісту активного списку
function ActiveWatchlistContent({ watchlistId }: { watchlistId: number }) {
  const { watchlist, movies, isLoading, isError } = useWatchlistDetails(watchlistId);
  const router = useRouter();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (isError || !watchlist) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Помилка завантаження списку</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>
          Спробувати знову
        </Button>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div 
            className="flex-shrink-0 w-10 h-10 rounded-md flex items-center justify-center"
            style={{ backgroundColor: watchlist.color || '#3b82f6' }}
          >
            {watchlist.isDefault ? <Inbox className="h-6 w-6" /> : <List className="h-6 w-6" />}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{watchlist.name}</h2>
            {watchlist.description && (
              <p className="text-muted-foreground text-sm">{watchlist.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <p className="text-sm text-muted-foreground mr-2">
            {movies.length} {movies.length === 1 ? 'фільм' : movies.length < 5 ? 'фільми' : 'фільмів'}
          </p>
          
          <Button
            variant="outline" 
            size="sm"
            onClick={() => router.push('/')}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Додати фільми
          </Button>
        </div>
      </div>
      
      {movies.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-12 space-y-4 border rounded-lg">
        <Film className="h-16 w-16 text-muted-foreground" />
        <h3 className="text-xl font-semibold">Список порожній</h3>
        <p className="text-muted-foreground text-center max-w-md">
          У цьому списку ще немає фільмів. Додайте фільми, щоб вони з'явились тут.
        </p>
        <Button onClick={() => router.push('/')} className="mt-4">
          Шукати фільми
        </Button>
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {movies.map(movie => (
          <WatchlistMovieCard
            key={movie.id}
            movie={movie}
            watchlistId={watchlistId}
          />
        ))}
      </div>
    )}
    </div>
  );
}