// components/movie/not-found-movie-card.tsx
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, AlertCircle } from 'lucide-react';

interface NotFoundMovieCardProps {
  title: string;
  year?: string;
}

export function NotFoundMovieCard({ title, year }: NotFoundMovieCardProps) {
  // Функція для пошуку фільму в Google
  const searchInGoogle = () => {
    const query = `фільм ${title} ${year || ''}`;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200 h-full flex flex-col p-0">
      <div className="relative aspect-[2/3] w-full bg-muted flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-2" />
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        {year && <p className="text-sm text-muted-foreground">{year}</p>}
        <p className="text-sm text-muted-foreground mt-2">Фільм не знайдено в базі даних</p>
      </div>
      
      <CardContent className="p-4 flex-grow flex flex-col justify-end">
        <Button 
          variant="outline" 
          onClick={searchInGoogle}
          className="w-full"
        >
          <Search className="mr-2 h-4 w-4" />
          Google
        </Button>
      </CardContent>
    </Card>
  );
}