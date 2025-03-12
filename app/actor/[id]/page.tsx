'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import { differenceInYears } from 'date-fns';
import { usePersonDetails, usePersonMovieCredits } from '@/hooks/use-movies';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { MovieCard } from '@/components/movie/movie-card';
import { ArrowLeft, CalendarIcon, Clock, Loader2, MapPin } from 'lucide-react';

export default function ActorPage() {
  const params = useParams();
  const router = useRouter();
  const personId = params.id ? parseInt(params.id as string, 10) : null;
  
  // Отримання даних про актора та його фільмографію
  const { data: personDetails, isLoading: isLoadingPerson, isError: isPersonError } = usePersonDetails(personId);
  const { data: personMovieCredits, isLoading: isLoadingMovies, isError: isMoviesError } = usePersonMovieCredits(personId);
  
  // Підготовка даних для відображення
  const actorAge = personDetails?.birthday
    ? differenceInYears(
        personDetails.deathday 
          ? new Date(personDetails.deathday) 
          : new Date(),
        new Date(personDetails.birthday)
      )
    : null;
  
  // Сортування фільмів за популярністю
  const sortedCastMovies = personMovieCredits?.cast
    ? [...personMovieCredits.cast].sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    : [];
  
  const sortedCrewMovies = personMovieCredits?.crew
    ? [...personMovieCredits.crew].sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    : [];
  
  // Якщо ідентифікатор актора відсутній або некоректний
  if (!personId || isNaN(personId)) {
    router.push('/');
    return null;
  }
  
  // Якщо дані завантажуються
  if (isLoadingPerson) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Завантаження інформації про актора...</p>
      </div>
    );
  }
  
  // Якщо сталася помилка при завантаженні
  if (isPersonError) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>
        
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold mb-2">Не вдалося завантажити інформацію</h2>
          <p className="text-muted-foreground">Сталася помилка при отриманні даних про актора</p>
        </div>
      </div>
    );
  }
  
  // Якщо дані про актора не знайдено
  if (!personDetails) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>
        
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold mb-2">Актора не знайдено</h2>
          <p className="text-muted-foreground">Інформація про цього актора відсутня</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад
      </Button>
      
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/4">
          <div className="relative aspect-[2/3] w-full max-w-xs mx-auto md:mx-0 rounded-lg overflow-hidden shadow-md border">
            {personDetails.profile_path ? (
              <Image
                src={`https://image.tmdb.org/t/p/w500${personDetails.profile_path}`}
                alt={personDetails.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 25vw"
              />
            ) : (
              <div className="absolute inset-0 flex justify-center items-center bg-muted">
                <span className="text-muted-foreground">Фото відсутнє</span>
              </div>
            )}
          </div>
          
          <div className="mt-6 space-y-4">
            <h2 className="text-lg font-semibold">Персональна інформація</h2>
            
            {personDetails.known_for_department && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Професія</h3>
                <p>{personDetails.known_for_department}</p>
              </div>
            )}
            
            {personDetails.birthday && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Дата народження</h3>
                <p className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  {format(new Date(personDetails.birthday), 'dd MMMM yyyy')}
                  {actorAge !== null && (
                    <span className="text-muted-foreground">
                      ({personDetails.deathday ? 'прожив' : 'вік'}: {actorAge} р.)
                    </span>
                  )}
                </p>
              </div>
            )}
            
            {personDetails.deathday && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Дата смерті</h3>
                <p className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  {format(new Date(personDetails.deathday), 'dd MMMM yyyy')}
                </p>
              </div>
            )}
            
            {personDetails.place_of_birth && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Місце народження</h3>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {personDetails.place_of_birth}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="md:w-3/4">
          <h1 className="text-3xl font-bold mb-2">{personDetails.name}</h1>
          
          {personDetails.biography ? (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Біографія</h2>
              <p className="text-sm sm:text-base whitespace-pre-line">
                {personDetails.biography}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground mb-6">Біографія відсутня</p>
          )}
          
          <Separator className="my-6" />
          
          <h2 className="text-xl font-semibold mb-4">Фільмографія</h2>
          
          {isLoadingMovies ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-40 w-full rounded-md" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <Tabs defaultValue="cast">
              <TabsList>
                <TabsTrigger value="cast">
                  Фільми ({sortedCastMovies.length})
                </TabsTrigger>
                {sortedCrewMovies.length > 0 && (
                  <TabsTrigger value="crew">
                    Режисер/Сценарист ({sortedCrewMovies.length})
                  </TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="cast" className="mt-6">
                {sortedCastMovies.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {sortedCastMovies.map(movie => (
                      <MovieCard
                        key={movie.id}
                        movie={movie}
                        variant="compact"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground py-4">
                    Інформація про фільми за участю актора відсутня
                  </p>
                )}
              </TabsContent>
              
              {sortedCrewMovies.length > 0 && (
                <TabsContent value="crew" className="mt-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {sortedCrewMovies.map(movie => (
                      <div key={movie.id} className="relative">
                        <MovieCard
                          movie={movie}
                          variant="compact"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate">
                          {movie.job}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}