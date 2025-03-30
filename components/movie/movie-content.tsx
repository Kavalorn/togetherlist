'use client';

import { useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useWatchedMovies } from '@/hooks/use-watched-movies';
import { useMovieCredits, useMovieImages } from '@/hooks/use-movies';
import {
  Star, Calendar, Clock,
  Eye, EyeOff, Users, Loader2,
  Film, ArrowLeft, Share2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MovieTrailer } from './movie-trailer';
import { useMovieTrailer } from '@/hooks/use-movie-trailer';
import { useMovieTranslations } from '@/hooks/use-movie-translations';
import { LanguageSelector } from './language-selector';
import { WatchlistSelectorWrapper } from '../watchlist/watchlist-selector-wrapper';
import { MovieRatingComparison } from './movie-rating-comparison';
import { UAServiceFinder } from './ua-service-finder';
import { MovieProviders } from './movie-providers';
import { MovieRecommendations } from './movie-recommendations';
import { ShareButtons } from './share-buttons';
import { useRouter } from 'next/navigation';
import { Cast, Movie, MovieDetails } from '@/lib/tmdb';
import { useUIStore } from '@/store/ui-store';
import { ActorCard } from '../actor/actor-card';

// Функция для безопасного преобразования значения в число
function safeNumberConversion(value: any): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseInt(value, 10) || 0;
  return 0;
}

interface MovieContentProps {
  movie: Movie | MovieDetails;
  isModal?: boolean; // Флаг, указывающий, отображается ли компонент в модальном окне
}

export function MovieContent({ movie, isModal = false }: MovieContentProps) {
  const router = useRouter();
  const { isWatched, markAsWatched, removeFromWatched } = useWatchedMovies();
  const [trailerOpen, setTrailerOpen] = useState(false);
  const { closeMovieDetailsModal } = useUIStore();

  // Получение дополнительных данных о фильме (актеры, изображения)
  const { data: creditsData, isLoading: isLoadingCredits } = useMovieCredits(movie.id);
  const { data: imagesData, isLoading: isLoadingImages } = useMovieImages(movie.id);

  const { hasTrailer, isLoading: isCheckingTrailer } = useMovieTrailer(movie.id);

  // Получение списка друзей, посмотревших фильм
  const { data: friendsWhoWatched, isLoading: isLoadingFriends } =
    useWatchedMovies().getFriendsWhoWatched(movie.id);

  const {
    selectedTranslation,
    hasMultipleTranslations,
    isLanguageSelectorOpen,
    openLanguageSelector,
    closeLanguageSelector,
    changeLanguage,
    getTitle,
    getDescription
  } = useMovieTranslations(movie.id, movie.overview, movie.title);

  // Форматирование рейтинга и проверка, что vote_count является числом
  const voteCount = safeNumberConversion(movie.vote_count);
  const formattedRating = movie.vote_average
    ? `${(movie.vote_average).toFixed(1)}/10 (${voteCount} ${voteCount === 1 ? 'голос' : 'голосів'})`
    : 'Немає оцінки';

  // Проверяем, посмотрен ли фильм
  const movieWatched = isWatched(movie.id);

  // Обработчик отметки фильма как просмотренного
  const handleMarkAsWatched = () => {
    if (movieWatched) {
      // Удаляем из просмотренных
      removeFromWatched(movie.id);
      toast.success(`"${movie.title}" прибрано з переглянутих фільмів`);
    } else {
      // Отмечаем как просмотренный
      const movieData = {
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        overview: movie.overview,
        vote_average: movie.vote_average,
        vote_count: voteCount
      };

      markAsWatched({ movie: movieData });
      toast.success(`"${movie.title}" позначено як переглянутий`);
    }
  };

  return (
    <>
      <div className={`relative ${isModal ? 'h-40 sm:h-64 md:h-72 w-full' : 'h-56 sm:h-80 md:h-96 w-full rounded-lg overflow-hidden'} bg-muted`}>
        {!isModal && (
          <Button 
            variant="outline" 
            className="absolute left-4 top-4 z-10"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>
        )}
        
        {imagesData?.backdrops && imagesData.backdrops.length > 0 ? (
          <Image
            src={`https://image.tmdb.org/t/p/w1280${imagesData.backdrops[0].file_path}`}
            alt={movie.title}
            fill
            className="object-cover"
            sizes="100vw"
          />
        ) : movie.poster_path ? (
          <div className="absolute inset-0 flex justify-center items-center bg-black/30">
            <Image
              src={`https://image.tmdb.org/t/p/w780${movie.poster_path}`}
              alt={movie.title}
              width={1200}
              height={800}
              className="object-cover w-full max-h-full"
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex justify-center items-center bg-muted">
            <span className="text-muted-foreground">Зображення відсутнє</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />

        {/* Индикатор просмотренного фильма */}
        {movieWatched && (
          <div className="absolute top-4 right-4 bg-blue-500/80 text-white px-3 py-1 rounded-full flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>Переглянуто</span>
          </div>
        )}
      </div>

      <div className={`relative ${isModal ? 'p-4 sm:p-6 pt-0 mt-[-3rem]' : 'pt-0 mt-[-3rem]'}`}>
        <div className={`flex flex-col md:flex-row gap-6`}>
          <div className="md:w-1/3 flex-shrink-0">
            <div className={`relative aspect-[2/3] w-48 max-w-full mx-auto md:mx-0 -mt-16 sm:-mt-20 md:-mt-24 shadow-xl rounded-lg overflow-hidden border ${movieWatched ? 'opacity-80' : ''}`}>
              {movie.poster_path ? (
                <Image
                  src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                  alt={movie.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 192px, 200px"
                />
              ) : (
                <div className="absolute inset-0 flex justify-center items-center bg-muted">
                  <span className="text-muted-foreground text-sm">Постер відсутній</span>
                </div>
              )}

              {/* Оверлей для просмотренных фильмов */}
              {movieWatched && (
                <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20">
                  <div className="bg-blue-500/70 p-3 rounded-full">
                    <Eye className="h-8 w-8 text-white" />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex gap-2">
                <Button
                  variant={movieWatched ? "default" : "outline"}
                  className={`flex-1 ${movieWatched ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                  onClick={handleMarkAsWatched}
                >
                  {movieWatched ? (
                    <>
                      <EyeOff className="mr-2 h-5 w-5" />
                      Непереглянуто
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-5 w-5" />
                      Переглянуто
                    </>
                  )}
                </Button>
              </div>

              <WatchlistSelectorWrapper 
                movie={movie} 
                variant="outline" 
                className="w-full" 
              />

              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setTrailerOpen(true)}
                disabled={!hasTrailer || isCheckingTrailer}
              >
                {isCheckingTrailer ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Film className="mr-2 h-5 w-5" />
                )}
                {hasTrailer ? "Дивитися трейлер" : "Трейлер відсутній"}
              </Button>
              
              <ShareButtons 
                movie={movie} 
                className="w-full" 
                usePermalink={true} 
              />

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium">{formattedRating}</span>
                </div>

                {'release_date' in movie && movie.release_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span>{format(new Date(movie.release_date), 'dd MMMM yyyy')}</span>
                  </div>
                )}

                {'runtime' in movie && movie.runtime && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span>{Math.floor(movie.runtime / 60)}год {movie.runtime % 60}хв</span>
                  </div>
                )}
              </div>

              {/* Секция друзей, которые посмотрели фильм */}
              <div className="mt-6">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Хто з друзів дивився
                </h3>

                {isLoadingFriends ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Завантаження...</span>
                  </div>
                ) : friendsWhoWatched && friendsWhoWatched.length > 0 ? (
                  <div className="space-y-2">
                    {friendsWhoWatched.map((friend: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 p-2 rounded-md bg-muted">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>
                            {friend.display_name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{friend.display_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {friend.watched_at && format(new Date(friend.watched_at), 'dd MMM yyyy')}
                          </p>
                        </div>
                        {friend.rating && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            {friend.rating}/10
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-2">
                    Ще ніхто з друзів не дивився цей фільм
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="md:w-2/3 mt-4 md:mt-0">
            <div className="mb-4 text-left">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
                {getTitle()}
                {movieWatched && <Eye className="h-6 w-6 text-blue-500" />}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="ml-2 rounded-full h-8 w-8 bg-white flex items-center justify-center border hover:bg-gray-100" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(`https://www.google.com/search?q=${encodeURIComponent(getTitle())} ${movie.release_date}`, '_blank');
                  }}
                  title="Шукати в Google"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </Button>
              </h1>
              {'tagline' in movie && movie.tagline && (
                <p className="text-muted-foreground italic">{movie.tagline}</p>
              )}
            </div>

            {movie.overview || (selectedTranslation && selectedTranslation.data.overview) ? (
              <div className="relative">
                <p className="text-sm sm:text-base">
                  {getDescription()}
                </p>

                {hasMultipleTranslations && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={openLanguageSelector}
                  >
                    {selectedTranslation ? selectedTranslation.name : 'Змінити мову опису'}
                  </Button>
                )}

                <LanguageSelector
                  movieId={movie.id}
                  isOpen={isLanguageSelectorOpen}
                  onClose={closeLanguageSelector}
                  onSelectLanguage={changeLanguage}
                  currentLanguage={selectedTranslation?.iso_639_1 || ''}
                />
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Опис відсутній</p>
            )}

            <div className="mt-6">
              <MovieRatingComparison 
                movieTitle={getTitle()}
                movieYear={'release_date' in movie && movie.release_date ? new Date(movie.release_date).getFullYear().toString() : undefined}
                tmdbRating={movie.vote_average}
                tmdbVotes={voteCount}
              />
            </div>

            <div className="mt-6">
              <div className='border rounded-lg p-4'>
                <h3 className="font-medium mb-2">Безкоштовні стрімінг платформи</h3>
                <UAServiceFinder 
                  movieTitle={getTitle()}
                  movieYear={'release_date' in movie && movie.release_date ? new Date(movie.release_date).getFullYear().toString() : undefined}
                />
              </div>
            </div>

            <div className="mt-6">
              <MovieProviders movieId={movie.id} />
            </div>

            <div className="mt-6">
              <MovieRecommendations movie={movie} />
            </div>

            {'genres' in movie && movie.genres && movie.genres.length > 0 && (
              <div>
                <h3 className="font-medium mt-4 mb-2">Жанри</h3>
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((genre: any) => (
                    <div key={genre.id} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs">
                      {genre.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className='pt-6 md:pt-4'>
          <Tabs defaultValue="cast">
            <TabsList className="w-full justify-start mb-4">
              <TabsTrigger value="cast">Актори</TabsTrigger>
              <TabsTrigger value="images">Зображення</TabsTrigger>
            </TabsList>

            <TabsContent value="cast" className="mt-0">
              <h3 className='text-lg sm:text-xl font-semibold mb-2'>Каст</h3>
              {isLoadingCredits ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, index) => (
                    <div key={index} className="space-y-2">
                      <Skeleton className="h-36 sm:h-40 w-full rounded-md" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : creditsData?.cast && creditsData.cast.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pr-0 sm:pr-4">
                  {creditsData.cast.map((actor: Cast) => (
                    <ActorCard key={actor.id} actor={actor} variant='cast' onCardClick={() => {
                      if (isModal) closeMovieDetailsModal();
                    }} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Інформація про акторів відсутня</p>
              )}
            </TabsContent>

            <TabsContent value="images" className="mt-0">
              <h3 className='text-lg sm:text-xl font-semibold mb-2'>Зображення</h3>
              {isLoadingImages ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, index) => (
                    <Skeleton key={index} className="aspect-video w-full rounded-md" />
                  ))}
                </div>
              ) : imagesData?.backdrops && imagesData.backdrops.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pr-0 sm:pr-4">
                  {imagesData.backdrops.slice(0, 10).map((image: any, index: number) => (
                    <div key={index} className="rounded-md overflow-hidden border">
                      <div className="relative aspect-video w-full">
                        <Image
                          src={`https://image.tmdb.org/t/p/w780${image.file_path}`}
                          alt={`${movie.title} image ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Зображення відсутні</p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <MovieTrailer
        movieId={movie.id}
        isOpen={trailerOpen}
        onClose={() => setTrailerOpen(false)}
      />
    </>
  );
}