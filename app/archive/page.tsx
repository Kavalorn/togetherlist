'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useWatchedMovies } from '@/hooks/use-watched-movies';
import { useAuthStore } from '@/store/auth-store';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { MovieCard } from '@/components/movie/movie-card';
import { Button } from '@/components/ui/button';
import { 
  Search, Film, Eye, EyeOff, 
  Loader2, Calendar, Star, SlidersHorizontal, X 
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ArchivePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Завантаження...</p>
      </div>
    }>
      <ArchiveContent />
    </Suspense>
  );
}

function ArchiveContent() {
  const { watchedMovies, isLoading, refetch } = useWatchedMovies();
  const { user, isLoading: isAuthLoading } = useAuthStore();
  const router = useRouter();
  
  // Стан фільтрів
  const [searchTerm, setSearchTerm] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'rating_desc' | 'rating_asc'>('date_desc');
  const [genreFilter, setGenreFilter] = useState<string | null>(null);
  const [yearRange, setYearRange] = useState<[number, number]>([1900, new Date().getFullYear()]);
  const [ratingRange, setRatingRange] = useState<[number, number]>([0, 10]);
  
  // Ініціалізація стану аутентифікації при завантаженні сторінки
  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);
  
  // Автоматичний перехід на сторінку входу, якщо користувач не авторизований
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/');
    }
  }, [isAuthLoading, user, router]);
  
  // Фільтрація та сортування фільмів
  const filteredMovies = watchedMovies
    .filter(movie => {
      // Фільтрація за пошуковим запитом
      if (searchTerm && !movie.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Фільтрація за роком
      if (movie.release_date) {
        const year = new Date(movie.release_date).getFullYear();
        if (year < yearRange[0] || year > yearRange[1]) {
          return false;
        }
      }
      
      // Фільтрація за рейтингом
      if (movie.vote_average !== undefined && movie.vote_average !== null) {
        if (movie.vote_average < ratingRange[0] || movie.vote_average > ratingRange[1]) {
          return false;
        }
      }
      
      // Фільтр по жанру буде працювати, якщо додати деталі фільмів з жанрами
      
      return true;
    })
    .sort((a, b) => {
      // Сортування за датою додавання
      if (sortBy === 'date_desc') {
        return new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime();
      }
      if (sortBy === 'date_asc') {
        return new Date(a.watched_at).getTime() - new Date(b.watched_at).getTime();
      }
      // Сортування за рейтингом
      if (sortBy === 'rating_desc') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === 'rating_asc') {
        return (a.rating || 0) - (b.rating || 0);
      }
      return 0;
    });
  
  // Отримання статистики
  const totalMovies = watchedMovies.length;
  const averageRating = watchedMovies.reduce((sum, movie) => sum + (movie.rating || 0), 0) / (watchedMovies.filter(movie => movie.rating).length || 1);
  const currentYear = new Date().getFullYear();
  const moviesThisYear = watchedMovies.filter(movie => 
    movie.watched_at && new Date(movie.watched_at).getFullYear() === currentYear
  ).length;
  
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
        <h1 className="text-xl sm:text-2xl font-bold mb-4 text-center">Авторизуйтесь для доступу до архіву</h1>
        <p className="text-muted-foreground mb-6 text-center">Для перегляду історії переглянутих фільмів необхідно увійти в свій обліковий запис</p>
        <Button onClick={() => router.push('/')} variant="default">
          На головну
        </Button>
      </div>
    );
  }
  
  // Обробник очищення фільтрів
  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('date_desc');
    setGenreFilter(null);
    setYearRange([1900, new Date().getFullYear()]);
    setRatingRange([0, 10]);
  };
  
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Архів переглянутих фільмів</h1>
          <p className="text-muted-foreground">
            {isLoading
              ? 'Завантаження...'
              : `${totalMovies} переглянутих фільмів`
            }
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:ml-auto w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Пошук в архіві..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full sm:w-[200px]"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Фільтри {(searchTerm || sortBy !== 'date_desc' || genreFilter || yearRange[0] !== 1900 || yearRange[1] !== new Date().getFullYear() || ratingRange[0] !== 0 || ratingRange[1] !== 10) && (
                  <Badge variant="secondary" className="ml-2 px-1 rounded-full">!</Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Фільтри та сортування</SheetTitle>
                <SheetDescription>
                  Налаштуйте відображення переглянутих фільмів
                </SheetDescription>
              </SheetHeader>
              
              <div className="py-4 space-y-6">
                <div className="space-y-2">
                  <Label>Сортувати за</Label>
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Виберіть сортування" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date_desc">Спочатку нові</SelectItem>
                      <SelectItem value="date_asc">Спочатку старі</SelectItem>
                      <SelectItem value="rating_desc">За рейтингом (спадання)</SelectItem>
                      <SelectItem value="rating_asc">За рейтингом (зростання)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Рік випуску ({yearRange[0]} - {yearRange[1]})</Label>
                  <Slider
                    min={1900}
                    max={new Date().getFullYear()}
                    step={1}
                    value={[yearRange[0], yearRange[1]]}
                    onValueChange={(values) => setYearRange(values as [number, number])}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Рейтинг фільмів ({ratingRange[0]} - {ratingRange[1]})</Label>
                  <Slider
                    min={0}
                    max={10}
                    step={0.5}
                    value={[ratingRange[0], ratingRange[1]]}
                    onValueChange={(values) => setRatingRange(values as [number, number])}
                  />
                </div>
              </div>
              
              <SheetFooter className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full sm:w-auto"
                >
                  Скинути фільтри
                </Button>
                <SheetClose asChild>
                  <Button className="w-full sm:w-auto">Застосувати</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Статистика */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Загальна статистика</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Переглянуто:</span>
              <span className="font-medium">{totalMovies} фільмів</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Цього року:</span>
              <span className="font-medium">{moviesThisYear} фільмів</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Середня оцінка:</span>
              <span className="font-medium flex items-center">
                <Star className="h-4 w-4 mr-1 text-yellow-500 fill-yellow-500" />
                {averageRating.toFixed(1)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Separator />
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredMovies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredMovies.map((movie) => (
            <MovieCard
              key={movie.id || movie.movie_id}
              movie={{
                id: movie.movie_id || movie.id,
                title: movie.title,
                poster_path: movie.poster_path,
                release_date: movie.release_date,
                overview: movie.overview,
                vote_average: movie.vote_average || 0,
                vote_count: movie.vote_count || 0
              }}
            />
          ))}
        </div>
      ) : searchTerm || sortBy !== 'date_desc' || genreFilter || yearRange[0] !== 1900 || yearRange[1] !== new Date().getFullYear() || ratingRange[0] !== 0 || ratingRange[1] !== 10 ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4 px-4">
          <p className="text-xl font-semibold text-center">Немає фільмів, що відповідають фільтрам</p>
          <Button variant="outline" onClick={clearFilters}>
            Скинути всі фільтри
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 space-y-4 px-4">
          <Film className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-center">Ваш архів порожній</h2>
          <p className="text-muted-foreground max-w-md text-center">
            Тут будуть зберігатися всі фільми, які ви позначите як переглянуті
          </p>
          <Button onClick={() => router.push('/')} variant="default">
            <Search className="mr-2 h-4 w-4" />
            Знайти фільми
          </Button>
        </div>
      )}
    </div>
  )};