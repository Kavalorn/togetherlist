// Базова URL-адреса для запитів до TMDB API
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Базовий тип для фільмів
export interface Movie {
  id: number;
  title: string;
  poster_path?: string;
  release_date?: string;
  overview?: string;
  vote_average?: number;
  popularity?: number;
}

// Детальна інформація про фільм
export interface MovieDetails extends Movie {
  genres?: { id: number; name: string }[];
  runtime?: number;
  budget?: number;
  revenue?: number;
  status?: string;
  tagline?: string;
}

// Базовий тип для особи (актора, режисера)
export interface Person {
  id: number;
  name: string;
  profile_path?: string;
  known_for_department?: string;
}

// Тип для актора у фільмі
export interface Cast extends Person {
  character: string;
  order: number;
  credit_id: string; // Додано поле credit_id
}

// Тип для члена знімальної групи
export interface Crew extends Person {
  job: string;
  department: string;
  credit_id: string; // Додано поле credit_id
}

// Детальна інформація про особу
export interface PersonDetails extends Person {
  birthday?: string;
  deathday?: string;
  biography?: string;
  place_of_birth?: string;
  gender?: number;
}

// Типи для фільмів в фільмографії актора
export interface CastMovie extends Movie {
  character: string;
  credit_id: string;
  order?: number;
}

export interface CrewMovie extends Movie {
  job: string;
  department: string;
  credit_id: string;
}

// Інформація про акторський склад фільму
export interface MovieCredits {
  id: number;
  cast: Cast[];
  crew: Crew[];
}

// Зображення фільму
export interface MovieImages {
  id: number;
  backdrops: {
    file_path: string;
    width: number;
    height: number;
    aspect_ratio: number;
  }[];
  posters: {
    file_path: string;
    width: number;
    height: number;
    aspect_ratio: number;
  }[];
}

// Фільмографія особи
export interface PersonMovieCredits {
  id: number;
  cast: CastMovie[]; // Використовуємо CastMovie замість Movie
  crew: CrewMovie[]; // Використовуємо CrewMovie замість Movie & {...}
}

// Інтерфейс для фільтрів
interface RandomMovieFilters {
  minRating?: number;
  maxRating?: number;
  minYear?: number;
  maxYear?: number;
  language?: string | null;
  includeAdult?: boolean;
  genre?: string | null;
}

const showLanguage = {
  language: 'uk-UA'
}

// Функція для здійснення запитів до TMDB API
const fetchFromTMDB = async <T>(endpoint: string, params: Record<string, string> = {}): Promise<T> => {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  
  // Додавання параметрів до URL
  Object.entries({...params}).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
      'Content-Type': 'application/json'
    },
    next: { revalidate: 3600 } // Кешування на 1 годину
  });

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
};

// API функції
export const tmdbApi = {
  // Пошук фільмів
  searchMovies: (query: string, page = 1) =>
    fetchFromTMDB<{ results: Movie[]; total_results: number; total_pages: number }>(
      '/search/movie',
      { query, page: page.toString(), ...showLanguage }
    ),

  // Отримання деталей фільму
  getMovieDetails: (id: number) =>
    fetchFromTMDB<MovieDetails>(`/movie/${id}`, {...showLanguage}),

  // Отримання акторського складу фільму
  getMovieCredits: (id: number) =>
    fetchFromTMDB<MovieCredits>(`/movie/${id}/credits`),

  // Отримання зображень фільму
  getMovieImages: (id: number) =>
    fetchFromTMDB<MovieImages>(`/movie/${id}/images`),

  // Отримання інформації про актора
  getPersonDetails: (id: number) =>
    fetchFromTMDB<PersonDetails>(`/person/${id}`, {...showLanguage}),

  // Отримання фільмографії актора
  getPersonMovieCredits: (id: number) =>
    fetchFromTMDB<PersonMovieCredits>(`/person/${id}/movie_credits`),

  // Отримання популярних фільмів
  getPopularMovies: (page = 1) =>
    fetchFromTMDB<{ results: Movie[]; total_results: number; total_pages: number }>(
      '/movie/popular',
      { page: page.toString(), ...showLanguage }
    ),

  // Отримання фільмів у прокаті
  getNowPlayingMovies: (page = 1) =>
    fetchFromTMDB<{ results: Movie[]; total_results: number; total_pages: number }>(
      '/movie/now_playing',
      { page: page.toString(), ...showLanguage }
    ),

  // Отримання випадкових фільмів
  getRandomMovie: async (filters: RandomMovieFilters = {}) => {
    try {
      // Встановлюємо значення за замовчуванням для фільтрів
      const currentYear = new Date().getFullYear();
      const {
        minRating = 0,
        maxRating = 10,
        minYear = 1900,
        maxYear = currentYear,
        language = null,
        includeAdult = false,
        genre = null
      } = filters;

      // Випадкові критерії сортування
      const sortOptions = [
        'popularity.desc', 
        'popularity.asc',
        'vote_average.desc', 
        'vote_average.asc',
        'primary_release_date.desc', 
        'primary_release_date.asc',
        'revenue.desc',
        'revenue.asc',
        'original_title.asc',
        'original_title.desc'
      ];
      const randomSort = sortOptions[Math.floor(Math.random() * sortOptions.length)];
      
      // Випадкова сторінка з максимально можливого діапазону
      const randomPage = Math.floor(Math.random() * 499) + 1; // 1-500
      
      // Параметри запиту
      const params: Record<string, string> = {
        sort_by: randomSort,
        page: randomPage.toString(),
        'vote_average.gte': minRating.toString(),
        'vote_average.lte': maxRating.toString(),
        'primary_release_date.gte': `${minYear}-01-01`,
        'primary_release_date.lte': `${maxYear}-12-31`,
        include_adult: includeAdult.toString(),
        ...showLanguage
      };

      // Додаємо мову, якщо вказана
      if (language) {
        params.with_original_language = language;
      }

      // Додаємо жанр, якщо вказаний
      if (genre) {
        params.with_genres = genre;
      }

      // Виконуємо запит до API
      const response = await fetchFromTMDB<{ results: Movie[]; total_results: number; total_pages: number }>(
        '/discover/movie',
        { 
          ...params,
          ...showLanguage
        }
      );
      
      // Беремо випадковий фільм з результатів
      if (response.results && response.results.length > 0) {
        const randomIndex = Math.floor(Math.random() * response.results.length);
        return response.results[randomIndex];
      }
      
      // Якщо нічого не знайдено, робимо більш простий запит
      // Зменшуємо обмеження на фільтри
      const fallbackResponse = await fetchFromTMDB<{ results: Movie[] }>(
        '/discover/movie',
        { 
          sort_by: 'popularity.desc',
          'vote_average.gte': '0',
          include_adult: includeAdult.toString(),
          page: Math.floor(Math.random() * 20 + 1).toString(),
          ...showLanguage
        }
      );
      
      if (fallbackResponse.results && fallbackResponse.results.length > 0) {
        const randomIndex = Math.floor(Math.random() * fallbackResponse.results.length);
        return fallbackResponse.results[randomIndex];
      }
      
      // Якщо все ще нічого не знайдено, просто беремо популярні фільми
      const emergencyFallback = await fetchFromTMDB<{ results: Movie[] }>(
        '/movie/popular',
        { page: '1', ...showLanguage }
      );
      
      if (emergencyFallback.results && emergencyFallback.results.length > 0) {
        const randomIndex = Math.floor(Math.random() * emergencyFallback.results.length);
        return emergencyFallback.results[randomIndex];
      }
      
      throw new Error('No movies found');
    } catch (error) {
      console.error("Error fetching random movie:", error);
      
      // Останній запасний варіант - отримати просто популярні фільми
      const emergencyFallback = await fetchFromTMDB<{ results: Movie[] }>(
        '/movie/popular',
        { page: '1', ...showLanguage }
      );
      
      if (emergencyFallback.results && emergencyFallback.results.length > 0) {
        const randomIndex = Math.floor(Math.random() * emergencyFallback.results.length);
        return emergencyFallback.results[randomIndex];
      }
      
      throw new Error('Failed to fetch any movies');
    }
  },
};