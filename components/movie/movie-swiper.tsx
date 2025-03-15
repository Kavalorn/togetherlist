// components/movie/movie-swiper.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { Button } from '@/components/ui/button';
import { Star, ThumbsDown, ThumbsUp, Info, Loader2, Filter, Eye, EyeOff } from 'lucide-react';
import { useMovieDetails } from '@/hooks/use-movies';
import { useWatchlist } from '@/hooks/use-watchlist';
import { useWatchedMovies } from '@/hooks/use-watched-movies';
import { useUIStore } from '@/store/ui-store';
import { Badge } from '../ui/badge';
import { Movie, MovieDetails } from '@/lib/tmdb';
import { Card } from '../ui/card';
import { toast } from 'sonner';
import { tmdbApi } from '@/lib/tmdb';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

// Функція для безпечного перетворення значення на число
function safeNumberConversion(value: any): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseInt(value, 10) || 0;
  return 0;
}

// Тип для фільтрів
interface MovieFilters {
  minRating: number;
  maxRating: number;
  minYear: number;
  maxYear: number;
  language: string;
  includeAdult: boolean;
  genre: string | null;
}

// Ключ для збереження фільтрів в localStorage
const FILTERS_STORAGE_KEY = 'movie-swiper-filters';

// Функція для форматування дати
function formatYear(dateString: string) {
  if (!dateString) return '';
  return new Date(dateString).getFullYear().toString();
}

export function MovieSwiper() {
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { isWatched, markAsWatched, removeFromWatched, isMarking, isRemoving } = useWatchedMovies();
  const { openMovieDetailsModal } = useUIStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const [isMarkingWatched, setIsMarkingWatched] = useState(false);

  // Початкові значення фільтрів з localStorage або за замовчуванням
  const [filters, setFilters] = useState<MovieFilters>(() => {
    // Спочатку перевіряємо, чи є збережені фільтри
    if (typeof window !== 'undefined') {
      const savedFilters = localStorage.getItem(FILTERS_STORAGE_KEY);
      if (savedFilters) {
        try {
          return JSON.parse(savedFilters);
        } catch (e) {
          console.error("Помилка при розборі збережених фільтрів:", e);
        }
      }
    }
    // Якщо немає збережених фільтрів або сталася помилка, використовуємо значення за замовчуванням
    return {
      minRating: 0,
      maxRating: 10,
      minYear: 1900,
      maxYear: currentYear,
      language: 'any',
      includeAdult: false,
      genre: null
    };
  });

  // Збереження фільтрів у localStorage при їх зміні
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
    }
  }, [filters]);

  // Отримуємо деталі поточного фільму
  const { data: movieDetails } = useMovieDetails(currentMovie?.id || null);
  
  // Перевіряємо чи фільм переглянуто
  const movieWatched = isWatched(currentMovie?.id || 0);
  
  // Відстежуємо зміни статусу перегляду
  useEffect(() => {
    if (currentMovie) {
      const isWatchedStatus = isWatched(currentMovie.id);
      console.log(`Фільм ${currentMovie.title} переглянуто: ${isWatchedStatus}`);
    }
  }, [currentMovie, isWatched]);

  // Оновлюємо розмір вікна при завантаженні та зміні розміру
  useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize({ 
        width: window.innerWidth, 
        height: window.innerHeight 
      });
    };
    
    // Ініціалізація при завантаженні
    updateWindowSize();
    
    // Слухаємо зміни розміру вікна
    window.addEventListener('resize', updateWindowSize);
    
    return () => {
      window.removeEventListener('resize', updateWindowSize);
    };
  }, []);

  // Завантажуємо випадковий фільм з урахуванням фільтрів
  const loadRandomMovie = async () => {
    setLoading(true);
    try {
      // Передаємо фільтри в API
      const movie = await tmdbApi.getRandomMovie({
        minRating: filters.minRating,
        maxRating: filters.maxRating,
        minYear: filters.minYear,
        maxYear: filters.maxYear,
        language: filters.language === 'any' ? null : filters.language,
        includeAdult: filters.includeAdult,
        genre: filters.genre
      });
      setCurrentMovie(movie);
      
      // Логуємо для відлагодження
      console.log("Завантажено випадковий фільм:", {
        id: movie.id,
        title: movie.title,
        vote_count: movie.vote_count,
        vote_average: movie.vote_average
      });
    } catch (error) {
      console.error("Помилка при завантаженні фільму:", error);
      toast.error("Не вдалося завантажити фільм. Спробуйте ще раз.");
    } finally {
      setLoading(false);
    }
  };

  // Завантажуємо перший фільм при монтуванні компонента
  useEffect(() => {
    loadRandomMovie();
  }, []);

  // Обробник для кнопки переглянуто/не переглянуто
  const handleToggleWatched = () => {
    if (!currentMovie) return;
    
    setIsMarkingWatched(true);
    
    const movieData = {
      id: currentMovie.id,
      title: currentMovie.title,
      poster_path: currentMovie.poster_path,
      release_date: currentMovie.release_date,
      overview: currentMovie.overview,
      vote_average: currentMovie.vote_average,
      vote_count: safeNumberConversion(currentMovie.vote_count)
    };
    
    if (movieWatched) {
      // Видаляємо з переглянутих
      removeFromWatched(currentMovie.id, {
        onSuccess: () => {
          toast.success(`"${currentMovie.title}" прибрано з переглянутих фільмів`);
          setIsMarkingWatched(false);
        },
        onError: (error: any) => {
          toast.error(`Помилка: ${error.message || 'Не вдалося видалити фільм'}`);
          setIsMarkingWatched(false);
        }
      });
    } else {
      // Позначаємо як переглянутий
      markAsWatched({ movie: movieData as any }, {
        onSuccess: () => {
          toast.success(`"${currentMovie.title}" позначено як переглянутий`);
          setIsMarkingWatched(false);
        },
        onError: (error: any) => {
          toast.error(`Помилка: ${error.message || 'Не вдалося позначити фільм'}`);
          setIsMarkingWatched(false);
        }
      });
    }
  };

  // Налаштування анімації з react-spring
  const [props, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rotation: 0,
    scale: 1,
    config: { tension: 300, friction: 20 }
  }));

  // Обробник свайпів з use-gesture
  const bind = useDrag(({ active, movement: [mx], direction: [xDir], velocity: [vx] }) => {
    // Розраховуємо поворот на основі відстані переміщення
    const rot = mx / 100;
    
    // Показуємо, куди зараз свайпається (лайк/дизлайк)
    if (mx > 50) {
      setDirection('right');
    } else if (mx < -50) {
      setDirection('left');
    } else {
      setDirection(null);
    }
    
    if (!active && Math.abs(mx) > 100) {
      // Свайп завершено і перевищено поріг
      setGone(true);
      
      // Анімуємо картку, щоб вона "вилетіла" з екрану
      api.start({ 
        x: (200 + windowSize.width) * (mx > 0 ? 1 : -1), 
        rotation: rot * 10, 
        config: { friction: 50, tension: 200 } 
      });
      
      if (mx > 0) {
        // Свайп вправо (лайк)
        handleLike();
      } else {
        // Свайп вліво (дизлайк)
        handleDislike();
      }
      
      // Затримка перед показом наступної картки
      setTimeout(() => {
        setGone(false);
        api.start({ x: 0, y: 0, rotation: 0, scale: 1 });
        loadRandomMovie(); // Завантажуємо новий випадковий фільм
      }, 300);
    } else if (!active) {
      // Повертаємо картку на місце, якщо свайп не завершено
      api.start({ x: 0, rotation: 0, scale: 1 });
      setDirection(null);
    } else {
      // Оновлюємо позицію та поворот картки під час свайпу
      api.start({ 
        x: mx, 
        rotation: rot, 
        scale: 1.03,
        immediate: true 
      });
    }
  }, {
    filterTaps: true,
    // Обмежуємо свайпи тільки по горизонталі
    axis: 'x'
  });

  // Обробник для кнопки "Лайк"
  const handleLike = () => {
    if (currentMovie && !isInWatchlist(currentMovie.id)) {
      // Переконуємося, що передаємо коректні дані, включно з vote_count
      const movieToAdd = {
        ...currentMovie,
        vote_count: safeNumberConversion(currentMovie.vote_count)
      };
      
      toggleWatchlist(movieToAdd as MovieDetails);
      toast.success('Фільм додано до списку перегляду');
    }
  };

  // Обробник для кнопки "Дизлайк"
  const handleDislike = () => {
    // При дизлайку просто переходимо до наступного фільму
  };

  // Обробка кнопок лайк/дизлайк
  const handleButtonLike = () => {
    // Імітуємо анімацію свайпу вправо
    api.start({ 
      x: (200 + windowSize.width), 
      rotation: 15, 
      config: { friction: 50, tension: 200 } 
    });
    
    setDirection('right');
    setGone(true);
    handleLike();
    
    setTimeout(() => {
      setGone(false);
      api.start({ x: 0, y: 0, rotation: 0, scale: 1 });
      loadRandomMovie(); // Завантажуємо новий випадковий фільм
      setDirection(null);
    }, 300);
  };

  const handleButtonDislike = () => {
    // Імітуємо анімацію свайпу вліво
    api.start({ 
      x: -(200 + windowSize.width), 
      rotation: -15, 
      config: { friction: 50, tension: 200 } 
    });
    
    setDirection('left');
    setGone(true);
    handleDislike();
    
    setTimeout(() => {
      setGone(false);
      api.start({ x: 0, y: 0, rotation: 0, scale: 1 });
      loadRandomMovie(); // Завантажуємо новий випадковий фільм
      setDirection(null);
    }, 300);
  };

  // Скидання фільтрів до значень за замовчуванням
  const resetFilters = () => {
    const defaultFilters = {
      minRating: 0,
      maxRating: 10,
      minYear: 1900,
      maxYear: currentYear,
      language: 'any',
      includeAdult: false,
      genre: null
    };
    setFilters(defaultFilters);
    // Зберігаємо значення за замовчуванням в localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(defaultFilters));
    }
  };

  // Застосування фільтрів і завантаження нового фільму
  const applyFilters = () => {
    setFiltersOpen(false);
    loadRandomMovie();
  };

  // Розрахунок оптимальної висоти картки для мобільних пристроїв
  const calculateCardHeight = () => {
    // Для мобільних пристроїв - максимально використовуємо простір
    if (windowSize.width <= 768) {
      // Віднімаємо висоту хедера (64px) і відступ для нижнього тексту (40px)
      return windowSize.height - 104;
    }
    
    // Для десктопів використовуємо фіксовану висоту або відносну від висоти вікна
    return Math.min(windowSize.height * 0.85, 700);
  };

  // Список жанрів TMDB
  const genres = [
    { id: 28, name: "Бойовик" },
    { id: 12, name: "Пригоди" },
    { id: 16, name: "Анімація" },
    { id: 35, name: "Комедія" },
    { id: 80, name: "Кримінал" },
    { id: 99, name: "Документальний" },
    { id: 18, name: "Драма" },
    { id: 10751, name: "Сімейний" },
    { id: 14, name: "Фентезі" },
    { id: 36, name: "Історичний" },
    { id: 27, name: "Жахи" },
    { id: 10402, name: "Музика" },
    { id: 9648, name: "Детектив" },
    { id: 10749, name: "Романтика" },
    { id: 878, name: "Наукова фантастика" },
    { id: 10770, name: "ТВ фільм" },
    { id: 53, name: "Трилер" },
    { id: 10752, name: "Військовий" },
    { id: 37, name: "Вестерн" }
  ];

  // Список мов
  const languages = [
    { code: 'any', name: 'Будь-яка' },
    { code: 'en', name: 'Англійська' },
    { code: 'fr', name: 'Французька' },
    { code: 'es', name: 'Іспанська' },
    { code: 'de', name: 'Німецька' },
    { code: 'it', name: 'Італійська' },
    { code: 'ja', name: 'Японська' },
    { code: 'ko', name: 'Корейська' },
    { code: 'zh', name: 'Китайська' },
    { code: 'ru', name: 'Російська' },
    { code: 'uk', name: 'Українська' }
  ];

  if (loading && !currentMovie) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Завантаження фільму...</p>
      </div>
    );
  }

  if (!currentMovie) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full">
        <p className="text-xl font-semibold mb-4">Не вдалося завантажити фільм</p>
        <Button onClick={loadRandomMovie}>Спробувати знову</Button>
      </div>
    );
  }
  
  // Отримуємо коректне значення vote_count
  const voteCount = safeNumberConversion(currentMovie.vote_count);

  return (
    <>
      <div className="fixed inset-0 top-16 flex flex-col items-center">
        {/* Кнопка фільтрів - перенесена з картки на бокову частину екрану */}
        <div className="fixed top-20 right-4 z-50">
          <Button 
            variant="default" 
            size="icon" 
            className="rounded-full shadow-lg bg-primary text-primary-foreground border-0"
            onClick={() => setFiltersOpen(true)}
          >
            <Filter className="h-5 w-5" />
          </Button>
        </div>

        {/* Кнопка швидкого перемикання статусу перегляду */}
        <div className="fixed top-20 left-4 z-50">
          <Button 
            variant="default" 
            size="icon" 
            className={`rounded-full shadow-lg ${movieWatched ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-500/70 hover:bg-gray-600'} text-white border-0`}
            onClick={handleToggleWatched}
            disabled={isMarkingWatched}
          >
            {isMarkingWatched ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : movieWatched ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </Button>
        </div>

        <div className="relative w-full max-w-md mx-auto px-4 pt-2 flex-1 flex flex-col h-full">
          <div 
            className="relative w-full flex-grow"
            style={{ height: `${calculateCardHeight()}px` }}
          >
            {/* Картка фільму з анімацією */}
            <animated.div
              {...bind()}
              style={{
                x: props.x,
                y: props.y,
                rotate: props.rotation,
                scale: props.scale,
                touchAction: 'none'
              }}
              className="absolute top-0 left-0 w-full h-full will-change-transform touch-none"
            >
              <Card className="relative w-full h-full overflow-hidden rounded-2xl shadow-xl">
                {/* Зображення фільму */}
                <div className="absolute inset-0 bg-muted">
                  {currentMovie.poster_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w780${currentMovie.poster_path}`}
                      alt={currentMovie.title}
                      fill
                      className={`object-cover ${movieWatched ? 'opacity-80' : ''}`}
                      priority
                      sizes="(max-width: 768px) 100vw, 500px"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">Немає зображення</p>
                    </div>
                  )}
                  
                  {/* Індикатор переглянутого фільму */}
                  {movieWatched && (
                    <div className="absolute top-4 right-4 bg-blue-500/80 text-white px-3 py-1 rounded-full flex items-center gap-2 z-20">
                      <Eye className="h-4 w-4" />
                      <span>Переглянуто</span>
                    </div>
                  )}
                  
                  {/* Оверлей для переглянутих фільмів */}
                  {movieWatched && (
                    <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10 z-10">
                      <div className="bg-blue-500/40 p-4 rounded-full">
                        <Eye className="h-16 w-16 text-white" />
                      </div>
                    </div>
                  )}
                  
                  {/* Індикатори свайпу */}
                  {direction === 'right' && (
                    <div className="absolute top-10 right-10 transform rotate-12 border-4 border-green-500 rounded-md px-4 py-2 bg-green-500/30 z-30">
                      <span className="text-white text-xl font-bold">ПОДОБАЄТЬСЯ</span>
                    </div>
                  )}
                  {direction === 'left' && (
                    <div className="absolute top-10 left-10 transform -rotate-12 border-4 border-red-500 rounded-md px-4 py-2 bg-red-500/30 z-30">
                      <span className="text-white text-xl font-bold">ПРОПУСТИТИ</span>
                    </div>
                  )}
                </div>

                {/* Інформація про фільм з більш прозорою підложкою і градієнтним переходом */}
                <div className="absolute bottom-0 left-0 right-0 z-20">
                  {/* Градієнтний перехід, який починається вище на постері */}
                  <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/100 via-black/90 to-transparent"></div>
                  
                  {/* Контент з інформацією */}
                  <div className="relative p-3 pb-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {currentMovie.vote_average ? (
                          <Badge variant="secondary" className="bg-yellow-500/80 text-white">
                            <Star className="w-3 h-3 mr-1" />
                            {currentMovie.vote_average.toFixed(1)} ({voteCount})
                          </Badge>
                        ) : null}
                        {currentMovie.release_date && (
                          <Badge variant="outline" className="bg-black/20 text-white border-none">
                            {formatYear(currentMovie.release_date)}
                          </Badge>
                        )}
                        {movieWatched && (
                          <Badge variant="secondary" className="bg-blue-500/80 text-white ml-auto">
                            <Eye className="w-3 h-3 mr-1" />
                            Переглянуто
                          </Badge>
                        )}
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 drop-shadow-md line-clamp-2">
                        {currentMovie.title}
                      </h2>
                      <p className="text-white/90 text-xs sm:text-sm line-clamp-2 drop-shadow-md mb-2">
                        {currentMovie.overview || 'Опис відсутній'}
                      </p>
                      
                      {/* Кнопки дій */}
                      <div className="flex justify-between pt-2">
                        <Button
                          onClick={handleButtonDislike}
                          variant="destructive"
                          size="icon"
                          className="rounded-full h-12 w-12 shadow-lg"
                        >
                          <ThumbsDown className="h-5 w-5" />
                        </Button>

                        {/* Кнопка переглянуто/не переглянуто */}
                        <Button
                          onClick={handleToggleWatched}
                          variant="default"
                          size="icon"
                          className={`rounded-full h-12 w-12 shadow-lg ${
                            movieWatched ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-500 hover:bg-gray-600'
                          }`}
                          disabled={isMarkingWatched}
                        >
                          {isMarkingWatched ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : movieWatched ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </Button>
                        
                        <Button
                          onClick={() => {
                            if (movieDetails) {
                              openMovieDetailsModal(movieDetails);
                            }
                          }}
                          variant="secondary"
                          size="icon"
                          className="rounded-full h-12 w-12 bg-white text-gray-800 shadow-lg"
                        >
                          <Info className="h-5 w-5" />
                        </Button>
                        
                        <Button
                          onClick={handleButtonLike}
                          variant="default"
                          size="icon"
                          className="rounded-full h-12 w-12 bg-green-500 hover:bg-green-600 shadow-lg"
                        >
                          <ThumbsUp className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </animated.div>
          </div>
          
          <div className="text-center my-2 text-xs md:text-sm text-muted-foreground px-4">
            <p>Проведіть вліво, щоб пропустити, або вправо, щоб додати до списку перегляду</p>
          </div>
        </div>
      </div>

      {/* Панель фільтрів */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent className="p-0 sm:max-w-md">
          <div className="h-full flex flex-col">
            <SheetHeader className="p-6 pb-2">
              <SheetTitle>Фільтри</SheetTitle>
              <SheetDescription>
                Налаштуйте параметри для пошуку фільмів
              </SheetDescription>
            </SheetHeader>
            
            <div className="px-6 py-4 flex-1 overflow-auto space-y-6">
              {/* Рейтинг фільму */}
              <div className="space-y-2">
                <Label>Рейтинг фільму ({filters.minRating} - {filters.maxRating})</Label>
                <Slider 
                  min={0} 
                  max={10} 
                  step={0.5} 
                  value={[filters.minRating, filters.maxRating]} 
                  onValueChange={(values) => setFilters({
                    ...filters,
                    minRating: values[0],
                    maxRating: values[1]
                  })}
                />
              </div>
              
              {/* Рік випуску */}
              <div className="space-y-2">
                <Label>Рік випуску ({filters.minYear} - {filters.maxYear})</Label>
                <Slider 
                  min={1900} 
                  max={currentYear} 
                  step={1} 
                  value={[filters.minYear, filters.maxYear]} 
                  onValueChange={(values) => setFilters({
                    ...filters,
                    minYear: values[0],
                    maxYear: values[1]
                  })}
                />
              </div>
              
              {/* Мова */}
              <div className="space-y-2">
                <Label htmlFor="language">Мова</Label>
                <Select 
                  value={filters.language} 
                  onValueChange={(value) => setFilters({...filters, language: value})}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Виберіть мову" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(lang => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Жанр */}
              <div className="space-y-2">
                <Label htmlFor="genre">Жанр</Label>
                <Select 
                  value={filters.genre || "any"} 
                  onValueChange={(value) => setFilters({...filters, genre: value === "any" ? null : value})}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Виберіть жанр" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Будь-який</SelectItem>
                    {genres.map(genre => (
                      <SelectItem key={genre.id} value={genre.id.toString()}>
                        {genre.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Включати дорослий контент */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeAdult" 
                  checked={filters.includeAdult} 
                  onCheckedChange={(checked) => 
                    setFilters({...filters, includeAdult: Boolean(checked)})
                  }
                />
                <Label htmlFor="includeAdult">Включати дорослий контент</Label>
              </div>
            </div>
            
            <SheetFooter className="p-4 border-t">
              <div className="flex flex-col gap-3 w-full">
                <Button variant="outline" onClick={resetFilters} className="w-full">
                  Скинути
                </Button>
                <SheetClose asChild>
                  <Button onClick={applyFilters} className="w-full">
                    Застосувати
                  </Button>
                </SheetClose>
              </div>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}