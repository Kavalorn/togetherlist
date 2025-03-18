// components/actor/actor-details-modal.tsx
'use client';

import Image from 'next/image';
import { format, differenceInYears } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUIStore } from '@/store/ui-store';
import { useFavoriteActors } from '@/hooks/use-favorite-actors';
import { usePersonMovieCredits } from '@/hooks/use-movies';
import {
  Heart, MapPin, Calendar, Film,
  Loader2, Eye, Bookmark, Star
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { CastMovie, CrewMovie } from '@/lib/tmdb';

export function ActorDetailsModal() {
  const { isActorDetailsModalOpen, selectedActor, closeActorDetailsModal } = useUIStore();
  const { isInFavorites, toggleFavorite, isAddingToFavorites, isRemovingFromFavorites } = useFavoriteActors();
  
  // Отримання додаткових даних про актора (фільмографія)
  const { data: creditsData, isLoading: isLoadingCredits } = usePersonMovieCredits(selectedActor?.id || null);

  // Якщо актор не вибрано, не відображаємо модальне вікно
  if (!selectedActor) {
    return null;
  }

  // Перевіряємо, чи актор у списку улюблених
  const isFavorite = isInFavorites(selectedActor.id);

  // Розрахунок віку актора
  const actorAge = selectedActor.birthday
    ? differenceInYears(
        selectedActor.deathday 
          ? new Date(selectedActor.deathday) 
          : new Date(),
        new Date(selectedActor.birthday)
      )
    : null;

  // Функція для обробки кнопки додавання/видалення з улюблених
  const handleToggleFavorite = () => {
    toggleFavorite(selectedActor);
    
    // Показуємо повідомлення
    if (isFavorite) {
      toast.success(`${selectedActor.name} видалено з улюблених акторів`);
    } else {
      toast.success(`${selectedActor.name} додано до улюблених акторів`);
    }
  };

  // Сортування фільмів за популярністю
  const sortedCastMovies = creditsData?.cast 
    ? [...creditsData.cast].sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    : [];
  
  const sortedCrewMovies = creditsData?.crew 
    ? [...creditsData.crew].sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    : [];

  return (
    <Dialog open={isActorDetailsModalOpen} onOpenChange={(open) => !open && closeActorDetailsModal()}>
      <DialogContent className="sm:max-w-[80vw] md:max-w-4xl max-h-[90vh] overflow-auto p-0">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3 flex-shrink-0">
              <div className="relative aspect-[2/3] w-48 max-w-full mx-auto md:mx-0 shadow-xl rounded-lg overflow-hidden border">
                {selectedActor.profile_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w500${selectedActor.profile_path}`}
                    alt={selectedActor.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 192px, 200px"
                  />
                ) : (
                  <div className="absolute inset-0 flex justify-center items-center bg-muted">
                    <span className="text-muted-foreground text-sm">Фото відсутнє</span>
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <Button
                  variant={isFavorite ? "default" : "outline"}
                  className={`w-full ${isFavorite ? "bg-red-600 hover:bg-red-700" : ""}`}
                  onClick={handleToggleFavorite}
                  disabled={isAddingToFavorites || isRemovingFromFavorites}
                >
                  {isAddingToFavorites || isRemovingFromFavorites ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {isFavorite ? "Видаляємо..." : "Додаємо..."}
                    </>
                  ) : (
                    <>
                      <Heart className={`mr-2 h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                      {isFavorite ? "В улюблених" : "Додати до улюблених"}
                    </>
                  )}
                </Button>

                <div className="mt-4 space-y-2">
                {selectedActor.known_for_department && (
                    <div className="flex items-center gap-2 text-sm">
                        <Film className="h-5 w-5 text-muted-foreground" />
                        <span>{selectedActor.known_for_department}</span>
                    </div>
                )}

                {selectedActor.birthday && (
                <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span>
                    {format(new Date(selectedActor.birthday), 'dd MMMM yyyy')}
                    {actorAge !== null && ` (${actorAge} р.)`}
                    </span>
                </div>
                )}

                  {selectedActor.deathday && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <span>{format(new Date(selectedActor.deathday), 'dd MMMM yyyy')} (помер)</span>
                    </div>
                  )}

                    {selectedActor.place_of_birth && (
                    <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <span>{selectedActor.place_of_birth}</span>
                    </div>
                    )}

                    {selectedActor.popularity !== undefined && selectedActor.popularity !== null && (
                    <div className="flex items-center gap-2 text-sm">
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        <span>Популярність: {selectedActor.popularity.toFixed(1)}</span>
                    </div>
                    )}
                </div>
              </div>
            </div>

            <div className="md:w-2/3 mt-4 md:mt-0">
              <DialogHeader className="mb-4 text-left">
                <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-bold">
                  {selectedActor.name}
                </DialogTitle>
              </DialogHeader>

              {selectedActor.biography ? (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Біографія</h3>
                  <p className="text-sm sm:text-base whitespace-pre-line">
                    {selectedActor.biography}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Біографія відсутня</p>
              )}

              <Separator className="my-6" />

              <Tabs defaultValue="cast">
                <TabsList className="w-full justify-start mb-4">
                  <TabsTrigger value="cast">Фільми</TabsTrigger>
                  {sortedCrewMovies.length > 0 && (
                    <TabsTrigger value="crew">Режисер/Продюсер</TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="cast" className="mt-0">
                  <h3 className='text-lg sm:text-xl font-semibold mb-2'>Фільмографія</h3>
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
                  ) : sortedCastMovies.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pr-0 sm:pr-4">
                      {sortedCastMovies.slice(0, 20).map((movie: CastMovie) => (
                        <div
                          key={`${movie.id}-${movie.credit_id}`}
                          className="rounded-md overflow-hidden border cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => {
                            // Закриваємо деталі актора
                            closeActorDetailsModal();
                            // Перехід на сторінку фільму
                            window.location.href = `/movie/${movie.id}`;
                          }}
                        >
                          <div className="relative aspect-[2/3] w-full">
                            <Image
                              src={movie.poster_path
                                ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
                                : '/placeholder-poster.png'}
                              alt={movie.title || movie.name || ''}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                            />
                            {movie.vote_average && (
                              <div className="absolute top-1 right-1 bg-black/80 text-white rounded-md px-1 py-0.5 text-xs flex items-center">
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 mr-0.5" />
                                {movie.vote_average.toFixed(1)}
                              </div>
                            )}
                          </div>
                          <div className="p-2">
                            <p className="font-medium text-sm line-clamp-1">{movie.title || movie.name}</p>
                            <p className="text-xs text-muted-foreground">{movie.character}</p>
                            {movie.release_date && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(movie.release_date).getFullYear()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">Інформація про фільмографію відсутня</p>
                  )}
                </TabsContent>

                {sortedCrewMovies.length > 0 && (
                  <TabsContent value="crew" className="mt-0">
                    <h3 className='text-lg sm:text-xl font-semibold mb-2'>Режисер/Продюсер</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pr-0 sm:pr-4">
                      {sortedCrewMovies.slice(0, 20).map((movie: CrewMovie) => (
                        <div
                          key={`${movie.id}-${movie.credit_id}`}
                          className="rounded-md overflow-hidden border cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => {
                            // Закриваємо деталі актора
                            closeActorDetailsModal();
                            // Перехід на сторінку фільму
                            window.location.href = `/movie/${movie.id}`;
                          }}
                        >
                          <div className="relative aspect-[2/3] w-full">
                            <Image
                              src={movie.poster_path
                                ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
                                : '/placeholder-poster.png'}
                              alt={movie.title || movie.name || ''}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                            />
                            {movie.vote_average && (
                              <div className="absolute top-1 right-1 bg-black/80 text-white rounded-md px-1 py-0.5 text-xs flex items-center">
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 mr-0.5" />
                                {movie.vote_average.toFixed(1)}
                              </div>
                            )}
                          </div>
                          <div className="p-2">
                            <p className="font-medium text-sm line-clamp-1">{movie.title || movie.name}</p>
                            <p className="text-xs text-muted-foreground">{movie.job}</p>
                            {movie.release_date && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(movie.release_date).getFullYear()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}