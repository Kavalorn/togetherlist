// components/movie/movie-swiper.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { Button } from '@/components/ui/button';
import { Star, ThumbsDown, ThumbsUp, Info, Loader2, Filter, Eye, EyeOff, Film } from 'lucide-react';
import { useMovieDetails } from '@/hooks/use-movies';
import { useWatchedMovies } from '@/hooks/use-watched-movies';
import { useUIStore } from '@/store/ui-store';
import { Movie, MovieDetails } from '@/lib/tmdb';
import { Badge } from '../ui/badge';
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
import { MovieTrailer } from './movie-trailer';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Image from 'next/image';
import { useWatchlistDetails, useWatchlists } from '@/hooks/use-watchlists';

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

// Кількість фільмів для попереднього завантаження
const PRELOAD_MOVIES_COUNT = 3;

// Функція для форматування дати
function formatYear(dateString: string) {
  if (!dateString) return '';
  return new Date(dateString).getFullYear().toString();
}

// Тип для даних фільму з перекладами та інформацією про трейлер
interface EnhancedMovie {
  movie: Movie;
  translations: {
    selectedTranslation: any;
    hasMultipleTranslations: boolean;
    getTitle: () => string;
    getDescription: () => string;
  } | null;
  trailer: {
    hasTrailer: boolean;
  } | null;
  watched: boolean;
}

export function MovieSwiper() {
  // Використовуємо масив фільмів з розширеними даними
  const [enhancedMovies, setEnhancedMovies] = useState<EnhancedMovie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isLanguageSelectorOpen, setIsLanguageSelectorOpen] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [isMarkingWatched, setIsMarkingWatched] = useState(false);
  const currentYear = new Date().getFullYear();

  // Використовуємо аніматор для визначення напрямку свайпу
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const { isWatched, markAsWatched, removeFromWatched } = useWatchedMovies();
  const { watchlists, getDefaultWatchlist } = useWatchlists();
  const { openMovieDetailsModal } = useUIStore();

  // Отримуємо список перегляду за замовчуванням завчасно
  const defaultWatchlist = getDefaultWatchlist();
  const { addMovie } = useWatchlistDetails(defaultWatchlist?.id || null);

  const animationWidth = windowSize.width * 1.2;

  // Стан для поточної та наступної картки (яка прилітає з-за меж екрану)
  const [{ x: currentX, rotation: currentRotation, scale: currentScale }, currentApi] = useSpring(() => ({
    x: 0,
    rotation: 0,
    scale: 1,
    config: { tension: 300, friction: 20 }
  }));

  // Стан для наступної картки (яка прилітає з-за меж екрану)
  const [{ x: nextX, rotation: nextRotation, scale: nextScale, opacity: nextOpacity }, nextApi] = useSpring(() => ({
    x: animationWidth, // Починаємо за межами екрану
    rotation: 15,        // Початковий скос для наступної картки
    scale: 1,
    opacity: 0,          // Початково невидима
    config: { tension: 300, friction: 25 }
  }));

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

  // Функція для асинхронного завантаження розширених даних фільму (переклади, трейлер)
  const loadMovieEnhancements = async (movie: Movie): Promise<EnhancedMovie> => {
    try {
      // Перевіряємо наявність трейлера
      const trailerResponse = await fetch(`/api/movies/${movie.id}/videos`);
      const trailerData = await trailerResponse.json();

      // Шукаємо офіційний трейлер
      const hasTrailer = trailerData.results.some(
        (video: any) => video.site === 'YouTube' && (video.type === 'Trailer' || video.type === 'Teaser')
      );

      // Завантажуємо переклади
      const translationsResponse = await fetch(`/api/movies/${movie.id}/translations`);
      const translationsData = await translationsResponse.json();

      // Фільтруємо переклади, залишаючи тільки ті, що мають опис або заголовок
      const validTranslations = translationsData.translations.filter(
        (t: any) =>
          (t.data.overview && t.data.overview.trim() !== '') ||
          (t.data.title && t.data.title.trim() !== '')
      );

      // Знаходимо найкращий переклад (спочатку українська, потім англійська)
      let selectedTranslation = validTranslations.find((t: any) => t.iso_639_1 === 'uk');
      if (!selectedTranslation) {
        selectedTranslation = validTranslations.find((t: any) => t.iso_639_1 === 'en');
      }
      if (!selectedTranslation && validTranslations.length > 0) {
        selectedTranslation = validTranslations[0];
      }

      // Функція для отримання перекладеного заголовка
      const getTitle = () => {
        if (selectedTranslation?.data?.title) {
          return selectedTranslation.data.title;
        }
        return movie.title || 'Назва відсутня';
      };

      // Функція для отримання перекладеного опису
      const getDescription = () => {
        if (selectedTranslation?.data?.overview) {
          return selectedTranslation.data.overview;
        }
        return movie.overview || 'Опис відсутній';
      };

      // Перевіряємо, чи фільм переглянутий
      const watched = isWatched(movie.id);

      return {
        movie,
        translations: {
          selectedTranslation,
          hasMultipleTranslations: validTranslations.length > 1,
          getTitle,
          getDescription
        },
        trailer: {
          hasTrailer
        },
        watched
      };
    } catch (error) {
      console.error(`Помилка при завантаженні розширених даних для фільму ${movie.id}:`, error);

      // Повертаємо базові дані, якщо сталася помилка
      return {
        movie,
        translations: null,
        trailer: null,
        watched: isWatched(movie.id)
      };
    }
  };

  // Функція для завантаження фільмів з урахуванням фільтрів і їх розширених даних
  const loadMovies = async (count = PRELOAD_MOVIES_COUNT) => {
    try {
      setLoading(true);
      const newMovies = [];

      // Завантажуємо задану кількість фільмів
      for (let i = 0; i < count; i++) {
        const movie = await tmdbApi.getRandomMovie({
          minRating: filters.minRating,
          maxRating: filters.maxRating,
          minYear: filters.minYear,
          maxYear: filters.maxYear,
          language: filters.language === 'any' ? null : filters.language,
          includeAdult: filters.includeAdult,
          genre: filters.genre
        });
        newMovies.push(movie);
      }

      // Завантажуємо розширені дані для кожного фільму
      const enhancedMoviesPromises = newMovies.map(movie => loadMovieEnhancements(movie));
      const loadedEnhancedMovies = await Promise.all(enhancedMoviesPromises);

      // Оновлюємо стан з розширеними фільмами
      setEnhancedMovies(loadedEnhancedMovies);
      setCurrentIndex(0);

      console.log(`Завантажено ${loadedEnhancedMovies.length} фільмів з розширеними даними`);

    } catch (error) {
      console.error("Помилка при завантаженні фільмів:", error);
      toast.error("Не вдалося завантажити фільми. Спробуйте ще раз.");
    } finally {
      setLoading(false);
    }
  };

  // Функція для додавання фільмів до існуючого масиву
  const loadMoreMovies = async (count = 1) => {
    if (loadingMore) return;

    try {
      setLoadingMore(true);
      const newMovies = [];

      for (let i = 0; i < count; i++) {
        const movie = await tmdbApi.getRandomMovie({
          minRating: filters.minRating,
          maxRating: filters.maxRating,
          minYear: filters.minYear,
          maxYear: filters.maxYear,
          language: filters.language === 'any' ? null : filters.language,
          includeAdult: filters.includeAdult,
          genre: filters.genre
        });
        newMovies.push(movie);
      }

      // Завантажуємо розширені дані для кожного фільму
      const enhancedMoviesPromises = newMovies.map(movie => loadMovieEnhancements(movie));
      const loadedEnhancedMovies = await Promise.all(enhancedMoviesPromises);

      // Додаємо нові фільми до масиву
      setEnhancedMovies(prev => [...prev, ...loadedEnhancedMovies]);
      console.log(`Додатково завантажено ${loadedEnhancedMovies.length} фільмів з розширеними даними`);

    } catch (error) {
      console.error("Помилка при завантаженні додаткових фільмів:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Завантажуємо перші фільми при монтуванні компонента
  useEffect(() => {
    loadMovies();
  }, []);

  // Довантажуємо фільми, якщо поточний індекс наближається до кінця масиву
  useEffect(() => {
    if (enhancedMovies.length > 0 && currentIndex >= enhancedMovies.length - 2 && !loadingMore) {
      loadMoreMovies(2);
    }
  }, [currentIndex, enhancedMovies.length, loadingMore]);

  // Отримання поточного фільму та його розширених даних
  const currentEnhancedMovie = enhancedMovies[currentIndex];
  // Отримання наступного фільму та його розширених даних
  const nextEnhancedMovie = enhancedMovies[currentIndex + 1];

  // Обробник для кнопки переглянуто/не переглянуто
  const handleToggleWatched = () => {
    if (!currentEnhancedMovie) return;

    setIsMarkingWatched(true);

    const movie = currentEnhancedMovie.movie;
    const movieData = {
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      release_date: movie.release_date,
      overview: movie.overview,
      vote_average: movie.vote_average,
      vote_count: safeNumberConversion(movie.vote_count)
    };

    if (currentEnhancedMovie.watched) {
      // Видаляємо з переглянутих
      removeFromWatched(movie.id);
      toast.success(`"${currentEnhancedMovie.translations?.getTitle() || movie.title}" прибрано з переглянутих фільмів`);

      // Оновлюємо локальний стан для відображення зміни без перезавантаження
      setEnhancedMovies(prev => {
        const updated = [...prev];
        updated[currentIndex] = {
          ...updated[currentIndex],
          watched: false
        };
        return updated;
      });
    } else {
      // Позначаємо як переглянутий
      markAsWatched({ movie: movieData as any });
      toast.success(`"${currentEnhancedMovie.translations?.getTitle() || movie.title}" позначено як переглянутий`);

      // Оновлюємо локальний стан для відображення зміни без перезавантаження
      setEnhancedMovies(prev => {
        const updated = [...prev];
        updated[currentIndex] = {
          ...updated[currentIndex],
          watched: true
        };
        return updated;
      });
    }

    setIsMarkingWatched(false);
  };

  // Функція для переходу до наступного фільму з анімацією
  const moveToNextMovie = (direction: 'left' | 'right') => {
    if (enhancedMovies.length <= 1 || currentIndex >= enhancedMovies.length - 1) {
      // Якщо це останній фільм у масиві, перевіряємо чи не завантажуються вже додаткові фільми
      if (!loadingMore) {
        loadMoreMovies();
      }
      return;
    }

    // Визначаємо, з якого боку буде прилітати наступна картка
    const incomingSide = direction === 'left' ? 1 : -1; // Звернений напрямок - якщо свайп вліво, нова картка прилітає зправа
    const outgoingSide = direction === 'left' ? -1 : 1; // Куди летить поточна картка

    // Позиціонуємо наступну картку за межами екрану в потрібному напрямку
    nextApi.start({
      x: animationWidth * incomingSide,
      rotation: 15 * incomingSide,
      scale: 1,
      opacity: 1,
      immediate: true
    });

    // Анімуємо вихід поточної картки
    currentApi.start({
      x: animationWidth * outgoingSide,
      rotation: 15 * outgoingSide,
      config: { tension: 170, friction: 26 }
    });

    // Анімуємо вхід наступної картки
    nextApi.start({
      x: 0,
      rotation: 0,
      scale: 1,
      config: { tension: 170, friction: 26 },
      onRest: () => {
        // Коли анімація завершилась, оновлюємо індекс
        setCurrentIndex(prev => prev + 1);

        // Скидаємо анімацію для нової поточної картки
        currentApi.start({ x: 0, rotation: 0, scale: 1, immediate: true });

        // Початкова позиція для наступної картки (якщо вона є)
        if (currentIndex + 2 < enhancedMovies.length) {
          nextApi.start({
            x: animationWidth,
            rotation: 15,
            opacity: 0,
            immediate: true
          });
        }

        // Скидаємо напрямок свайпу
        setSwipeDirection(null);
      }
    });
  };

  // Обробник для кнопки "Дизлайк"
  const handleButtonDislike = () => {
    setSwipeDirection('left');
    if (enhancedMovies.length > 0) {
      moveToNextMovie('left');
    }
  };

  // Обробник для кнопки "Лайк"
  const handleButtonLike = () => {
    if (!currentEnhancedMovie || !defaultWatchlist) return;

    // Додаємо фільм до списку "Невідсортоване"
    const movie = currentEnhancedMovie.movie;
    const movieData = {
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      release_date: movie.release_date,
      overview: movie.overview,
      vote_average: movie.vote_average,
      vote_count: safeNumberConversion(movie.vote_count)
    };

    addMovie(movieData as any);
    toast.success(`"${currentEnhancedMovie.translations?.getTitle() || movie.title}" додано до списку "${defaultWatchlist.name}"`);

    setSwipeDirection('right');

    if (enhancedMovies.length > 0) {
      moveToNextMovie('right');
    }
  };

  // Обробник свайпів з use-gesture
  const bind = useDrag(({ active, movement: [mx], direction: [xDir], velocity: [vx] }) => {
    // Розраховуємо поворот на основі відстані переміщення
    const rot = mx / 100;

    // Показуємо, куди зараз свайпається (лайк/дизлайк)
    if (mx > 50) {
      setSwipeDirection('right');
    } else if (mx < -50) {
      setSwipeDirection('left');
    } else {
      setSwipeDirection(null);
    }

    if (!active && Math.abs(mx) > 100) {
      // Свайп завершено і перевищено поріг
      if (mx > 0) {
        // Свайп вправо (лайк)
        handleButtonLike();
      } else {
        // Свайп вліво (дизлайк)
        handleButtonDislike();
      }
    } else if (!active) {
      // Повертаємо картку на місце, якщо свайп не завершено
      currentApi.start({ x: 0, rotation: 0, scale: 1 });
      setSwipeDirection(null);
    } else {
      // Оновлюємо позицію та поворот картки під час свайпу
      currentApi.start({
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

  // Застосування фільтрів і завантаження нових фільмів
  const applyFilters = () => {
    setFiltersOpen(false);
    loadMovies();
  };

  // Обробник для відкриття селектора мов
  const handleOpenLanguageSelector = () => {
    if (!currentEnhancedMovie?.translations?.hasMultipleTranslations) return;
    setIsLanguageSelectorOpen(true);
  };

  // Розрахунок оптимальної висоти картки для мобільних пристроїв
  const calculateCardHeight = () => {
    // Для мобільних пристроїв - максимально використовуємо простір
    if (animationWidth <= 768) {
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

  if (loading && enhancedMovies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Завантаження фільмів...</p>
      </div>
    );
  }

  if (!currentEnhancedMovie) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full">
        <p className="text-xl font-semibold mb-4">Не вдалося завантажити фільм</p>
        <Button onClick={() => loadMovies()}>Спробувати знову</Button>
      </div>
    );
  }

  const currentMovie = currentEnhancedMovie.movie;
  const voteCount = safeNumberConversion(currentMovie.vote_count);
  const currentTitle = currentEnhancedMovie.translations?.getTitle() || currentMovie.title;
  const currentDescription = currentEnhancedMovie.translations?.getDescription() || currentMovie.overview;
  const hasTrailer = currentEnhancedMovie.trailer?.hasTrailer || false;

  return (
    <>
      <div className="fixed inset-0 top-16 flex flex-col items-center">
        {/* Кнопка фільтрів */}
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

        <div className="relative w-full max-w-md mx-auto px-4 pt-2 flex-1 flex flex-col h-full">
          <div
            className="relative w-full flex-grow"
            style={{ height: `${calculateCardHeight()}px` }}
          >
            {/* Поточна картка фільму з анімацією */}
            <animated.div
              {...bind()}
              style={{
                x: currentX,
                rotate: currentRotation,
                scale: currentScale,
                touchAction: 'none',
                zIndex: 10,
              }}
              className="absolute top-0 left-0 w-full h-full will-change-transform touch-none"
            >
              <Card className="relative w-full h-full overflow-hidden rounded-2xl shadow-xl">
                {/* Зображення фільму */}
                <div className="absolute inset-0 bg-muted">
                  {currentMovie.poster_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w780${currentMovie.poster_path}`}
                      alt={currentTitle}
                      fill
                      className={`object-cover ${currentEnhancedMovie.watched ? 'opacity-80' : ''}`}
                      priority
                      sizes="(max-width: 768px) 100vw, 500px"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">Немає зображення</p>
                    </div>
                  )}

                  {/* Індикатор переглянутого фільму */}
                  {currentEnhancedMovie.watched && (
                    <div className="absolute top-4 right-4 bg-blue-500/80 text-white px-3 py-1 rounded-full flex items-center gap-2 z-20">
                      <Eye className="h-4 w-4" />
                      <span>Переглянуто</span>
                    </div>
                  )}

                  {/* Індикатори свайпу */}
                  {swipeDirection === 'right' && (
                    <div className="absolute top-10 right-10 transform rotate-12 border-4 border-green-500 rounded-md px-4 py-2 bg-green-500/30 z-30">
                      <span className="text-white text-xl font-bold">ПОДОБАЄТЬСЯ</span>
                    </div>
                  )}
                  {swipeDirection === 'left' && (
                    <div className="absolute top-10 left-10 transform -rotate-12 border-4 border-red-500 rounded-md px-4 py-2 bg-red-500/30 z-30">
                      <span className="text-white text-xl font-bold">ПРОПУСТИТИ</span>
                    </div>
                  )}

                  {/* Оверлей для переглянутих фільмів */}
                  {currentEnhancedMovie.watched && (
                    <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10 z-10">
                      <div className="bg-blue-500/40 p-4 rounded-full">
                        <Eye className="h-16 w-16 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Інформація про фільм з градієнтною підложкою */}
                  <div className="absolute bottom-0 left-0 right-0 z-20">
                    {/* Градієнтний перехід */}
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
                          {currentEnhancedMovie.watched && (
                            <Badge variant="secondary" className="bg-blue-500/80 text-white ml-auto">
                              <Eye className="w-3 h-3 mr-1" />
                              Переглянуто
                            </Badge>
                          )}
                          {currentEnhancedMovie.translations?.selectedTranslation && (
                            <Badge variant="outline"
                              className="bg-black/20 text-white border-none ml-auto flex items-center gap-1 cursor-pointer"
                              onClick={handleOpenLanguageSelector}
                            >
                              <span>{currentEnhancedMovie.translations.selectedTranslation.iso_639_1.toUpperCase()}</span>
                            </Badge>
                          )}
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 drop-shadow-md line-clamp-2">
                          {currentTitle}
                        </h2>
                        <p className="text-white/90 text-xs sm:text-sm line-clamp-2 drop-shadow-md mb-2">
                          {currentDescription}
                        </p>

                        {/* Кнопки дій на картці */}
                        <div className={`flex justify-between pt-2 transition-opacity duration-300 ${swipeDirection ? 'opacity-0' : 'opacity-100'}`}>
                          <Button
                            onClick={handleButtonDislike}
                            variant="destructive"
                            size="icon"
                            className="rounded-full h-12 w-12 shadow-lg"
                          >
                            <ThumbsDown className="h-5 w-5" />
                          </Button>

                          <Button
                            onClick={() => hasTrailer && setTrailerOpen(true)}
                            variant="secondary"
                            size="icon"
                            className={`rounded-full h-12 w-12 shadow-lg ${hasTrailer
                              ? 'bg-purple-500 hover:bg-purple-600 text-white'
                              : 'bg-gray-400 text-gray-300 cursor-not-allowed'
                              }`}
                            disabled={!hasTrailer}
                          >
                            <Film className="h-5 w-5" />
                          </Button>

                          <Button
                            onClick={() => {
                              // Отримуємо деталі фільму через API і відкриваємо модальне вікно
                              openMovieDetailsModal(currentMovie as any);
                            }}
                            variant="secondary"
                            size="icon"
                            className="rounded-full h-12 w-12 bg-white text-gray-800 shadow-lg"
                          >
                            <Info className="h-5 w-5" />
                          </Button>

                          {/* Кнопка переглянуто/не переглянуто */}
                          <Button
                            onClick={handleToggleWatched}
                            variant="default"
                            size="icon"
                            className={`rounded-full h-12 w-12 shadow-lg ${currentEnhancedMovie.watched ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-500 hover:bg-gray-600'
                              }`}
                            disabled={isMarkingWatched}
                          >
                            {isMarkingWatched ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : currentEnhancedMovie.watched ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
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
                </div>
              </Card>
            </animated.div>
            {/* Наступна картка фільму, яка буде прилітати з-за меж екрану */}
            {nextEnhancedMovie && (
              <animated.div
                style={{
                  x: nextX,
                  rotate: nextRotation,
                  scale: nextScale,
                  opacity: nextOpacity,
                  zIndex: 5,
                }}
                className="absolute top-0 left-0 w-full h-full will-change-transform"
              >
                <Card className="relative w-full h-full overflow-hidden rounded-2xl shadow-xl">
                  {/* Зображення наступного фільму */}
                  <div className="absolute inset-0 bg-muted">
                    {nextEnhancedMovie.movie.poster_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w780${nextEnhancedMovie.movie.poster_path}`}
                        alt={nextEnhancedMovie.translations?.getTitle() || nextEnhancedMovie.movie.title}
                        fill
                        className={`object-cover ${nextEnhancedMovie.watched ? 'opacity-80' : ''}`}
                        priority
                        sizes="(max-width: 768px) 100vw, 500px"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">Немає зображення</p>
                      </div>
                    )}

                    {/* Індикатор переглянутого фільму */}
                    {nextEnhancedMovie.watched && (
                      <div className="absolute top-4 right-4 bg-blue-500/80 text-white px-3 py-1 rounded-full flex items-center gap-2 z-20">
                        <Eye className="h-4 w-4" />
                        <span>Переглянуто</span>
                      </div>
                    )}

                    {/* Оверлей для переглянутих фільмів */}
                    {nextEnhancedMovie.watched && (
                      <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10 z-10">
                        <div className="bg-blue-500/40 p-4 rounded-full">
                          <Eye className="h-16 w-16 text-white" />
                        </div>
                      </div>
                    )}

                    {/* Інформація про фільм з градієнтною підложкою */}
                    <div className="absolute bottom-0 left-0 right-0 z-20">
                      {/* Градієнтний перехід */}
                      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/100 via-black/90 to-transparent"></div>

                      {/* Контент з інформацією */}
                      <div className="relative p-3 pb-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {nextEnhancedMovie.movie.vote_average ? (
                              <Badge variant="secondary" className="bg-yellow-500/80 text-white">
                                <Star className="w-3 h-3 mr-1" />
                                {nextEnhancedMovie.movie.vote_average.toFixed(1)} ({safeNumberConversion(nextEnhancedMovie.movie.vote_count)})
                              </Badge>
                            ) : null}
                            {nextEnhancedMovie.movie.release_date && (
                              <Badge variant="outline" className="bg-black/20 text-white border-none">
                                {formatYear(nextEnhancedMovie.movie.release_date)}
                              </Badge>
                            )}
                            {nextEnhancedMovie.watched && (
                              <Badge variant="secondary" className="bg-blue-500/80 text-white ml-auto">
                                <Eye className="w-3 h-3 mr-1" />
                                Переглянуто
                              </Badge>
                            )}
                            {nextEnhancedMovie.translations?.selectedTranslation && (
                              <Badge variant="outline" className="bg-black/20 text-white border-none ml-auto flex items-center gap-1">
                                <span>{nextEnhancedMovie.translations.selectedTranslation.iso_639_1.toUpperCase()}</span>
                              </Badge>
                            )}
                          </div>
                          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 drop-shadow-md line-clamp-2">
                            {nextEnhancedMovie.translations?.getTitle() || nextEnhancedMovie.movie.title}
                          </h2>
                          <p className="text-white/90 text-xs sm:text-sm line-clamp-2 drop-shadow-md mb-2">
                            {nextEnhancedMovie.translations?.getDescription() || nextEnhancedMovie.movie.overview}
                          </p>

                          {/* Кнопки дій на картці */}
                          <div className="flex justify-between pt-2 opacity-0 transition-opacity duration-300">
                            <Button
                              onClick={handleButtonDislike}
                              variant="destructive"
                              size="icon"
                              className="rounded-full h-12 w-12 shadow-lg"
                            >
                              <ThumbsDown className="h-5 w-5" />
                            </Button>

                            <Button
                              onClick={() => hasTrailer && setTrailerOpen(true)}
                              variant="secondary"
                              size="icon"
                              className={`rounded-full h-12 w-12 shadow-lg ${hasTrailer
                                ? 'bg-purple-500 hover:bg-purple-600 text-white'
                                : 'bg-gray-400 text-gray-300 cursor-not-allowed'
                                }`}
                              disabled={!hasTrailer}
                            >
                              <Film className="h-5 w-5" />
                            </Button>

                            <Button
                              onClick={() => {
                                // Отримуємо деталі фільму через API і відкриваємо модальне вікно
                                openMovieDetailsModal(currentMovie as any);
                              }}
                              variant="secondary"
                              size="icon"
                              className="rounded-full h-12 w-12 bg-white text-gray-800 shadow-lg"
                            >
                              <Info className="h-5 w-5" />
                            </Button>

                            {/* Кнопка переглянуто/не переглянуто */}
                            <Button
                              onClick={handleToggleWatched}
                              variant="default"
                              size="icon"
                              className={`rounded-full h-12 w-12 shadow-lg ${currentEnhancedMovie.watched ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-500 hover:bg-gray-600'
                                }`}
                              disabled={isMarkingWatched}
                            >
                              {isMarkingWatched ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : currentEnhancedMovie.watched ? (
                                <EyeOff className="h-5 w-5" />
                              ) : (
                                <Eye className="h-5 w-5" />
                              )}
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
                  </div>
                </Card>
              </animated.div>
            )}
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
                  onValueChange={(value) => setFilters({ ...filters, language: value })}
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
                  onValueChange={(value) => setFilters({ ...filters, genre: value === "any" ? null : value })}
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
                    setFilters({ ...filters, includeAdult: Boolean(checked) })
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
      <MovieTrailer
        movieId={currentMovie?.id || 0}
        isOpen={trailerOpen}
        onClose={() => setTrailerOpen(false)}
      />
    </>
  );
};
