// app/favorite-actors/page.tsx
'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useFavoriteActors } from '@/hooks/use-favorite-actors';
import { useAuthStore } from '@/store/auth-store';
import { ActorCard } from '@/components/actor/actor-card';
import { Button } from '@/components/ui/button';
import { Heart, Loader2, Search, User } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function FavoriteActorsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Завантаження...</p>
      </div>
    }>
      <FavoriteActorsContent />
    </Suspense>
  );
}

function FavoriteActorsContent() {
  const { favoriteActors, isLoading, refetch } = useFavoriteActors();
  const { user, isLoading: isAuthLoading } = useAuthStore();
  const router = useRouter();
  
  // Ініціалізація стану аутентифікації при завантаженні сторінки
  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);
  
  // Автоматичний перехід на сторінку входу, якщо користувач не авторизований
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/');
    }
  }, [isAuthLoading, user, router]);
  
  // Якщо перевіряється стан аутентифікації, показуємо індикатор завантаження
  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Завантаження...</p>
      </div>
    );
  }
  
  // Якщо користувач не авторизований, показуємо повідомлення про необхідність входу
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] p-4">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 text-center">Авторизуйтесь для доступу до улюблених акторів</h1>
        <p className="text-muted-foreground mb-6 text-center">Для використання цієї функції необхідно увійти в свій обліковий запис</p>
        <Button onClick={() => router.push('/')} variant="default">
          На головну
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Улюблені актори</h1>
          <p className="text-muted-foreground">
            {favoriteActors.length
              ? `${favoriteActors.length} актор${favoriteActors.length > 1 ? 'ів' : ''} у вашому списку`
              : 'Ваш список улюблених акторів порожній'
            }
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:ml-auto w-full sm:w-auto">
          <Button onClick={() => router.push('/actors')} variant="default" className="w-full sm:w-auto">
            <Search className="mr-2 h-4 w-4" />
            Шукати акторів
          </Button>
        </div>
      </div>
      
      <Separator />
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : favoriteActors.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {favoriteActors.map((actor: any) => (
            <ActorCard 
              key={actor.actor_id} 
              actor={{
                id: actor.actor_id,
                name: actor.name,
                profile_path: actor.profile_path,
                known_for_department: actor.known_for_department,
                popularity: actor.popularity
              }} 
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 space-y-4 px-4">
          <Heart className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-center">Список улюблених акторів порожній</h2>
          <p className="text-muted-foreground max-w-md text-center">
            Додавайте акторів до улюблених, щоб швидко знаходити інформацію про них та їх фільми
          </p>
          <Button onClick={() => router.push('/actors')} variant="default" className="mt-4">
            <Search className="mr-2 h-4 w-4" />
            Шукати акторів
          </Button>
        </div>
      )}
    </div>
  );
}