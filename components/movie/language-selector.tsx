// Файл: components/movie/language-selector.tsx
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
import { Input } from '@/components/ui/input';  // Додаємо для пошуку
import { Loader2, Globe, Search } from 'lucide-react';  // Додаємо іконки
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
  const [filteredTranslations, setFilteredTranslations] = useState<MovieTranslation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');  // Додаємо стан для пошуку

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
        
        // Фільтруємо переклади, залишаючи тільки ті, що мають опис або заголовок
        const validTranslations = data.translations.filter(
          (t: MovieTranslation) => 
            (t.data.overview && t.data.overview.trim() !== '') ||
            (t.data.title && t.data.title.trim() !== '')
        );
        
        // Сортуємо переклади - спочатку українська, потім англійська, потім всі інші
        validTranslations.sort((a: MovieTranslation, b: MovieTranslation) => {
          if (a.iso_639_1 === 'uk') return -1;
          if (b.iso_639_1 === 'uk') return 1;
          if (a.iso_639_1 === 'en') return -1;
          if (b.iso_639_1 === 'en') return 1;
          return a.name.localeCompare(b.name);
        });
        
        // Логуємо для відлагодження
        console.log(`Завантажено переклади для фільму ${movieId}:`, validTranslations.map((t: any) => 
          ({ iso_639_1: t.iso_639_1, iso_3166_1: t.iso_3166_1, name: t.name })));
        
        setTranslations(validTranslations);
        setFilteredTranslations(validTranslations);
      } catch (error) {
        console.error('Помилка при отриманні перекладів:', error);
        setError('Не вдалося завантажити переклади');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTranslations();
  }, [movieId, isOpen]);

  // Додаємо ефект для фільтрації перекладів при зміні пошукового запиту
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTranslations(translations);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = translations.filter(translation => 
      translation.name.toLowerCase().includes(query) || 
      translation.english_name?.toLowerCase().includes(query) ||
      translation.iso_639_1.toLowerCase().includes(query)
    );
    
    setFilteredTranslations(filtered);
  }, [searchQuery, translations]);

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
          <DialogTitle>Виберіть мову фільму</DialogTitle>
        </DialogHeader>
        
        {/* Додаємо пошук мови */}
        <div className="py-2">
            <ScrollArea className="max-h-[60vh] pr-4 overflow-auto">
              <div className="space-y-2 py-2">
                {filteredTranslations.map((translation) => (
                  <Button
                    key={getTranslationKey(translation)}
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
                    {/* Покажемо інформацію про наявність перекладу заголовка та опису */}
                    <div className="flex items-center ml-2 space-x-1">
                      {translation.data.title && (
                        <span className="px-1.5 py-0.5 rounded-sm bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs">T</span>
                      )}
                      {translation.data.overview && (
                        <span className="px-1.5 py-0.5 rounded-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs">O</span>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
        </div>
        
        {/* Додаємо легенду */}
        <div className="px-6 py-2 border-t text-xs text-muted-foreground flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="px-1.5 py-0.5 rounded-sm bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">T</span>
            <span>Назва</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-1.5 py-0.5 rounded-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">O</span>
            <span>Опис</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}