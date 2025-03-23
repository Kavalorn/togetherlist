// components/movie/movie-recommendations.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Wand2, 
  RotateCw,
  Search
} from 'lucide-react';
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
import { useLLMMovieRecommendations, LLM_MODELS } from '@/hooks/use-llm-movie-recommendations';
import { useUIStore } from '@/store/ui-store';
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
  
  const [activeRecommendation, setActiveRecommendation] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  
  // Пошук фільму в TMDB на основі рекомендації
  const { data: searchResults, isLoading: isSearching } = useSearchMovies(
    activeRecommendation !== null && recommendations[activeRecommendation]
      ? `${recommendations[activeRecommendation].title} ${recommendations[activeRecommendation].year || ''}`
      : '',
    1
  );
  
  // Обробник генерації рекомендацій
  const handleGenerateRecommendations = async () => {
    await getRecommendations(movie);
  };
  
  // Обробник вибору рекомендації
  const handleSelectRecommendation = (index: number) => {
    setActiveRecommendation(index);
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">
                Отримайте персоналізовані рекомендації від штучного інтелекту на основі цього фільму
              </p>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <Select 
                value={selectedModel} 
                onValueChange={setSelectedModel}
              >
                <SelectTrigger className="w-[180px]">
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
          </div>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : recommendations.length > 0 ? (
            <div className="space-y-6">
              <div className="space-y-3">
                {recommendations.map((rec, index) => (
                  <div 
                    key={index}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      activeRecommendation === index ? 'bg-muted border-primary' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleSelectRecommendation(index)}
                  >
                    <h3 className="font-medium flex items-center">
                      {index + 1}. {rec.title} {rec.year && `(${rec.year})`}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                    {rec.reasons && rec.reasons.length > 0 && (
                      <ul className="text-sm mt-1 ml-4 list-disc">
                        {rec.reasons.map((reason, i) => (
                          <li key={i}>{reason}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
              
             {activeRecommendation !== null && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Результати пошуку</h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`https://www.google.com/search?q=фільм ${recommendations[activeRecommendation!].title} ${recommendations[activeRecommendation!].year || ''}`, '_blank')}
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Шукати в Google
                    </Button>
                  </div>
                  
                  {isSearching ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : searchResults?.results && searchResults.results.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {searchResults.results.slice(0, 3).map(movie => (
                        <MovieCard key={movie.id} movie={movie} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-4 text-muted-foreground">
                      Не знайдено відповідних фільмів у TMDB. Спробуйте іншу рекомендацію.
                    </p>
                  )}
                </div>
              )}
            </div>
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