'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Globe } from 'lucide-react';
import { MovieTranslation } from '@/lib/tmdb';

interface LanguageSelectorProps {
  movieId: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectLanguage: (translation: MovieTranslation) => void;
  currentLanguage: string;
}

export function LanguageSelector({
  movieId,
  isOpen,
  onClose,
  onSelectLanguage,
  currentLanguage,
}: LanguageSelectorProps) {
  const [translations, setTranslations] = useState<MovieTranslation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !movieId) return;

    const fetchTranslations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/movies/${movieId}/translations`);
        if (!response.ok) {
          throw new Error('Не вдалося отримати переклади');
        }
        
        const data = await response.json();
        
        // Фільтруємо переклади, залишаючи тільки ті, що мають опис
        const validTranslations = data.translations.filter(
          (t: MovieTranslation) => t.data.overview && t.data.overview.trim() !== ''
        );
        
        // Логуємо для відлагодження
        console.log(`Завантажено переклади для фільму ${movieId}:`, validTranslations.map((t: any) => 
          ({ iso_639_1: t.iso_639_1, iso_3166_1: t.iso_3166_1, name: t.name })));
        
        setTranslations(validTranslations);
      } catch (error) {
        console.error('Помилка при отриманні перекладів:', error);
        setError('Не вдалося завантажити переклади');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTranslations();
  }, [movieId, isOpen]);

  // Створюємо унікальний ідентифікатор для кожного перекладу
  const getTranslationKey = (translation: MovieTranslation) => {
    return `${translation.iso_639_1}-${translation.iso_3166_1}`;
  };

  // Перевіряємо, чи це є поточна мова
  const isCurrentLanguage = (translation: MovieTranslation) => {
    return translation.iso_639_1 === currentLanguage;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Виберіть мову опису</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="py-4 text-center text-red-500">
            {error}
          </div>
        ) : translations.length === 0 ? (
          <div className="py-4 text-center">
            Немає доступних перекладів
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-2 py-2">
              {translations.map((translation) => (
                <Button
                  key={`${translation.iso_639_1}-${translation.iso_3166_1}`}
                  variant={isCurrentLanguage(translation) ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => {
                    onSelectLanguage(translation);
                    onClose();
                  }}
                >
                  <Globe className="mr-2 h-4 w-4" />
                  <span className="font-semibold">{translation.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {translation.iso_639_1.toUpperCase()} {translation.iso_3166_1 && `(${translation.iso_3166_1})`}
                  </span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}