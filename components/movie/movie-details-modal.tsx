'use client';

import Image from 'next/image';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUIStore } from '@/store/ui-store';
import { useWatchlist } from '@/hooks/use-watchlist';
import { useMovieCredits, useMovieImages } from '@/hooks/use-movies';
import { Bookmark, BookmarkCheck, Star, X, Calendar, Clock, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function MovieDetailsModal() {
  const { isMovieDetailsModalOpen, selectedMovie, closeMovieDetailsModal, openActorModal } = useUIStore();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  // Отримання додаткових даних про фільм (актори, зображення)
  const { data: creditsData, isLoading: isLoadingCredits } = useMovieCredits(selectedMovie?.id || null);
  const { data: imagesData, isLoading: isLoadingImages } = useMovieImages(selectedMovie?.id || null);

  // Якщо фільм не вибрано, не відображаємо модальне вікно
  if (!selectedMovie) {
    return null;
  }

  // Форматування рейтингу
  const formattedRating = selectedMovie.vote_average
    ? `${(selectedMovie.vote_average).toFixed(1)}/10`
    : 'Немає оцінки';

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
          
          {/* Кнопка закриття (додана для мобільних пристроїв) */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white rounded-full z-10" 
            onClick={closeMovieDetailsModal}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="relative p-4 sm:p-6 pt-0 mt-[-3rem]">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3 flex-shrink-0">
              <div className="relative aspect-[2/3] w-48 max-w-full mx-auto md:mx-0 -mt-16 sm:-mt-20 md:-mt-24 shadow-xl rounded-lg overflow-hidden border">
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
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <Button
                  variant={isInWatchlist(selectedMovie.id) ? "default" : "outline"}
                  className={`w-full ${isInWatchlist(selectedMovie.id) ? "bg-yellow-600 hover:bg-yellow-700" : ""}`}
                  onClick={() => toggleWatchlist(selectedMovie)}
                >
                  {isInWatchlist(selectedMovie.id) ? (
                    <>
                      <BookmarkCheck className="mr-2 h-5 w-5" />
                      В списку
                    </>
                  ) : (
                    <>
                      <Bookmark className="mr-2 h-5 w-5" />
                      в список
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
              </div>
            </div>

            <div className="md:w-2/3 mt-4 md:mt-0">
              <DialogHeader className="mb-4 text-left">
                <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-bold">{selectedMovie.title}</DialogTitle>
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
  );
}