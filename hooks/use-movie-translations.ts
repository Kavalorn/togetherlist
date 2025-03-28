// Файл: hooks/use-movie-translations.ts
import { useState, useEffect, useRef } from 'react';
import { MovieTranslation } from '@/lib/tmdb';

export function useMovieTranslations(
  movieId: number | null, 
  originalOverview: string | undefined,
  originalTitle: string | undefined
) {
  const [translations, setTranslations] = useState<MovieTranslation[]>([]);
  const [selectedTranslation, setSelectedTranslation] = useState<MovieTranslation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLanguageSelectorOpen, setIsLanguageSelectorOpen] = useState(false);
  
  // Додаємо ref для відстеження поточного ID фільму
  const currentMovieIdRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Якщо ID фільму змінився, скидаємо стан
    if (movieId !== currentMovieIdRef.current) {
      setSelectedTranslation(null);
      setTranslations([]);
      currentMovieIdRef.current = movieId;
    }
    
    if (!movieId) return;

    const fetchTranslations = async () => {
      try {
        setIsLoading(true);
        
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
        
        console.log(`Завантажено ${validTranslations.length} перекладів для фільму ${movieId}`);
        setTranslations(validTranslations);
        
        // Спочатку шукаємо українську мову
        let foundTranslation = validTranslations.find((t: any) => t.iso_639_1 === 'uk');
        
        // Якщо український переклад не знайдено, шукаємо англійську
        if (!foundTranslation) {
          foundTranslation = validTranslations.find((t: any) => t.iso_639_1 === 'en');
        }
        
        // Якщо жодна з пріоритетних мов не знайдена, беремо перший доступний переклад
        if (!foundTranslation && validTranslations.length > 0) {
          foundTranslation = validTranslations[0];
        }
        
        if (foundTranslation) {
          console.log(`Вибрано переклад: ${foundTranslation.iso_639_1}-${foundTranslation.iso_3166_1} (${foundTranslation.name})`);
          
          // Логуємо наявні поля перекладу
          console.log("Переклад містить:", {
            title: !!foundTranslation.data.title,
            overview: !!foundTranslation.data.overview
          });
        }
        
        setSelectedTranslation(foundTranslation || null);
      } catch (error) {
        console.error('Помилка при отриманні перекладів:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTranslations();
  }, [movieId]);

  const changeLanguage = (translation: MovieTranslation) => {
    console.log(`Зміна мови на: ${translation.iso_639_1}-${translation.iso_3166_1} (${translation.name})`);
    console.log("Переклад містить:", {
      title: !!translation.data.title,
      overview: !!translation.data.overview
    });
    setSelectedTranslation(translation);
  };

  const openLanguageSelector = () => {
    setIsLanguageSelectorOpen(true);
  };

  const closeLanguageSelector = () => {
    setIsLanguageSelectorOpen(false);
  };

  const hasMultipleTranslations = translations.length > 1;
  
  return {
    selectedTranslation,
    translations,
    isLoading,
    hasMultipleTranslations,
    isLanguageSelectorOpen,
    changeLanguage,
    openLanguageSelector,
    closeLanguageSelector,
    // Функція для отримання опису
    getDescription: () => {
      if (selectedTranslation?.data?.overview) {
        return selectedTranslation.data.overview;
      }
      return originalOverview || 'Опис відсутній';
    },
    // Нова функція для отримання заголовка
    getTitle: () => {
      if (selectedTranslation?.data?.title) {
        return selectedTranslation.data.title;
      }
      return originalTitle || 'Назва відсутня';
    }
  };
}