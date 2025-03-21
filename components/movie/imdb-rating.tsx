// components/movie/imdb-rating.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star, Loader2, ExternalLink, MousePointerClick } from 'lucide-react';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface IMDbRating {
  imdbId: string;
  title: string;
  year: string;
  rating: number;
  votes: number;
  poster?: string;
}

interface IMDbRatingProps {
  movieTitle: string;
  movieYear?: string;
  className?: string;
}

export function IMDbRating({ movieTitle, movieYear, className }: IMDbRatingProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState<IMDbRating | null>(null);
  
  const fetchIMDbRating = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Будуємо URL з параметрами
      const params = new URLSearchParams();
      params.append('title', movieTitle);
      if (movieYear) {
        params.append('year', movieYear);
      }
      
      // Виконуємо запит до API
      const response = await fetch(`/api/imdb/rating?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не вдалося отримати дані з IMDb');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Не вдалося знайти фільм на IMDb');
      }
      
      setRating(data.data);
      toast.success(`Успішно отримано рейтинг IMDb для "${data.data.title}"`);
      
    } catch (err) {
      console.error('Помилка при отриманні рейтингу IMDb:', err);
      setError(err instanceof Error ? err.message : 'Не вдалося отримати дані з IMDb');
      toast.error('Помилка при отриманні рейтингу IMDb');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className={`${className || ''}`}>
      {!rating ? (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchIMDbRating}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          {isLoading ? 'Завантаження...' : <div className='flex gap-2 items-center'><span>IMDb</span><MousePointerClick /></div>}
        </Button>
      ) : (
        <div className="flex flex-col space-y-2">
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={`https://www.imdb.com/title/${rating.imdbId}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-3 py-1.5 rounded-md hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#F5C518" className="mr-1.5">
                      <path d="M14.31 9.588v.005c-.077-.048-.227-.07-.42-.07H12.8v3.95h1.1c.123 0 .24-.015.34-.035.1-.024.19-.07.25-.134.064-.068.11-.164.134-.29.025-.132.04-.295.04-.494V10.5c0-.164-.015-.311-.035-.432-.025-.123-.07-.22-.14-.295-.07-.078-.168-.138-.29-.172-.015-.005-.035-.005-.052-.01zm9.34-1.936v12.695c0 .964-.781 1.746-1.743 1.746H2.094a1.745 1.745 0 0 1-1.744-1.746V7.652c0-.964.782-1.746 1.744-1.746h19.812c.963 0 1.744.782 1.744 1.746zM6.99 17.517l2.17-6.796H7.547l-1.25 4.83h-.018l-1.262-4.83H3.403l2.163 6.796h1.425zm5.53 0v-6.796h-1.588v6.796h1.59zm5.8-2.755c0-.31-.012-.598-.037-.864-.025-.268-.086-.501-.183-.703-.097-.2-.24-.361-.428-.483-.189-.12-.44-.181-.755-.181-.189 0-.378.029-.567.086a1.44 1.44 0 0 0-.497.267c-.146.12-.268.267-.366.446a2.07 2.07 0 0 0-.196.635h-.018v-1.348h-1.588v6.797h1.588v-3.943c0-.155.018-.298.055-.428.038-.13.1-.243.183-.335.084-.092.187-.17.31-.219.123-.049.266-.07.428-.07.358 0 .605.115.743.347.138.23.207.562.207.995v3.652h1.588V14.76l.003.002zm5.347-1.632c-.098-.346-.257-.648-.476-.905a2.182 2.182 0 0 0-.817-.578c-.329-.132-.724-.195-1.191-.195-.446 0-.833.07-1.16.207a2.284 2.284 0 0 0-.823.589c-.219.252-.384.559-.493.916-.109.358-.164.767-.164 1.226 0 .452.055.854.164 1.208.109.354.271.654.485.899.214.244.476.435.785.571.309.135.655.201 1.038.201.549 0 1.006-.119 1.37-.359.364-.24.648-.588.853-1.043h-1.109c-.086.189-.232.341-.44.458-.206.117-.44.175-.7.175-.406 0-.694-.1-.873-.303-.178-.201-.274-.51-.286-.928h3.517a5.82 5.82 0 0 0-.047-.621 3.63 3.63 0 0 0-.134-.7zm-3.293-.359c.055-.335.164-.589.329-.765.164-.175.402-.262.713-.262.33 0 .571.092.731.278.159.185.253.435.28.75h-2.053z" />
                    </svg>
                    <Star className="h-4 w-4 mr-1 text-yellow-600 fill-yellow-600" />
                    <span className="font-bold">{rating.rating.toFixed(1)}</span>
                    <span className="text-xs ml-1">({rating.votes.toLocaleString()})</span>
                    <ExternalLink className="h-3 w-3 ml-1.5" />
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Відкрити на IMDb</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <span>Знайдено: </span>
            <span className="font-medium">{rating.title}</span>
            {rating.year && <span> ({rating.year})</span>}
          </div>
        </div>
      )}
      
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}