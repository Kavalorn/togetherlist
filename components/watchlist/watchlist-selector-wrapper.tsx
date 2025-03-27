'use client';

import { useState, useEffect } from 'react';
import { WatchlistSelector } from './watchlist-selector';
import { Movie, MovieDetails } from '@/lib/tmdb';

// Создаем обертку, которая откладывает рендеринг WatchlistSelector
// пока не пройдет первичный рендер (что поможет избежать проблем с порядком хуков)
export function WatchlistSelectorWrapper(props: {
  movie: Movie | MovieDetails,
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary',
  className?: string,
  iconOnly?: boolean,
  size?: 'default' | 'sm' | 'lg' | 'icon',
}) {
  const [isClient, setIsClient] = useState(false);

  // Эффект для отслеживания первого рендера
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Если это первичный рендер (на сервере или первый рендер на клиенте), 
  // возвращаем заглушку тех же размеров
  if (!isClient) {
    return (
      <div className={`${props.className} inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${props.variant === 'outline' ? 'border border-input bg-background hover:bg-accent hover:text-accent-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90'} ${props.size === 'sm' ? 'h-9 px-3' : props.size === 'lg' ? 'h-11 px-8' : props.size === 'icon' ? 'h-10 w-10' : 'h-10 px-4 py-2'}`}>
        {!props.iconOnly && <span>Переглянути після</span>}
      </div>
    );
  }

  // После первого рендера, когда порядок хуков установлен, рендерим реальный компонент
  return <WatchlistSelector {...props} />;
}