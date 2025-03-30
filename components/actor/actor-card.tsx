// components/actor/actor-card.tsx
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Film, Star, Info, Loader2 } from 'lucide-react';
import { Cast, Person } from '@/lib/tmdb';
import { useFavoriteActors } from '@/hooks/use-favorite-actors';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import Link from 'next/link';

type ActorCardProps = { 
  actor: Person | Cast; 
  variant?: 'default' | 'compact' | 'cast',
  imageOnly?: boolean,
  onCardClick?: () => void
};

export function ActorCard({ actor, variant = 'default', imageOnly, onCardClick = () => {} }: ActorCardProps) {
  const router = useRouter();
  const { isInFavorites, toggleFavorite, isAddingToFavorites, isRemovingFromFavorites } = useFavoriteActors();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Перевіряємо, чи актор у списку улюблених
  const isFavorite = isInFavorites(actor.id);

  // Обробник натискання на картку (перехід на сторінку актора)
  const handleCardClick = () => {
    onCardClick();
    router.push(`/actor/${actor.id}`);
  };
  
  // Функція для генерації fallback фону
  const getProfileBackground = () => {
    // Генеруємо колір на основі ID актора для консистентності
    const hue = (actor.id % 360 + 1);
    return `hsl(${hue}, 70%, 50%)`;
  };

  // Обробник додавання до улюблених
  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation to actor page
  
    console.log("Toggling favorite for actor:", actor.id, actor.name);
  
    // Ensure we have all required actor data
    const actorData: any = {
      id: actor.id,
      name: actor.name,
      profile_path: actor.profile_path || null,
      known_for_department: actor.known_for_department || null,
      popularity: actor.popularity !== undefined ? actor.popularity : null
    };
  
    toggleFavorite(actorData);
  
    // Show notification
    if (isFavorite) {
      toast.success(`${actor.name} removed from favorite actors`);
    } else {
      toast.success(`${actor.name} added to favorite actors`);
    }
  };

  // Handle image load completion
  const handleImageLoad = () => {
    setImageLoading(false);
  };

  // cast item from details
  if (variant === 'cast') {
    const castActor = actor as Cast;

    return (
      <Card 
        className="overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer p-0 gap-0"
        onClick={handleCardClick}
      >
        <div className="relative aspect-[2/3] w-full bg-slate-800">
          {/* Loading skeleton */}
          {imageLoading && (
            <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-gray-500 animate-spin" />
            </div>
          )}
          
          <Image
            src={castActor.profile_path ? `https://image.tmdb.org/t/p/w342${castActor.profile_path}` : '/placeholder-person.png'}
            alt={castActor.name}
            fill
            className={`object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
            onLoad={handleImageLoad}
            priority={variant === 'cast'}
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
        
        {!imageOnly && <CardContent className="p-3">
          <h3 className="font-bold text-sm line-clamp-2">{castActor.name}</h3>
          <p className="text-xs text-muted-foreground">{castActor.character}</p>
        </CardContent>}
      </Card>
    );
  }

  // Компактний варіант для представлення в сітці
  if (variant === 'compact') {
    return (
      <Card 
        className="overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer p-0 gap-0"
        onClick={handleCardClick}
      >
        <div className="relative aspect-[2/3] w-full bg-slate-800">
          {/* Loading skeleton */}
          {imageLoading && (
            <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-gray-500 animate-spin" />
            </div>
          )}
          
          <Image
            src={actor.profile_path ? `https://image.tmdb.org/t/p/w342${actor.profile_path}` : '/placeholder-person.png'}
            alt={actor.name}
            fill
            className={`object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
            onLoad={handleImageLoad}
            priority={variant === 'default'}
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
      className="overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer flex flex-col p-0 gap-0"
      onClick={handleCardClick}
    >
      <div className="relative aspect-[2/3] w-full bg-slate-800">
        {/* Loading skeleton */}
        {imageLoading && (
          <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center">
            <Loader2 className="h-10 w-10 text-gray-400 animate-spin" />
          </div>
        )}
        
        <Image
          src={actor.profile_path ? `https://image.tmdb.org/t/p/w500${actor.profile_path}` : '/placeholder-person.png'}
          alt={actor.name}
          fill
          className={`object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          onError={() => {
            setImageError(true);
            setImageLoading(false);
          }}
          onLoad={handleImageLoad}
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
            <div className="flex flex-wrap gap-1" onClick={e => e.stopPropagation()}>
              {actor.known_for.slice(0, 3).map((work: any) => (
                <Link href={`/movie/${work.id}`}>
                  <Badge key={work.id} variant="outline" className="flex items-center gap-1 hover:bg-slate-600 transition-colors">
                    <Film className="h-3 w-3" />
                    {work.title || work.name || 'Невідомо'}
                  </Badge>
                </Link>
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