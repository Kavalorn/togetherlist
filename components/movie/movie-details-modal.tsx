// components/movie/movie-details-modal.tsx
'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useUIStore } from '@/store/ui-store';
import { Loader2 } from 'lucide-react';
import { MovieContent } from './movie-content';
import { VisuallyHidden } from '@/components/ui/visually-hidden';

export function MovieDetailsModal() {
  const { isMovieDetailsModalOpen, isMovieDetailsModalLoading, selectedMovie, closeMovieDetailsModal } = useUIStore();

  // Отображаем состояние загрузки, если данные фильма еще не загружены
  if (isMovieDetailsModalOpen && isMovieDetailsModalLoading) {
    return (
      <Dialog open={true} onOpenChange={(open) => !open && closeMovieDetailsModal()}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex items-center justify-center">
          <VisuallyHidden>
            <DialogTitle>Завантаження фільму</DialogTitle>
          </VisuallyHidden>
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Завантаження інформації про фільм...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Если фильм не выбран, не отображаем модальное окно
  if (!selectedMovie) {
    return null;
  }

  return (
    <Dialog open={isMovieDetailsModalOpen} onOpenChange={(open) => !open && closeMovieDetailsModal()}>
      <DialogContent className="sm:max-w-[80vw] md:max-w-4xl max-h-[90vh] overflow-auto p-0">
        <VisuallyHidden>
          <DialogTitle>{selectedMovie.title}</DialogTitle>
        </VisuallyHidden>
        <MovieContent movie={selectedMovie} isModal={true} />
      </DialogContent>
    </Dialog>
  );
}