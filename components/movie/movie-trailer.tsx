'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { MovieVideo } from '@/lib/tmdb';

interface MovieTrailerProps {
  movieId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function MovieTrailer({ movieId, isOpen, onClose }: MovieTrailerProps) {
  const [trailer, setTrailer] = useState<MovieVideo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Очищаємо стан при зміні ID фільму або відкритті/закритті
    if (!isOpen) {
      return;
    }

    const fetchTrailer = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/movies/${movieId}/videos`);
        if (!response.ok) {
          throw new Error('Не вдалося отримати трейлери');
        }
        
        const data = await response.json();
        
        // Шукаємо офіційний трейлер
        let bestTrailer = data.results.find(
          (video: MovieVideo) => 
            video.type === 'Trailer' && 
            video.site === 'YouTube' && 
            video.official
        );
        
        // Якщо офіційного трейлера немає, шукаємо будь-який трейлер
        if (!bestTrailer) {
          bestTrailer = data.results.find(
            (video: MovieVideo) => 
              video.type === 'Trailer' && 
              video.site === 'YouTube'
          );
        }
        
        // Якщо все ще немає, беремо перше відео
        if (!bestTrailer && data.results.length > 0) {
          bestTrailer = data.results[0];
        }
        
        setTrailer(bestTrailer || null);
      } catch (error) {
        console.error('Помилка при отриманні трейлера:', error);
        setError('Не вдалося завантажити трейлер');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrailer();
  }, [movieId, isOpen]);

  const getYoutubeEmbedUrl = (key: string) => {
    return `https://www.youtube.com/embed/${key}?autoplay=1&origin=${window.location.origin}&rel=0`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[70vw] p-0 overflow-hidden">
        <div className="relative w-full aspect-video bg-black">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white">{error}</p>
            </div>
          ) : trailer ? (
            <iframe
              src={getYoutubeEmbedUrl(trailer.key)}
              className="absolute inset-0 w-full h-full"
              title={trailer.name}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white">Трейлер не знайдено</p>
            </div>
          )}
          
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 bg-black/50 text-white hover:bg-black/70"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}