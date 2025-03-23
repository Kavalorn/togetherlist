// components/movie/movie-providers.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useMovieProviders } from '@/hooks/use-movie-providers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Loader2, 
  DollarSign, 
  Play, 
  Monitor, 
  Ticket, 
  ExternalLink,
  ChevronDown,
  ChevronUp
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

// Карти для відображення повних назв країн
const COUNTRY_NAMES: { [code: string]: string } = {
  'UA': 'Україна',
  'US': 'США',
  'GB': 'Велика Британія',
  'DE': 'Німеччина',
  'PL': 'Польща',
  'FR': 'Франція',
  'IT': 'Італія',
  'ES': 'Іспанія',
  'CA': 'Канада',
  // Додайте більше країн за потреби
};

// Іконки для різних типів провайдерів
const PROVIDER_TYPE_ICONS: { [key: string]: React.ReactNode } = {
  'flatrate': <Play className="h-4 w-4 mr-2" />,
  'buy': <DollarSign className="h-4 w-4 mr-2" />,
  'rent': <Ticket className="h-4 w-4 mr-2" />,
  'free': <Monitor className="h-4 w-4 mr-2" />,
  'ads': <Monitor className="h-4 w-4 mr-2" />
};

// Переклад типів провайдерів
const PROVIDER_TYPE_NAMES: { [key: string]: string } = {
  'flatrate': 'Підписка',
  'buy': 'Купити',
  'rent': 'Орендувати',
  'free': 'Безкоштовно',
  'ads': 'З рекламою'
};

interface MovieProvidersProps {
  movieId: number;
  className?: string;
}

export function MovieProviders({ movieId, className = '' }: MovieProvidersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  
  // Викликаємо хук тільки коли користувач відкрив випадайку
  const { providers, isLoading, error, bestCountry, availableCountries } = useMovieProviders(
    isDataFetched ? movieId : null
  );
  
  // Отримуємо активну країну (вибрану або найкращу за замовчуванням)
  const activeCountry = selectedCountry || (bestCountry?.countryCode || null);
  
  // Отримуємо провайдерів для активної країни
  const activeProviders = activeCountry && providers?.results?.[activeCountry];
  
  // Отримуємо назву країни
  const getCountryName = (code: string): string => {
    return COUNTRY_NAMES[code] || code;
  };
  
  // Всі можливі типи провайдерів для відображення у табах
  const availableTypes = activeProviders
    ? Object.keys(activeProviders).filter(key => 
        key !== 'link' && Array.isArray(activeProviders[key]) && activeProviders[key].length > 0
      )
    : [];
  
  // Обробник розгортання/згортання секції
  const handleToggle = (open: boolean) => {
    setIsOpen(open);
    if (open && !isDataFetched) {
      setIsDataFetched(true);
    }
  };
  
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={handleToggle}
      className={`${className} border rounded-lg overflow-hidden`}
    >
      <CollapsibleTrigger asChild>
        <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-muted/30">
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            <span className="font-medium">Офіційні стрімінг-платформи</span>
          </div>
          <div>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="px-4 pb-4">
          {isLoading ? (
            <div className="py-8 flex justify-center items-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="py-4 text-center text-muted-foreground">
              Не вдалося завантажити інформацію про провайдерів.
            </div>
          ) : !providers || !bestCountry || availableCountries.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">
              Інформація про офіційні стрімінг-платформи для цього фільму відсутня.
            </div>
          ) : (
            <div className="pt-1">
              {availableCountries.length > 1 && (
                <div className="flex justify-end mb-2">
                  <Select 
                    value={activeCountry || ''} 
                    onValueChange={(value) => setSelectedCountry(value)}
                  >
                    <SelectTrigger className="w-[140px] h-8">
                      <SelectValue placeholder="Виберіть країну" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCountries.map(code => (
                        <SelectItem key={code} value={code}>
                          {getCountryName(code)} ({code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="text-sm mb-3">
                Доступно в {getCountryName(activeCountry || '')}{' '}
                {activeProviders?.link && (
                  <a 
                    href={activeProviders.link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-500 hover:underline inline-flex items-center ml-1"
                  >
                    (JustWatch <ExternalLink className="h-3 w-3 ml-0.5" />)
                  </a>
                )}
              </div>
              
              {availableTypes.length > 0 ? (
                <Tabs defaultValue={availableTypes[0]}>
                  <TabsList className="mb-3">
                    {availableTypes.map(type => (
                      <TabsTrigger key={type} value={type} className="flex items-center">
                        {PROVIDER_TYPE_ICONS[type]}
                        {PROVIDER_TYPE_NAMES[type]}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {availableTypes.map(type => (
                    <TabsContent key={type} value={type} className="m-0">
                      <div className="flex flex-wrap gap-3 py-1">
                        {activeProviders && activeProviders[type]?.map(provider => (
                          <div key={provider.provider_id} className="flex flex-col items-center gap-1">
                            <div className="relative w-12 h-12 rounded-md overflow-hidden border">
                              <Image
                                src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                                alt={provider.provider_name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <span className="text-xs text-center leading-tight max-w-12 line-clamp-2">
                              {provider.provider_name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Детальна інформація про стрімінг-платформи для обраної країни відсутня.
                </div>
              )}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}