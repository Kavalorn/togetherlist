// components/actor/actor-card.tsx
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Film, Star, Info, Loader2 } from 'lucide-react';
import { Person } from '@/lib/tmdb';
import { useFavoriteActors } from '@/hooks/use-favorite-actors';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface ActorCardProps {
  actor: Person;
  variant?: 'default' | 'compact';
}

export function ActorCard({ actor, variant = 'default' }: ActorCardProps) {
  const router = useRouter();
  const { isInFavorites, toggleFavorite, isAddingToFavorites, isRemovingFromFavorites } = useFavoriteActors();
  const [imageError, setImageError] = useState(false);

  // Перевіряємо, чи актор у списку улюблених
  const isFavorite = isInFavorites(actor.id);

  // Обробник натискання на картку (перехід на сторінку актора)
  const handleCardClick = () => {
    router.push(`/actor/${actor.id}`);
  };

  // Обробник додавання до улюблених
  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation(); // Запобігаємо переходу на сторінку актора
    
    toggleFavorite(actor);
    
    // Показуємо повідомлення
    if (isFavorite) {
      toast.success(`${actor.name} видалено з улюблених акторів`);
    } else {
      toast.success(`${actor.name} додано до улюблених акторів`);
    }
  };

  // Компактний варіант для представлення в сітці
  if (variant === 'compact') {
    return (
      <Card 
        className="overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="relative aspect-[2/3] w-full">
          <Image
            src={actor.profile_path ? `https://image.tmdb.org/t/p/w342${actor.profile_path}` : '/placeholder-person.png'}
            alt={actor.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            onError={() => setImageError(true)}
          />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`absolute top-2 right-2 p-1.5 rounded-full ${
                    isFavorite 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-white/80 hover:bg-white text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={handleToggleFavorite}
                  disabled={isAddingToFavorites || isRemovingFromFavorites}
                >
                  {isAddingToFavorites || isRemovingFromFavorites ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isFavorite ? "Видалити з улюблених" : "Додати до улюблених"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <CardContent className="p-3">
          <h3 className="font-bold text-sm line-clamp-2">{actor.name}</h3>
          {actor.known_for_department && (
            <p className="text-xs text-muted-foreground">{actor.known_for_department}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Повний варіант картки для результатів пошуку
  return (
    <Card 
      className="overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer flex flex-col p-0"
      onClick={handleCardClick}
    >
      <div className="relative aspect-[2/3] w-full">
        <Image
          src={actor.profile_path ? `https://image.tmdb.org/t/p/w500${actor.profile_path}` : '/placeholder-person.png'}
          alt={actor.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          onError={() => setImageError(true)}
        />
        
        {actor.popularity !== undefined && actor.popularity !== null && (
            <div className="absolute top-2 left-2 bg-black/75 text-white px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                <span>{actor.popularity.toFixed(1)}</span>
            </div>
        )}
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`absolute top-2 right-2 p-1.5 rounded-full ${
                  isFavorite 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-white/80 hover:bg-white text-gray-600 hover:text-gray-800'
                }`}
                onClick={handleToggleFavorite}
                disabled={isAddingToFavorites || isRemovingFromFavorites}
              >
                {isAddingToFavorites || isRemovingFromFavorites ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isFavorite ? "Видалити з улюблених" : "Додати до улюблених"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <CardContent className="p-4 flex-grow flex flex-col">
        <h2 className="text-base sm:text-xl font-bold tracking-tight mb-1">{actor.name}</h2>
        
        {actor.known_for_department && (
            <Badge variant="secondary" className="mb-2 w-fit">
                {actor.known_for_department}
            </Badge>
        )}
        
        {actor.known_for && Array.isArray(actor.known_for) && actor.known_for.length > 0 && (
            <div className="my-2">
                <p className="text-sm text-muted-foreground mb-1">Відомий за:</p>
                <div className="flex flex-wrap gap-1">
                {actor.known_for.slice(0, 3).map((work: any) => (
                    <Badge key={work.id} variant="outline" className="flex items-center gap-1">
                    <Film className="h-3 w-3" />
                    {work.title || work.name || 'Невідомо'}
                    </Badge>
                ))}
                </div>
            </div>
        )}
        
        <Button 
          variant="default" 
          className="mt-auto w-full"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/actor/${actor.id}`);
          }}
        >
          <Info className="mr-2 h-4 w-4" />
          Детальніше
        </Button>
      </CardContent>
    </Card>
  );
}