// Файл: components/movie/language-indicator.tsx
'use client';

import { Globe, Loader2 } from 'lucide-react';
import { MovieTranslation } from '@/lib/tmdb';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LanguageIndicatorProps {
  selectedTranslation: MovieTranslation | null;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function LanguageIndicator({
  selectedTranslation,
  onClick,
  className = '',
  showTooltip = true,
  size = 'md'
}: LanguageIndicatorProps) {
  if (!selectedTranslation) return null;
  
  // Отримуємо відповідні розміри для різних варіантів
  const sizeClasses = {
    sm: 'text-xs py-0.5 px-1.5',
    md: 'text-sm py-1 px-2',
    lg: 'text-base py-1.5 px-2.5'
  };
  
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Запобігаємо поширенню події
    if (onClick) onClick(e);
  };
  
  const indicator = (
    <Badge 
      variant="outline" 
      className={`flex items-center gap-1 cursor-pointer bg-muted/30 hover:bg-muted ${sizeClasses[size]} ${className}`}
      onClick={handleClick}
    >
      {
      !selectedTranslation 
      ? <Loader2 />
      : (
        <>
          <Globe className={iconSizes[size]} />
          <span>{selectedTranslation.iso_639_1.toUpperCase()}</span>
        </>
      )
      }
    </Badge>
  );
  
  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {indicator}
          </TooltipTrigger>
          <TooltipContent>
            <p>Мова: {selectedTranslation.name}</p>
            <p className="text-xs">Натисніть, щоб змінити</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return indicator;
}