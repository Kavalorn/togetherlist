'use client';

import { useEffect, Suspense, useState } from 'react';
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
import { ArrowLeft, Calendar, CalendarIcon, Clock, Loader2, MapPin, SortAsc, SortDesc } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';

export default function ActorPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Завантаження...</p>
      </div>
    }>
      <ActorContent />
    </Suspense>
  );
}

function ActorContent() {
  const params = useParams();
  const router = useRouter();
  const personId = params.id ? parseInt(params.id as string, 10) : null;
  
  // Стан для сортування
  const [sortField, setSortField] = useState('rating');
  const [sortDirection, setSortDirection] = useState('desc');
  const [activeTab, setActiveTab] = useState('cast');
  
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
  
  // Функція сортування фільмів
  const sortMovies = (movies: any) => {
    if (!movies || !movies.length) return [];
    
    return [...movies].sort((a, b) => {
      let aValue, bValue;
      
      // Визначення значень для сортування
      switch(sortField) {
        case 'rating':
          aValue = a.vote_average || 0;
          bValue = b.vote_average || 0;
          break;
        case 'year':
          aValue = a.release_date ? new Date(a.release_date).getFullYear() : 0;
          bValue = b.release_date ? new Date(b.release_date).getFullYear() : 0;
          break;
        default:
          aValue = a.vote_average || 0;
          bValue = b.vote_average || 0;
      }
      
      // Напрямок сортування
      return sortDirection === 'desc' ? bValue - aValue : aValue - bValue;
    });
  };
  
  // Сортовані фільми
  const sortedCastMovies = personMovieCredits?.cast ? sortMovies(personMovieCredits.cast) : [];
  const sortedCrewMovies = personMovieCredits?.crew ? sortMovies(personMovieCredits.crew) : [];
  
  // Функція перемикання напрямку сортування
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
  };
  
  // Функція зміни поля сортування
  const changeSortField = (field: any) => {
    if (sortField === field) {
      toggleSortDirection();
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Отримання іконки для кнопки сортування
  const getSortIcon = () => {
    if (sortDirection === 'desc') {
      return <SortDesc className="h-4 w-4" />;
    }
    return <SortAsc className="h-4 w-4" />;
  };
  
  // Отримання тексту для кнопки сортування
  const getSortText = () => {
    let fieldText = '';
    switch(sortField) {
      case 'rating':
        fieldText = 'рейтингом';
        break;
      case 'year':
        fieldText = 'роком';
        break;
      default:
        fieldText = 'рейтингом';
    }
    
    return `За ${fieldText} (${sortDirection === 'desc' ? 'спадання' : 'зростання'})`;
  };
  
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
        <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
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
        <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
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
    <div className="space-y-6 sm:space-y-8">
      <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад
      </Button>
      
      <div className="flex flex-col md:flex-row gap-6 sm:gap-8">
        <div className="w-full md:w-1/4">
          <div className="relative aspect-[2/3] w-full max-w-[200px] mx-auto md:mx-0 rounded-lg overflow-hidden shadow-md border">
            {personDetails.profile_path ? (
              <Image
                src={`https://image.tmdb.org/t/p/w500${personDetails.profile_path}`}
                alt={personDetails.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 200px, 25vw"
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
                <p className="flex items-center gap-2 flex-wrap">
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
        
        <div className="w-full md:w-3/4">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{personDetails.name}</h1>
          
          {personDetails.biography ? (
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4">Біографія</h2>
              <p className="text-sm sm:text-base whitespace-pre-line">
                {personDetails.biography}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground mb-6">Біографія відсутня</p>
          )}
          
          <Separator className="my-6" />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">Фільмографія</h2>
            
            {/* Кнопка сортування */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex gap-2 mt-2 sm:mt-0">
                  {getSortIcon()}
                  <span className="hidden sm:inline">{getSortText()}</span>
                  <span className="sm:hidden">Сортування</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Сортувати за</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => changeSortField('rating')}
                  className="flex justify-between"
                >
                  <span>Рейтинг</span>
                  {sortField === 'rating' && getSortIcon()}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => changeSortField('year')}
                  className="flex justify-between"
                >
                  <span>Рік випуску</span>
                  {sortField === 'year' && getSortIcon()}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleSortDirection}>
                  {sortDirection === 'desc' ? 'За зростанням' : 'За спаданням'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {isLoadingMovies ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-36 sm:h-40 w-full rounded-md" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <Tabs defaultValue="cast" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full flex justify-start mb-4">
                <TabsTrigger value="cast" className="flex-1 sm:flex-none">
                  Фільми ({sortedCastMovies.length})
                </TabsTrigger>
                {sortedCrewMovies.length > 0 && (
                  <TabsTrigger value="crew" className="flex-1 sm:flex-none">
                    Режисер/Сценарист ({sortedCrewMovies.length})
                  </TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="cast" className="mt-0">
                {sortedCastMovies.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
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
                <TabsContent value="crew" className="mt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
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