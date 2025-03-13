'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { MovieCard } from '@/components/movie/movie-card';
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
  const [activeTab, setActiveTab] = useState<'search' | 'popular'>('search');
  
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
    <div className="space-y-8">
      <Tabs defaultValue="search" value={activeTab} onValueChange={(value) => setActiveTab(value as 'search' | 'popular')}>
        <div className="flex justify-between items-center mb-6">
          <TabsList className='rounded-xs'>
            <TabsTrigger value="search" className="flex items-center justify-center rounded-xs gap-2">
              <div>Пошук</div>
              <Search className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="popular" className="flex items-center justify-center rounded-xs gap-2">
              <div>Популярні</div>
              <TrendingUp className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="search" className="space-y-4">
          <form onSubmit={handleSearch} className="relative">
            <Input
              type="search"
              placeholder="Пошук фільмів..."
              className="pr-10 border h-14"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-12 w-12"
            >
              <Search className="h-4 w-4" />
            </Button>
          </form>
          <MoviesList 
            isLoading={isSearchLoading} 
            movies={searchResults?.results || []}
          />
        </TabsContent>
        
        <TabsContent value="popular" className="space-y-4">
          <MoviesList 
            isLoading={isPopularLoading} 
            movies={popularMovies?.results || []}  
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}