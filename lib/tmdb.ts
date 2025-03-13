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

const language = {
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
      { query, page: page.toString(), ...language }
    ),

  // Отримання деталей фільму
  getMovieDetails: (id: number) =>
    fetchFromTMDB<MovieDetails>(`/movie/${id}`, {...language}),

  // Отримання акторського складу фільму
  getMovieCredits: (id: number) =>
    fetchFromTMDB<MovieCredits>(`/movie/${id}/credits`),

  // Отримання зображень фільму
  getMovieImages: (id: number) =>
    fetchFromTMDB<MovieImages>(`/movie/${id}/images`),

  // Отримання інформації про актора
  getPersonDetails: (id: number) =>
    fetchFromTMDB<PersonDetails>(`/person/${id}`, {...language}),

  // Отримання фільмографії актора
  getPersonMovieCredits: (id: number) =>
    fetchFromTMDB<PersonMovieCredits>(`/person/${id}/movie_credits`),

  // Отримання популярних фільмів
  getPopularMovies: (page = 1) =>
    fetchFromTMDB<{ results: Movie[]; total_results: number; total_pages: number }>(
      '/movie/popular',
      { page: page.toString(), ...language }
    ),

  // Отримання фільмів у прокаті
  getNowPlayingMovies: (page = 1) =>
    fetchFromTMDB<{ results: Movie[]; total_results: number; total_pages: number }>(
      '/movie/now_playing',
      { page: page.toString(), ...language }
    ),
};