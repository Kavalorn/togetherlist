// components/movie/movie-recommendations.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Wand2, 
  RotateCw,
  Search
} from 'lucide-react';
import { useWatchedMovies } from '@/hooks/use-watched-movies';
import { useWatchlist } from '@/hooks/use-watchlist';
import { useWatchlists } from '@/hooks/use-watchlists';
import { 
  Checkbox
} from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useRecommendationsStore } from '@/store/recommendations-store';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { MovieCard } from '@/components/movie/movie-card';
import { NotFoundMovieCard } from '@/components/movie/not-found-movie-card';
import { useLLMMovieRecommendations } from '@/hooks/use-llm-movie-recommendations';

import { useSearchMovies } from '@/hooks/use-movies';
import { MovieDetails } from '@/lib/tmdb';

interface MovieRecommendationsProps {
  movie: MovieDetails;
  className?: string;
}

export function MovieRecommendations({ movie, className = '' }: MovieRecommendationsProps) {
  const {
    recommendations,
    isLoading,
    error,
    getRecommendations,
    selectedModel,
    setSelectedModel,
    models
  } = useLLMMovieRecommendations();
  
  const { watchedMovies } = useWatchedMovies();
  const { watchlist } = useWatchlist();
  const { watchlists } = useWatchlists();
  const [isOpen, setIsOpen] = useState(false);
  const [excludedTitles, setExcludedTitles] = useState<Set<string>>(new Set());
  
  // Стан чекбоксів із Zustand
  const { 
    excludeWatched, 
    excludeWatchlisted, 
    setExcludeWatched, 
    setExcludeWatchlisted 
  } = useRecommendationsStore();
  
  // Функція для отримання списку назв переглянутих фільмів
  const getWatchedMovieTitles = (): string[] => {
    if (!excludeWatched) return [];
    return watchedMovies.map(movie => movie.title);
  };
  
  // Функція для отримання списку назв фільмів у списках перегляду
  const getWatchlistedMovieTitles = (): string[] => {
    if (!excludeWatchlisted) return [];
    
    // Збираємо всі фільми з усіх списків
    const allWatchlistedMovies = new Set<string>();
    
    // З основного списку
    watchlist.forEach(movie => {
      if (movie.title) allWatchlistedMovies.add(movie.title);
    });
    
    // З інших списків (якщо вони є)
    watchlists.forEach(list => {
      if (list.movies) {
        list.movies.forEach(movie => {
          if (movie.title) allWatchlistedMovies.add(movie.title);
        });
      }
    });
    
    return Array.from(allWatchlistedMovies);
  };
  
  // Функція для генерації рекомендацій
  const handleGenerateRecommendations = async () => {
    // Збираємо фільми для виключення з рекомендацій
    const watchedTitles = getWatchedMovieTitles();
    const watchlistedTitles = getWatchlistedMovieTitles();
    const combinedExclusions = new Set([
      ...Array.from(excludedTitles), 
      ...watchedTitles,
      ...watchlistedTitles
    ]);
    
    await getRecommendations(movie, Array.from(combinedExclusions));
  };
  
  // Функція для генерації нових рекомендацій за виключенням поточних
  const handleGenerateMoreRecommendations = async () => {
    // Додаємо поточні рекомендації до списку виключень
    const newExcluded = new Set(excludedTitles);
    recommendations.forEach(rec => {
      newExcluded.add(rec.title);
      if (rec.tmdbMovie?.title) newExcluded.add(rec.tmdbMovie.title);
    });
    
    // Додаємо переглянуті фільми до списку виключень
    const watchedTitles = getWatchedMovieTitles();
    watchedTitles.forEach(title => newExcluded.add(title));
    
    // Додаємо фільми зі списків до виключень
    const watchlistedTitles = getWatchlistedMovieTitles();
    watchlistedTitles.forEach(title => newExcluded.add(title));
    
    setExcludedTitles(newExcluded);
    
    // Генеруємо нові рекомендації з оновленим списком виключень
    await getRecommendations(movie, Array.from(newExcluded));
  };
  
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={`${className} border rounded-lg overflow-hidden`}
    >
      <CollapsibleTrigger asChild>
        <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-muted/30">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            <span className="font-medium">Магічні рекомендації ШІ</span>
          </div>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="px-4 pb-4">
          <div className="flex flex-col text-center justify-between items-start sm:items-center gap-3 mb-4">
          <p className="text-sm text-muted-foreground">
                Отримайте персоналізовані рекомендації від штучного інтелекту на основі цього фільму
              </p>
            <div className="flex flex-col gap-2 w-full">
              <div className="flex gap-2">
                <Select 
                  value={selectedModel} 
                  onValueChange={setSelectedModel}
                >
                  <SelectTrigger className="grow">
                    <SelectValue placeholder="Виберіть модель" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map(model => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button 
                  onClick={handleGenerateRecommendations}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Генерування...
                    </>
                  ) : recommendations.length > 0 ? (
                    <>
                      <RotateCw className="mr-2 h-4 w-4" />
                      Оновити
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Згенерувати
                    </>
                  )}
                </Button>
              </div>

              <div>
              
              <div className="flex gap-2 flex-col">

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="exclude-watched" 
                    checked={excludeWatched}
                    onCheckedChange={setExcludeWatched}
                  />
                  <Label htmlFor="exclude-watched" className="text-sm">
                    Виключити переглянуті
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="exclude-watchlisted" 
                    checked={excludeWatchlisted}
                    onCheckedChange={setExcludeWatchlisted}
                  />
                  <Label htmlFor="exclude-watchlisted" className="text-sm">
                    Виключити зі списків
                  </Label>
                </div>

                </div>

              </div>
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} className="h-64 w-full rounded-md" />
              ))}
            </div>
          ) : recommendations.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {recommendations.map((rec, index) => (
                  rec.notFound ? (
                    <NotFoundMovieCard 
                      key={index}
                      title={rec.title}
                      year={rec.year}
                    />
                  ) : rec.tmdbMovie ? (
                    <MovieCard 
                      key={index}
                      movie={rec.tmdbMovie}
                      variant="compact"
                    />
                  ) : (
                    <NotFoundMovieCard 
                      key={index}
                      title={rec.title}
                      year={rec.year}
                    />
                  )
                ))}
              </div>
              
              <div className="flex justify-center mt-4">
                <Button 
                  variant="outline" 
                  onClick={handleGenerateMoreRecommendations}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  Показати інші рекомендації
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">
                Натисніть кнопку "Згенерувати", щоб отримати рекомендації подібних фільмів
              </p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}