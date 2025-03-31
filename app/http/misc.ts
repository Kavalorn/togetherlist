// DTO для базового вмісту (спільний для фільмів і серіалів)
interface BaseContentDTO {
    id: number;
    backdrop_path: string | null;
    genre_ids?: number[];     // Використовується в результатах пошуку
    genres?: {                // Використовується в детальній інформації
      id: number;
      name: string;
    }[];
    original_language: string;
    overview: string;
    popularity: number;
    poster_path: string | null;
    vote_average: number;
    vote_count: number;
  }
  
  // DTO для результатів пошуку фільмів
  interface MovieSearchResultDTO extends BaseContentDTO {
    adult: boolean;
    original_title: string;       // Назва фільму в оригіналі
    title: string;                // Локалізована назва фільму
    release_date: string;         // Формат: "YYYY-MM-DD"
    video: boolean;
  }
  
  // DTO для результатів пошуку серіалів
  interface TVShowSearchResultDTO extends BaseContentDTO {
    first_air_date: string;       // Формат: "YYYY-MM-DD"
    origin_country: string[];     // Список кодів країн, напр. ["US", "GB"]
    original_name: string;        // Назва серіалу в оригіналі
    name: string;                 // Локалізована назва серіалу
  }
  
  // DTO для деталей фільму
  interface MovieDetailsDTO extends BaseContentDTO {
    adult: boolean;
    belongs_to_collection: {
      id: number;
      name: string;
      poster_path: string | null;
      backdrop_path: string | null;
    } | null;
    budget: number;                 // Бюджет фільму
    homepage: string | null;
    imdb_id: string | null;         // ID на IMDb
    original_title: string;
    production_companies: {
      id: number;
      logo_path: string | null;
      name: string;
      origin_country: string;
    }[];
    production_countries: {
      iso_3166_1: string;
      name: string;
    }[];
    release_date: string;
    revenue: number;                // Касові збори
    runtime: number;                // Тривалість у хвилинах
    spoken_languages: {
      english_name: string;
      iso_639_1: string;
      name: string;
    }[];
    status: string;                 // "Released", "In Production", тощо
    tagline: string | null;
    title: string;
    video: boolean;
  }
  
  // DTO для деталей серіалу
  interface TVShowDetailsDTO extends BaseContentDTO {
    created_by: {
      id: number;
      credit_id: string;
      name: string;
      gender: number;
      profile_path: string | null;
    }[];
    episode_run_time: number[];     // Середня тривалість епізодів у хвилинах
    first_air_date: string;
    homepage: string | null;
    in_production: boolean;         // Чи серіал ще знімається
    languages: string[];
    last_air_date: string;
    last_episode_to_air: {
      air_date: string;
      episode_number: number;
      id: number;
      name: string;
      overview: string;
      production_code: string;
      runtime: number;
      season_number: number;
      show_id: number;
      still_path: string | null;
      vote_average: number;
      vote_count: number;
    } | null;
    name: string;
    networks: {
      id: number;
      name: string;
      logo_path: string | null;
      origin_country: string;
    }[];
    next_episode_to_air: object | null;  // Те ж саме, що і last_episode_to_air
    number_of_episodes: number;
    number_of_seasons: number;
    origin_country: string[];
    original_name: string;
    production_companies: {
      id: number;
      logo_path: string | null;
      name: string;
      origin_country: string;
    }[];
    production_countries: {
      iso_3166_1: string;
      name: string;
    }[];
    seasons: {
      air_date: string;
      episode_count: number;
      id: number;
      name: string;
      overview: string;
      poster_path: string | null;
      season_number: number;
    }[];
    spoken_languages: {
      english_name: string;
      iso_639_1: string;
      name: string;
    }[];
    status: string;                 // "Returning Series", "Ended", тощо
    tagline: string | null;
    type: string;                   // "Scripted", "Reality", тощо
  }
  
  // DTO для сезону серіалу
  interface TVSeasonDTO {
    _id: string;
    air_date: string;
    episodes: {
      air_date: string;
      crew: {
        id: number;
        credit_id: string;
        name: string;
        department: string;
        job: string;
        profile_path: string | null;
      }[];
      episode_number: number;
      guest_stars: {
        id: number;
        name: string;
        credit_id: string;
        character: string;
        order: number;
        profile_path: string | null;
      }[];
      id: number;
      name: string;
      overview: string;
      production_code: string;
      runtime: number;
      season_number: number;
      still_path: string | null;
      vote_average: number;
      vote_count: number;
    }[];
    name: string;
    overview: string;
    id: number;
    poster_path: string | null;
    season_number: number;
  }
  
  // DTO для епізоду серіалу
  interface TVEpisodeDTO {
    air_date: string;
    crew: {
      id: number;
      credit_id: string;
      name: string;
      department: string;
      job: string;
      profile_path: string | null;
    }[];
    episode_number: number;
    guest_stars: {
      id: number;
      name: string;
      credit_id: string;
      character: string;
      order: number;
      profile_path: string | null;
    }[];
    id: number;
    name: string;
    overview: string;
    production_code: string;
    runtime: number;
    season_number: number;
    still_path: string | null;
    vote_average: number;
    vote_count: number;
  }
  
  /**
   * ОСНОВНІ ВІДМІННОСТІ МІЖ ФІЛЬМАМИ ТА СЕРІАЛАМИ:
   * 
   * 1. Назви полів:
   *    - Фільми: title, original_title, release_date
   *    - Серіали: name, original_name, first_air_date
   * 
   * 2. Унікальні поля фільмів:
   *    - adult: позначення вікових обмежень
   *    - budget: бюджет фільму
   *    - imdb_id: ідентифікатор на IMDb
   *    - revenue: касові збори
   *    - runtime: тривалість фільму (у серіалів це episode_run_time для епізодів)
   *    - video: чи є офіційні відео
   *    - belongs_to_collection: належність до франшизи/колекції
   * 
   * 3. Унікальні поля серіалів:
   *    - created_by: творці серіалу
   *    - episode_run_time: середня тривалість епізодів
   *    - in_production: чи серіал ще знімається
   *    - languages: мови серіалу
   *    - last_air_date: дата останнього епізоду
   *    - last_episode_to_air: інформація про останній епізод
   *    - next_episode_to_air: інформація про наступний епізод (якщо заплановано)
   *    - number_of_episodes: загальна кількість епізодів
   *    - number_of_seasons: кількість сезонів
   *    - origin_country: країни походження
   *    - networks: телемережі/стрімінгові сервіси, які транслюють серіал
   *    - seasons: інформація про всі сезони
   *    - type: тип серіалу (scripted, reality, etc.)
   */
  
  // ПРИКЛАДИ УНІФІКОВАНОГО ІНТЕРФЕЙСУ ДЛЯ РОБОТИ З ОБОМА ТИПАМИ
  
  // Уніфікований інтерфейс для базових результатів пошуку
  interface ContentSearchResult {
    id: number;
    contentType: 'movie' | 'tv';
    title: string;                // title для фільмів, name для серіалів
    originalTitle: string;        // original_title для фільмів, original_name для серіалів
    releaseDate: string;          // release_date для фільмів, first_air_date для серіалів 
    posterPath: string | null;
    backdropPath: string | null;
    overview: string;
    voteAverage: number;
    voteCount: number;
    popularity: number;
    genreIds: number[];
  }
  
  // Функція для конвертації результатів пошуку фільмів
  function convertMovieToUnifiedFormat(movie: MovieSearchResultDTO): ContentSearchResult {
    return {
      id: movie.id,
      contentType: 'movie',
      title: movie.title,
      originalTitle: movie.original_title,
      releaseDate: movie.release_date,
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      overview: movie.overview,
      voteAverage: movie.vote_average,
      voteCount: movie.vote_count,
      popularity: movie.popularity,
      genreIds: movie.genre_ids || [],
    };
  }
  
  // Функція для конвертації результатів пошуку серіалів
  function convertTVShowToUnifiedFormat(tvShow: TVShowSearchResultDTO): ContentSearchResult {
    return {
      id: tvShow.id,
      contentType: 'tv',
      title: tvShow.name,
      originalTitle: tvShow.original_name,
      releaseDate: tvShow.first_air_date,
      posterPath: tvShow.poster_path,
      backdropPath: tvShow.backdrop_path,
      overview: tvShow.overview,
      voteAverage: tvShow.vote_average,
      voteCount: tvShow.vote_count,
      popularity: tvShow.popularity,
      genreIds: tvShow.genre_ids || [],
    };
  }