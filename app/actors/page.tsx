// app/actors/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, TrendingUp, UserCheck } from 'lucide-react';
import { useSearchActors, usePopularActors } from '@/hooks/use-actors';
import { useFavoriteActors } from '@/hooks/use-favorite-actors';
import { useAuthStore } from '@/store/auth-store';
import { ActorCard } from '@/components/actor/actor-card';
import { Person } from '@/lib/tmdb';

// Головний компонент сторінки, обгорнутий у Suspense
export default function ActorsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Завантаження...</p>
      </div>
    }>
      <ActorsContent />
    </Suspense>
  );
}

// Компонент сторінки з усією функціональністю
function ActorsContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'search' | 'popular' | 'favorites'>(initialQuery ? 'search' : 'search');
  
  const { user } = useAuthStore();
  const { favoriteActors, isLoading: isFavoritesLoading } = useFavoriteActors();
  
  // Ініціалізація стану аутентифікації при завантаженні сторінки
  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);
  
  // Обробка введення у пошуковому полі з затримкою
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Запити даних
  const { data: searchResults, isLoading: isSearchLoading } = useSearchActors(debouncedQuery);
  const { data: popularActors, isLoading: isPopularLoading } = usePopularActors();
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedQuery(searchQuery);
  };
  
  return (
    <div className="space-y-6 sm:space-y-8">
      <Tabs defaultValue="search" value={activeTab} onValueChange={(value) => setActiveTab(value as 'search' | 'popular' | 'favorites')}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
          <TabsList className='rounded-xs w-full sm:w-auto'>
            <TabsTrigger value="search" className="flex-1 sm:flex-none flex items-center justify-center rounded-xs gap-2">
              <span>Пошук</span>
              <Search className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="popular" className="flex-1 sm:flex-none flex items-center justify-center rounded-xs gap-2">
              <span>Популярні</span>
              <TrendingUp className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex-1 sm:flex-none flex items-center justify-center rounded-xs gap-2">
              <span>Улюблені</span>
              <UserCheck className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="search" className="space-y-4">
          <form onSubmit={handleSearch} className="relative">
            <Input
              type="search"
              placeholder="Пошук акторів..."
              className="pr-10 border h-12 sm:h-14"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-10 w-10 sm:h-12 sm:w-12"
            >
              <Search className="h-4 w-4" />
            </Button>
          </form>
          
          {debouncedQuery ? (
            isSearchLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : searchResults?.results && searchResults.results.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {searchResults.results.map((actor: Person) => (
                  <ActorCard key={actor.id} actor={actor} />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">Нічого не знайдено за запитом "{debouncedQuery}"</p>
              </div>
            )
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Введіть ім'я актора для пошуку</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="popular" className="space-y-4">
          {isPopularLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : popularActors?.results && popularActors.results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {popularActors.results.map((actor: Person) => (
                <ActorCard key={actor.id} actor={actor} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Не вдалося завантажити популярних акторів</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="favorites" className="space-y-4">
          {!user ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Увійдіть в обліковий запис, щоб побачити список улюблених акторів</p>
            </div>
          ) : isFavoritesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : favoriteActors && favoriteActors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {favoriteActors.map((actor: any) => (
                <ActorCard 
                  key={actor.actor_id} 
                  actor={{
                    id: actor.actor_id,
                    name: actor.name,
                    profile_path: actor.profile_path,
                    known_for_department: actor.known_for_department,
                    popularity: actor.popularity
                  }} 
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">У вас ще немає улюблених акторів</p>
              <p className="mt-2 text-muted-foreground">Натисніть на іконку серця на картці актора, щоб додати його до улюблених</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}