// components/movie/movie-rating-comparison.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IMDbRating } from '@/components/movie/imdb-rating';

interface MovieRatingComparisonProps {
  movieTitle: string;
  movieYear?: string;
  tmdbRating?: number;
  tmdbVotes?: number;
  className?: string;
}

export function MovieRatingComparison({
  movieTitle,
  movieYear,
  tmdbRating,
  tmdbVotes,
  className,
}: MovieRatingComparisonProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
          <span>Рейтинги фільму</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0 pb-4">
        {/* TMDB Рейтинг */}
        {tmdbRating && tmdbRating > 0 ? (
          <div className="flex items-center">
            <div className="w-20 sm:w-24 text-sm font-medium">TMDB:</div>
            <div className="flex items-center gap-2">
              <div 
                className="bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200 px-2 py-1 rounded-md flex items-center"
              >
                <svg 
                  viewBox="0 0 185 133" 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 mr-1.5"
                >
                  <path fill="#01B4E4" d="M51.572 27.273h127.525v79.543H51.572z"/>
                  <path fill="#01B4E4" d="M157.918 105.064c7.352 0 13.31-5.957 13.31-13.31V39.926c0-7.35-5.958-13.308-13.31-13.308H72.139l-8.733-13.351-38.726-.238L13.72 39.478v52.276c0 7.353 5.958 13.31 13.31 13.31h130.888z"/>
                  <path fill="#FFFFFF" d="M157.918 38.68c.686 0 1.246.56 1.246 1.246v52.276c0 .686-.56 1.246-1.246 1.246H27.03c-.686 0-1.246-.56-1.246-1.246v-66.93l7.5-13.748 29.888.238 8.19 13.35 86.557-.001z"/>
                  <path fill="#081C24" d="M48.773 75.176c2.596 0 4.696-2.1 4.696-4.696 0-2.596-2.1-4.695-4.696-4.695-2.596 0-4.695 2.1-4.695 4.695 0 2.597 2.1 4.696 4.695 4.696zm73.86-4.696c0 2.596 2.1 4.696 4.695 4.696 2.596 0 4.696-2.1 4.696-4.696 0-2.596-2.1-4.695-4.696-4.695-2.596 0-4.695 2.1-4.695 4.695zm-41.69 4.696c2.596 0 4.696-2.1 4.696-4.696 0-2.596-2.1-4.695-4.696-4.695-2.596 0-4.695 2.1-4.695 4.695 0 2.597 2.1 4.696 4.695 4.696zm.199-23.48c10.038 0 19.157 2.85 25.248 7.368h.001l11.104-8.319c-8.632-6.472-21.384-10.585-35.574-10.585-14.193 0-26.946 4.115-35.578 10.59l11.104 8.318c6.096-4.523 15.22-7.372 23.695-7.372z"/>
                </svg>
                <span className="font-bold">{tmdbRating.toFixed(1)}</span>
                <span className="text-xs ml-1">({tmdbVotes?.toLocaleString() || 'н/д'})</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center text-muted-foreground">
            <div className="w-20 sm:w-24 text-sm font-medium">TMDB:</div>
            <div>Немає оцінки</div>
          </div>
        )}
        
        {/* IMDb Рейтинг */}
        <div className="flex items-center">
          <div className="w-20 sm:w-24 text-sm font-medium">IMDb:</div>
          <IMDbRating 
            movieTitle={movieTitle}
            movieYear={movieYear}
          />
        </div>
      </CardContent>
    </Card>
  );
}