'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '@/store/auth-store';
import { useFriends } from '@/hooks/use-friends';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  UserPlus, 
  Users, 
  UserCheck, 
  Clock, 
  Send, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  X, 
  Film,
  AlertCircle
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { 
  Alert, 
  AlertDescription 
} from '@/components/ui/alert';
import { toast } from 'sonner';

export default function FriendsPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'accepted' | 'pending' | 'sent'>('accepted');
  const [addFriendDialogOpen, setAddFriendDialogOpen] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');
  const [addFriendError, setAddFriendError] = useState<string | null>(null);
  
  // Запити на отримання друзів з різними статусами
  const { 
    friends: acceptedFriends, 
    isLoading: isLoadingAccepted,
    addFriend: addFriendMutation,
    isAddingFriend,
    error: acceptedError
  } = useFriends('accepted');
  
  const { 
    friends: pendingFriends, 
    isLoading: isLoadingPending,
    respondToFriendRequest,
    isRespondingToRequest,
    error: pendingError
  } = useFriends('pending');
  
  const { 
    friends: sentFriends, 
    isLoading: isLoadingSent,
    removeFriend,
    isRemovingFriend,
    error: sentError 
  } = useFriends('sent');
  
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
  
  // Обробник додавання друга
  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddFriendError(null);
    
    try {
      await addFriendMutation(friendEmail, {
        onSuccess: () => {
          setFriendEmail('');
          setAddFriendDialogOpen(false);
          toast.success('Запит на дружбу надіслано!');
        },
        onError: (error: Error) => {
          setAddFriendError(error.message);
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        setAddFriendError(error.message);
      } else {
        setAddFriendError('Сталася помилка при додаванні друга');
      }
    }
  };
  
  // Обробник прийняття запиту на дружбу
  const handleAcceptRequest = async (id: number) => {
    try {
      await respondToFriendRequest({ id, status: 'accepted' }, {
        onSuccess: () => {
          toast.success('Запит на дружбу прийнято!');
        },
        onError: (error: Error) => {
          toast.error(`Помилка: ${error.message}`);
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Помилка: ${error.message}`);
      } else {
        toast.error('Сталася помилка при прийнятті запиту');
      }
    }
  };
  
  // Обробник відхилення запиту на дружбу
  const handleRejectRequest = async (id: number) => {
    try {
      await respondToFriendRequest({ id, status: 'rejected' }, {
        onSuccess: () => {
          toast.success('Запит на дружбу відхилено');
        },
        onError: (error: Error) => {
          toast.error(`Помилка: ${error.message}`);
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Помилка: ${error.message}`);
      } else {
        toast.error('Сталася помилка при відхиленні запиту');
      }
    }
  };
  
  // Обробник скасування запиту на дружбу
  const handleCancelRequest = async (id: number) => {
    try {
      await removeFriend(id, {
        onSuccess: () => {
          toast.success('Запит на дружбу скасовано');
        },
        onError: (error: Error) => {
          toast.error(`Помилка: ${error.message}`);
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Помилка: ${error.message}`);
      } else {
        toast.error('Сталася помилка при скасуванні запиту');
      }
    }
  };
  
  // Обробник видалення друга
  const handleRemoveFriend = async (id: number) => {
    try {
      await removeFriend(id, {
        onSuccess: () => {
          toast.success('Друга видалено зі списку');
        },
        onError: (error: Error) => {
          toast.error(`Помилка: ${error.message}`);
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Помилка: ${error.message}`);
      } else {
        toast.error('Сталася помилка при видаленні друга');
      }
    }
  };
  
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
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <h1 className="text-2xl font-bold mb-4">Авторизуйтесь для доступу до списку друзів</h1>
        <p className="text-muted-foreground mb-6">Для використання цієї функції необхідно увійти в свій обліковий запис</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Друзі</h1>
          <p className="text-muted-foreground">
            Додавайте друзів та діліться списками переглядів фільмів
          </p>
        </div>
        
        <Button onClick={() => setAddFriendDialogOpen(true)} variant="default" className="ml-auto">
          <UserPlus className="mr-2 h-4 w-4" />
          Додати друга
        </Button>
      </div>
      
      <Separator />
      
      <Tabs defaultValue="accepted" value={activeTab} onValueChange={(value) => setActiveTab(value as 'accepted' | 'pending' | 'sent')}>
        <TabsList className="mb-6">
          <TabsTrigger value="accepted" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Друзі</span>
            {acceptedFriends.length > 0 && (
              <span className="ml-1 rounded-full bg-primary text-primary-foreground text-xs px-2 py-0.5">
                {acceptedFriends.length}
              </span>
            )}
          </TabsTrigger>
          
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Запити</span>
            {pendingFriends.length > 0 && (
              <span className="ml-1 rounded-full bg-primary text-primary-foreground text-xs px-2 py-0.5">
                {pendingFriends.length}
              </span>
            )}
          </TabsTrigger>
          
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            <span>Надіслані</span>
            {sentFriends.length > 0 && (
              <span className="ml-1 rounded-full bg-primary text-primary-foreground text-xs px-2 py-0.5">
                {sentFriends.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="accepted">
          {isLoadingAccepted ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : acceptedFriends.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {acceptedFriends.map((friend) => (
                <Card key={friend.id} className="overflow-hidden">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-16 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                        {friend.friend?.avatar_url ? (
                          <Image
                            src={friend.friend.avatar_url}
                            alt={friend.friend?.display_name || friend.friend?.email || ''}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-2xl text-muted-foreground">
                            {(friend.friend?.display_name || friend.friend?.email || '').substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">
                          {friend.friend?.display_name || friend.friend?.email || 'Невідомий користувач'}
                        </h3>
                        {friend.friend?.display_name && friend.friend?.email && (
                          <p className="text-sm text-muted-foreground truncate">{friend.friend.email}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2 justify-between">
                    <Button
                      variant="default"
                      className="flex-1"
                      onClick={() => router.push(`/friends/${friend.friend?.id}`)}
                    >
                      <Film className="mr-2 h-4 w-4" />
                      Фільми
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleRemoveFriend(friend.id)}
                      disabled={isRemovingFriend}
                    >
                      {isRemovingFriend ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <X className="mr-2 h-4 w-4" />
                      )}
                      Видалити
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Users className="h-16 w-16 text-muted-foreground" />
              <h2 className="text-xl font-semibold">У вас ще немає друзів</h2>
              <p className="text-muted-foreground max-w-md text-center">
                Додайте друзів, щоб ділитися з ними списками переглядів фільмів
              </p>
              <Button onClick={() => setAddFriendDialogOpen(true)} variant="default" className="mt-4">
                <UserPlus className="mr-2 h-4 w-4" />
                Додати друга
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="pending">
          {isLoadingPending ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : pendingFriends.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {pendingFriends.map((request) => (
                <Card key={request.id} className="overflow-hidden">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-16 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                        {request.friend?.avatar_url ? (
                          <Image
                            src={request.friend.avatar_url}
                            alt={request.friend?.display_name || request.friend?.email || ''}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-2xl text-muted-foreground">
                            {(request.friend?.display_name || request.friend?.email || '').substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">
                          {request.friend?.display_name || request.friend?.email || 'Невідомий користувач'}
                        </h3>
                        {request.friend?.display_name && request.friend?.email && (
                          <p className="text-sm text-muted-foreground truncate">{request.friend.email}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2 justify-between">
                    <Button 
                      variant="default" 
                      className="flex-1"
                      onClick={() => handleAcceptRequest(request.id)}
                      disabled={isRespondingToRequest}
                    >
                      {isRespondingToRequest ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Прийняти
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleRejectRequest(request.id)}
                      disabled={isRespondingToRequest}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Відхилити
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Clock className="h-16 w-16 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Немає нових запитів на дружбу</h2>
              <p className="text-muted-foreground max-w-md text-center">
                Тут з'являться запити на дружбу від інших користувачів
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="sent">
          {isLoadingSent ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sentFriends.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sentFriends.map((request) => (
                <Card key={request.id} className="overflow-hidden">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-16 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                        {request.friend?.avatar_url ? (
                          <Image
                            src={request.friend.avatar_url}
                            alt={request.friend?.display_name || request.friend?.email || ''}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-2xl text-muted-foreground">
                            {(request.friend?.display_name || request.friend?.email || '').substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">
                          {request.friend?.display_name || request.friend?.email || 'Невідомий користувач'}
                        </h3>
                        {request.friend?.display_name && request.friend?.email && (
                          <p className="text-sm text-muted-foreground truncate">{request.friend.email}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          <Clock className="inline-block mr-1 h-3 w-3" />
                          Очікує підтвердження
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleCancelRequest(request.id)}
                      disabled={isRemovingFriend}
                    >
                      {isRemovingFriend ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <X className="mr-2 h-4 w-4" />
                      )}
                      Скасувати запит
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Send className="h-16 w-16 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Ви не надіслали жодного запиту</h2>
              <p className="text-muted-foreground max-w-md text-center">
                Надішліть запити друзям, щоб почати ділитися списками переглядів фільмів
              </p>
              <Button onClick={() => setAddFriendDialogOpen(true)} variant="default" className="mt-4">
                <UserPlus className="mr-2 h-4 w-4" />
                Додати друга
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <Dialog open={addFriendDialogOpen} onOpenChange={setAddFriendDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Додати друга</DialogTitle>
            <DialogDescription>
              Введіть електронну пошту користувача, якого хочете додати в друзі
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAddFriend}>
            {addFriendError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>
                  <AlertCircle className="h-4 w-4 mr-2 inline-block" />
                  {addFriendError}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-span-4">
                  <Input
                    id="friendEmail"
                    placeholder="email@example.com"
                    value={friendEmail}
                    onChange={(e) => setFriendEmail(e.target.value)}
                    required
                    type="email"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setAddFriendDialogOpen(false)}
              >
                Скасувати
              </Button>
              <Button 
                type="submit" 
                disabled={isAddingFriend || !friendEmail}
              >
                {isAddingFriend ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Відправка...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Надіслати запит
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}