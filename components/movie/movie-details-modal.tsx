// components/movie/movie-details-modal.tsx
'use client';

import Image from 'next/image';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUIStore } from '@/store/ui-store';
import { useWatchlist } from '@/hooks/use-watchlist';
import { useWatchedMovies } from '@/hooks/use-watched-movies';
import { useMovieCredits, useMovieImages } from '@/hooks/use-movies';
import { 
  Bookmark, BookmarkCheck, Star, Calendar, Clock, 
  Eye, EyeOff, Users, Loader2 
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Функція для безпечного перетворення значення на число
function safeNumberConversion(value: any): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseInt(value, 10) || 0;
  return 0;
}

export function MovieDetailsModal() {
  const { isMovieDetailsModalOpen, selectedMovie, closeMovieDetailsModal } = useUIStore();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { isWatched, markAsWatched, removeFromWatched, isMarking, isRemoving } = useWatchedMovies();

  // Отримання додаткових даних про фільм (актори, зображення)
  const { data: creditsData, isLoading: isLoadingCredits } = useMovieCredits(selectedMovie?.id || null);
  const { data: imagesData, isLoading: isLoadingImages } = useMovieImages(selectedMovie?.id || null);
  
  // Отримання списку друзів, які переглянули фільм
  const { data: friendsWhoWatched, isLoading: isLoadingFriends } = 
    useWatchedMovies().getFriendsWhoWatched(selectedMovie?.id || 0);

  // Якщо фільм не вибрано, не відображаємо модальне вікно
  if (!selectedMovie) {
    return null;
  }

  // Форматування рейтингу та забезпечення, що vote_count є числом
  const voteCount = safeNumberConversion(selectedMovie.vote_count);
  const formattedRating = selectedMovie.vote_average
    ? `${(selectedMovie.vote_average).toFixed(1)}/10 (${voteCount} ${voteCount === 1 ? 'голос' : 'голосів'})`
    : 'Немає оцінки';
    
  // Перевіряємо чи фільм переглянуто
  const movieWatched = isWatched(selectedMovie.id);

  // Функція для додавання до списку перегляду
  const handleAddToWatchlist = () => {
    // Забезпечуємо, що vote_count є числом
    toggleWatchlist({
      ...selectedMovie,
      vote_count: voteCount
    });

    // Відображаємо повідомлення про успішне додавання/видалення
    if (isInWatchlist(selectedMovie.id)) {
      toast.success(`"${selectedMovie.title}" прибрано зі списку перегляду`);
    } else {
      toast.success(`"${selectedMovie.title}" додано до списку перегляду`);
    }
  };
  
  // Обробник позначення фільму як переглянутого
  const handleMarkAsWatched = () => {
    if (movieWatched) {
      // Видаляємо з переглянутих
      removeFromWatched(selectedMovie.id, {
        onSuccess: () => {
          toast.success(`"${selectedMovie.title}" прибрано з переглянутих фільмів`);
        },
        onError: (error: Error) => {
          toast.error(`Помилка: ${error.message}`);
        }
      });
    } else {
      // Позначаємо як переглянутий
      const movieData = {
        id: selectedMovie.id,
        title: selectedMovie.title,
        poster_path: selectedMovie.poster_path,
        release_date: selectedMovie.release_date,
        overview: selectedMovie.overview,
        vote_average: selectedMovie.vote_average,
        vote_count: voteCount
      };
      
      markAsWatched({ movie: movieData }, {
        onSuccess: () => {
          toast.success(`"${selectedMovie.title}" позначено як переглянутий`);
        },
        onError: (error: Error) => {
          toast.error(`Помилка: ${error.message}`);
        }
      });
    }
  };

  return (
    <Dialog open={isMovieDetailsModalOpen} onOpenChange={(open) => !open && closeMovieDetailsModal()}>
      <DialogContent className="sm:max-w-[80vw] md:max-w-4xl max-h-[90vh] overflow-auto p-0">
        <div className="relative h-40 sm:h-64 md:h-72 w-full bg-muted">
          {imagesData?.backdrops && imagesData.backdrops.length > 0 ? (
            <Image
              src={`https://image.tmdb.org/t/p/w1280${imagesData.backdrops[0].file_path}`}
              alt={selectedMovie.title}
              fill
              className="object-cover"
              sizes="100vw"
            />
          ) : selectedMovie.poster_path ? (
            <div className="absolute inset-0 flex justify-center items-center bg-black/30">
              <Image
                src={`https://image.tmdb.org/t/p/w780${selectedMovie.poster_path}`}
                alt={selectedMovie.title}
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
          
          {/* Індикатор переглянутого фільму */}
          {movieWatched && (
            <div className="absolute top-4 right-4 bg-blue-500/80 text-white px-3 py-1 rounded-full flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>Переглянуто</span>
            </div>
          )}
        </div>

        <div className="relative p-4 sm:p-6 pt-0 mt-[-3rem]">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3 flex-shrink-0">
              <div className={`relative aspect-[2/3] w-48 max-w-full mx-auto md:mx-0 -mt-16 sm:-mt-20 md:-mt-24 shadow-xl rounded-lg overflow-hidden border ${movieWatched ? 'opacity-80' : ''}`}>
                {selectedMovie.poster_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}`}
                    alt={selectedMovie.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 192px, 200px"
                  />
                ) : (
                  <div className="absolute inset-0 flex justify-center items-center bg-muted">
                    <span className="text-muted-foreground text-sm">Постер відсутній</span>
                  </div>
                )}
                
                {/* Оверлей для переглянутих фільмів */}
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
                    disabled={isMarking || isRemoving}
                  >
                    {isMarking || isRemoving ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {movieWatched ? "Видаляємо..." : "Зберігаємо..."}
                      </>
                    ) : movieWatched ? (
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
                
                <Button
                  variant={isInWatchlist(selectedMovie.id) ? "default" : "outline"}
                  className={`w-full ${isInWatchlist(selectedMovie.id) ? "bg-yellow-600 hover:bg-yellow-700" : ""}`}
                  onClick={handleAddToWatchlist}
                >
                  {isInWatchlist(selectedMovie.id) ? (
                    <>
                      <BookmarkCheck className="mr-2 h-5 w-5" />
                      В списку
                    </>
                  ) : (
                    <>
                      <Bookmark className="mr-2 h-5 w-5" />
                      До списку
                    </>
                  )}
                </Button>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">{formattedRating}</span>
                  </div>

                  {selectedMovie.release_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <span>{format(new Date(selectedMovie.release_date), 'dd MMMM yyyy')}</span>
                    </div>)}

                  {selectedMovie.runtime && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <span>{Math.floor(selectedMovie.runtime / 60)}год {selectedMovie.runtime % 60}хв</span>
                    </div>
                  )}
                </div>
                
                {/* Секція друзів, які переглянули фільм */}
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
              <DialogHeader className="mb-4 text-left">
                <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
                  {selectedMovie.title}
                  {movieWatched && <Eye className="h-6 w-6 text-blue-500" />}
                </DialogTitle>
                {selectedMovie.tagline && (
                  <p className="text-muted-foreground italic">{selectedMovie.tagline}</p>
                )}
              </DialogHeader>

              {selectedMovie.overview ? (
                <p className="text-sm sm:text-base">{selectedMovie.overview}</p>
              ) : (
                <p className="text-muted-foreground text-sm">Опис відсутній</p>
              )}

              {selectedMovie.genres && selectedMovie.genres.length > 0 && (
                <div>
                  <h3 className="font-medium mt-4 mb-2">Жанри</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedMovie.genres.map(genre => (
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
                      {creditsData.cast.slice(0, 20).map(actor => (
                        <div
                          key={actor.id}
                          className="rounded-md overflow-hidden border cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => {
                            // Закриваємо деталі фільму і відкриваємо інформацію про актора
                            closeMovieDetailsModal();
                            // Перехід на сторінку актора
                            window.location.href = `/actor/${actor.id}`;
                          }}
                        >
                          <div className="relative aspect-[2/3] w-full">
                            <Image
                              src={actor.profile_path
                                ? `https://image.tmdb.org/t/p/w342${actor.profile_path}`
                                : '/placeholder-person.png'}
                              alt={actor.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                            />
                          </div>
                          <div className="p-2">
                            <p className="font-medium text-sm">{actor.name}</p>
                            <p className="text-xs text-muted-foreground">{actor.character}</p>
                          </div>
                        </div>
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
                    {imagesData.backdrops.slice(0, 10).map((image, index) => (
                      <div key={index} className="rounded-md overflow-hidden border">
                        <div className="relative aspect-video w-full">
                          <Image
                            src={`https://image.tmdb.org/t/p/w780${image.file_path}`}
                            alt={`${selectedMovie.title} image ${index + 1}`}
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
      </DialogContent>
    </Dialog>
  )
};