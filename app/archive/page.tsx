'use client';

import { useEffect, useState, Suspense, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWatchedMovies } from '@/hooks/use-watched-movies';
import { useAuthStore } from '@/store/auth-store';
import { MovieCard } from '@/components/movie/movie-card';
import { Button } from '@/components/ui/button';
import {
  Search, Film,
  Loader2, SlidersHorizontal, X
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
import { Badge } from '@/components/ui/badge';

// Типи даних для фільмів
interface Movie {
  id?: number;
  movie_id?: number;
  title: string;
  poster_path: string;
  release_date?: string;
  watched_at?: string;
  overview?: string;
  vote_average?: number;
  vote_count?: number;
  rating?: number;
}

interface AnimatedMovieCardProps {
  movie: Movie;
  index: number;
  isNewBatch: boolean;
}

// Компонент для анімованої появи картки фільму
const AnimatedMovieCard: React.FC<AnimatedMovieCardProps> = ({ movie, index, isNewBatch }) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Затримка появи кожної картки для ефекту послідовної анімації
    // Якщо це нова партія, затримка буде менша для швидшої появи
    const delay: number = isNewBatch ? (index % 9) * 50 : index * 100;

    const timer: NodeJS.Timeout = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [index, isNewBatch]);

  return (
    <div
      ref={cardRef}
      className={`transition-all duration-500 ease-in-out h-full ${isVisible
          ? 'opacity-100 transform translate-y-0'
          : 'opacity-0 transform translate-y-8'
        }`}
    >
      <MovieCard
        movie={{
          id: movie.movie_id || movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          release_date: movie.release_date,
          overview: movie.overview,
          vote_average: movie.vote_average || 0,
          vote_count: movie.vote_count || 0,
        }}
      />
    </div>
  );
};

export default function ArchivePage(): JSX.Element {
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

function ArchiveContent(): JSX.Element {
  const { watchedMovies, isLoading } = useWatchedMovies();
  const { user, isLoading: isAuthLoading } = useAuthStore();
  const router = useRouter();

  // Стан фільтрів
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'rating_desc' | 'rating_asc'>('date_desc');
  const [genreFilter, setGenreFilter] = useState<string | null>(null);
  const [yearRange, setYearRange] = useState<[number, number]>([1900, new Date().getFullYear()]);
  const [ratingRange, setRatingRange] = useState<[number, number]>([0, 10]);

  // Стан для лінивого завантаження
  const [visibleCount, setVisibleCount] = useState<number>(9); // Початкова кількість відображених фільмів
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false); // Індикатор завантаження додаткових фільмів
  const [lastBatchCount, setLastBatchCount] = useState<number>(0); // Кількість елементів у попередній партії
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Функція для завантаження додаткових фільмів при прокручуванні
  const loadMoreMovies = useCallback((): void => {
    if (isLoadingMore) return; // Запобігаємо повторному запуску під час завантаження

    setIsLoadingMore(true); // Вмикаємо індикатор завантаження
    setLastBatchCount(visibleCount); // Зберігаємо кількість перед додаванням нових

    // Імітуємо затримку завантаження для демонстрації спіннера
    setTimeout(() => {
      setVisibleCount(prev => prev + 9); // Завантажуємо ще 9 фільмів
      setIsLoadingMore(false); // Вимикаємо індикатор завантаження
    }, 500); // Затримка 500 мс для демонстрації спіннера
  }, [isLoadingMore, visibleCount]);

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
  const filteredMovies: Movie[] = watchedMovies
    .filter((movie: Movie) => {
      // Фільтрація за пошуковим запитом
      if (searchTerm && !movie.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Фільтрація за роком
      if (movie.release_date) {
        const year: number = new Date(movie.release_date).getFullYear();
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

      return true;
    })
    .sort((a: Movie, b: Movie) => {
      // Сортування за датою додавання
      if (sortBy === 'date_desc') {
        return new Date(b.watched_at || '').getTime() - new Date(a.watched_at || '').getTime();
      }
      if (sortBy === 'date_asc') {
        return new Date(a.watched_at || '').getTime() - new Date(b.watched_at || '').getTime();
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

  // Отримання видимих фільмів з урахуванням лінивого завантаження
  const visibleMovies: Movie[] = filteredMovies.slice(0, visibleCount);

  // Додаємо спостереження за останнім елементом для безкінечного прокручування
  const lastMovieRef = useCallback((node: HTMLDivElement | null): void => {
    // Спочатку відключаємо попередні спостереження, якщо вони є
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Якщо немає елемента, нічого не робимо
    if (!node) return;

    // Створюємо новий спостерігач
    observerRef.current = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        if (entries[0].isIntersecting && filteredMovies.length > visibleCount) {
          loadMoreMovies();
        }
      },
      {
        rootMargin: '200px', // Збільшуємо відступ, щоб завантаження починалося раніше
        threshold: 0.1
      }
    );

    // Починаємо спостереження за новим елементом
    observerRef.current.observe(node);
  }, [loadMoreMovies, filteredMovies.length, visibleCount]);

  // Відключаємо спостерігача при розмонтуванні компонента
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // При зміні фільтрів скидаємо кількість видимих елементів
  useEffect(() => {
    setVisibleCount(9);
    setLastBatchCount(0);
  }, [searchTerm, sortBy, genreFilter, yearRange, ratingRange]);

  // Отримання статистики
  const totalMovies: number = watchedMovies.length;
  const currentYear: number = new Date().getFullYear();
  const moviesThisYear: number = watchedMovies.filter((movie: Movie) =>
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
  const clearFilters = (): void => {
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

              <div className="p-4 space-y-6">
                <div className="space-y-2">
                  <Label>Сортувати за</Label>
                  <Select value={sortBy} onValueChange={(value: string) => setSortBy(value as 'date_desc' | 'date_asc' | 'rating_desc' | 'rating_asc')}>
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

      <Separator />

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredMovies.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {visibleMovies.map((movie: Movie, index: number) => {
              // Застосовуємо ref тільки до останнього елемента
              const isLastItem: boolean = index === visibleMovies.length - 1;

              // Визначаємо, чи цей елемент є з нової партії
              const isNewBatch: boolean = index >= lastBatchCount;

              return (
                <div
                  key={movie.id || movie.movie_id}
                  ref={isLastItem && filteredMovies.length > visibleCount ? lastMovieRef : undefined}
                  className="h-full flex flex-col"
                >
                  <AnimatedMovieCard
                    movie={movie}
                    index={index}
                    isNewBatch={isNewBatch}
                  />
                </div>
              );
            })}
          </div>

          {filteredMovies.length > visibleCount && (
            <div className="flex justify-center mt-8 mb-8">
              <Button
                onClick={loadMoreMovies}
                variant="outline"
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Завантаження...
                  </>
                ) : (
                  'Завантажити ще'
                )}
              </Button>
            </div>
          )}
        </>
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
  );
}