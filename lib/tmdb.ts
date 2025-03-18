// lib/tmdb.ts (додаємо логування для vote_count)

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
  vote_count?: number;
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
  profile_path?: string | null;
  known_for_department?: string;
  popularity?: number;
  adult?: boolean;
  gender?: number;
  // Масив фільмів/серіалів, у яких відома особа
  known_for?: Array<{
    id: number;
    title?: string;
    name?: string;
    media_type?: 'movie' | 'tv';
    poster_path?: string | null;
    release_date?: string;
    first_air_date?: string;
    vote_average?: number;
  }>;
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
  birthday?: string | null;
  deathday?: string | null;
  also_known_as?: string[];
  biography?: string;
  place_of_birth?: string | null;
  imdb_id?: string;
  homepage?: string | null;
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

export interface MovieVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
  published_at: string;
}

export interface MovieVideos {
  id: number;
  results: MovieVideo[];
}

export interface MovieTranslation {
  id: number;        // ідентифікатор перекладу
  iso_3166_1: string; // код країни
  iso_639_1: string;  // код мови
  name: string;       // назва мови
  english_name: string; // англійська назва мови
  data: {
    title?: string;
    overview?: string;
    homepage?: string;
  }
}

export interface MovieTranslations {
  id: number;
  translations: MovieTranslation[];
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

// Функція для безпечного перетворення vote_count на число
function safeNumberConversion(value: any): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseInt(value, 10) || 0;
  return 0;
}

// Функція для гарантування, що vote_count є числом для всіх фільмів
function ensureMovieProperties(movie: any): Movie {
  return {
    ...movie,
    // Переконуємося, що vote_count є числом
    vote_count: safeNumberConversion(movie.vote_count)
  };
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

  const data = await response.json();
  
  // Якщо результат містить масив фільмів, обробляємо їх
  if (data && data.results && Array.isArray(data.results)) {
    // Обробляємо кожен фільм, щоб переконатися, що vote_count є числом
    data.results = data.results.map((movie: any) => ensureMovieProperties(movie));
  } 
  // Якщо це один фільм, обробляємо його
  else if (data && data.id && data.title) {
    Object.assign(data, ensureMovieProperties(data));
  }
  
  return data as T;
};

// API функції
export const tmdbApi = {
  // Пошук фільмів
  searchMovies: async (query: string, page = 1) => {
    const result = await fetchFromTMDB<{ results: Movie[]; total_results: number; total_pages: number }>(
      '/search/movie',
      { query, page: page.toString(), ...showLanguage }
    );
    
    // Додаткове логування для відлагодження
    console.log("Результати пошуку фільмів:", result.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      vote_count: movie.vote_count
    })));
    
    return result;
  },

  // Отримання деталей фільму
  getMovieDetails: async (id: number) => {
    const result = await fetchFromTMDB<MovieDetails>(`/movie/${id}`, {...showLanguage});
    
    // Додаткове логування для відлагодження
    console.log("Деталі фільму:", {
      id: result.id,
      title: result.title,
      vote_count: result.vote_count
    });
    
    return result;
  },

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
  getPopularMovies: async (page = 1) => {
    const result = await fetchFromTMDB<{ results: Movie[]; total_results: number; total_pages: number }>(
      '/movie/popular',
      { page: page.toString(), ...showLanguage }
    );
    
    // Додаткове логування для відлагодження
    console.log("Популярні фільми:", result.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      vote_count: movie.vote_count
    })));
    
    return result;
  },

  // Отримання відео фільму (трейлери)
  getMovieVideos: (id: number) =>
    fetchFromTMDB<MovieVideos>(`/movie/${id}/videos`, {...showLanguage}),

  // Отримання фільмів у прокаті
  getNowPlayingMovies: (page = 1) =>
    fetchFromTMDB<{ results: Movie[]; total_results: number; total_pages: number }>(
      '/movie/now_playing',
      { page: page.toString(), ...showLanguage }
    ),

  // Функція для пошуку людей (акторів, режисерів, тощо)
searchPeople: async (query: string, page = 1) => {
  const result = await fetchFromTMDB<{ results: Person[]; total_results: number; total_pages: number }>(
    '/search/person',
    { query, page: page.toString(), ...showLanguage }
  );
  
  // Додаткове логування для відлагодження
  console.log("Результати пошуку людей:", result.results.map(person => ({
    id: person.id,
    name: person.name,
    popularity: person.popularity
  })));
  
  return result;
},

// Функція для отримання популярних акторів
getPopularPeople: async (page = 1) => {
  const result = await fetchFromTMDB<{ results: Person[]; total_results: number; total_pages: number }>(
    '/person/popular',
    { page: page.toString(), ...showLanguage }
  );
  
  // Додаткове логування для відлагодження
  console.log("Популярні актори:", result.results.map(person => ({
    id: person.id,
    name: person.name,
    popularity: person.popularity
  })));
  
  return result;
},

  getMovieTranslations: (id: number) =>
    fetchFromTMDB<MovieTranslations>(`/movie/${id}/translations`),

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
        const randomMovie = response.results[randomIndex];
        
        // Логуємо для відлагодження
        console.log("Обрано випадковий фільм:", {
          id: randomMovie.id,
          title: randomMovie.title,
          vote_count: randomMovie.vote_count,
          vote_average: randomMovie.vote_average
        });
        
        return randomMovie;
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
        const fallbackMovie = fallbackResponse.results[randomIndex];
        
        // Логуємо для відлагодження
        console.log("Запасний варіант випадкового фільму:", {
          id: fallbackMovie.id,
          title: fallbackMovie.title,
          vote_count: fallbackMovie.vote_count
        });
        
        return fallbackMovie;
      }
      
      // Якщо все ще нічого не знайдено, просто беремо популярні фільми
      const emergencyFallback = await fetchFromTMDB<{ results: Movie[] }>(
        '/movie/popular',
        { page: '1', ...showLanguage }
      );
      
      if (emergencyFallback.results && emergencyFallback.results.length > 0) {
        const randomIndex = Math.floor(Math.random() * emergencyFallback.results.length);
        const emergencyMovie = emergencyFallback.results[randomIndex];
        
        // Логуємо для відлагодження
        console.log("Екстрений варіант фільму:", {
          id: emergencyMovie.id,
          title: emergencyMovie.title,
          vote_count: emergencyMovie.vote_count
        });
        
        return emergencyMovie;
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