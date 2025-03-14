'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, TrendingUp } from 'lucide-react';
import { useSearchMovies, usePopularMovies } from '@/hooks/use-movies';
import { useAuthStore } from '@/store/auth-store';
import { MoviesList } from '@/components/movie/movies-list';

// Головний компонент сторінки, обгорнутий у Suspense
export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Завантаження...</p>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}

// Компонент сторінки з усією функціональністю
function HomePageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'search' | 'popular'>(initialQuery ? 'search' : 'search');
  
  const { user } = useAuthStore();
  
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
  const { data: searchResults, isLoading: isSearchLoading } = useSearchMovies(debouncedQuery);
  const { data: popularMovies, isLoading: isPopularLoading } = usePopularMovies();
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedQuery(searchQuery);
  };
  
  return (
    <div className="space-y-6 sm:space-y-8">
      <Tabs defaultValue="search" value={activeTab} onValueChange={(value) => setActiveTab(value as 'search' | 'popular')}>
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
          </TabsList>
        </div>
        
        <TabsContent value="search" className="space-y-4">
          <form onSubmit={handleSearch} className="relative">
            <Input
              type="search"
              placeholder="Пошук фільмів..."
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
            <MoviesList 
              isLoading={isSearchLoading} 
              movies={searchResults?.results || []}
              emptyPlaceholder={`Нічого не знайдено за запитом "${debouncedQuery}"`}
            />
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Введіть назву фільму для пошуку</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="popular" className="space-y-4">
          <MoviesList 
            isLoading={isPopularLoading} 
            movies={popularMovies?.results || []}
            emptyPlaceholder="Не вдалося завантажити популярні фільми"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}