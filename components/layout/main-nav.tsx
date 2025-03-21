'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Search, BookmarkIcon, Film, Users, Menu, 
  Shuffle, Archive, Eye, UserCircle, Heart, 
  Settings, List, Inbox, FolderPlus,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/auth-store';
import { useState, useEffect } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { SignupForm } from '@/components/auth/signup-form';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/theme-toggle';
import { useWatchlists } from '@/hooks/use-watchlists';
import { ScrollArea } from '@/components/ui/scroll-area';

export function MainNav() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [signupModalOpen, setSignupModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { watchlists, isLoading: isLoadingWatchlists } = useWatchlists();
  
  // Ініціали користувача для аватара
  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'U';

  // Закривати мобільне меню при зміні шляху
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);
  
  // Основні навігаційні елементи
  const mainNavItems = [
    {
      href: "/",
      label: "Пошук фільмів",
      icon: <Search className="h-4 w-4 mr-2" />,
      isActive: pathname === "/"
    },
    {
      href: "/discover",
      label: "Відкрийте",
      icon: <Shuffle className="h-4 w-4 mr-2" />,
      isActive: pathname === "/discover"
    },
    {
      href: "/actors",
      label: "Актори",
      icon: <UserCircle className="h-4 w-4 mr-2" />,
      isActive: pathname === "/actors" || pathname.startsWith("/actor/")
    },
  ];
  
  // Навігаційні елементи, що потребують авторизації
  const authNavItems = [
    {
      href: "/favorite-actors",
      label: "Улюблені актори",
      icon: <Heart className="h-4 w-4 mr-2" />,
      isActive: pathname === "/favorite-actors"
    },
    {
      href: "/archive",
      label: "Архів",
      icon: <Eye className="h-4 w-4 mr-2" />,
      isActive: pathname === "/archive"
    },
    {
      href: "/friends",
      label: "Друзі",
      icon: <Users className="h-4 w-4 mr-2" />,
      isActive: pathname.startsWith("/friends")
    }
  ];
  
  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <Link href="/" className="flex items-center text-xl font-bold">
          <Film className="mr-2 h-6 w-6" />
          <span className="hidden sm:inline">WatchPick</span>
        </Link>
        
        {/* Десктопна основна навігація */}
        <nav className="hidden md:flex items-center space-x-2 lg:space-x-4 mx-6">
          {mainNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary flex items-center px-2 py-1 rounded-md",
                item.isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
          
          {/* Дропдаун для списків перегляду (видимий тільки для авторизованих) */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className={cn(
                  "text-sm font-medium transition-colors hover:text-primary flex items-center px-2 py-1 rounded-md",
                  pathname.startsWith("/watchlists") 
                    ? "text-primary" 
                    : "text-muted-foreground"
                )}>
                  <List className="h-4 w-4 mr-2" />
                  Списки фільмів
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Ваші списки</DropdownMenuLabel>
                
                {isLoadingWatchlists ? (
                  <DropdownMenuItem disabled>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Завантаження...
                  </DropdownMenuItem>
                ) : watchlists.length > 0 ? (
                  <ScrollArea className="h-[200px]">
                    {watchlists.map((list) => (
                      <DropdownMenuItem key={list.id} asChild>
                        <Link href={`/watchlists/${list.id}`} className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: list.color || '#3b82f6' }}
                          />
                          <span>
                            {list.name}
                            {list.isDefault && <span className="text-xs ml-1 opacity-70">(за замовчуванням)</span>}
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </ScrollArea>
                ) : (
                  <DropdownMenuItem disabled>
                    Немає списків
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem asChild>
                  <Link href="/watchlists">
                    <Inbox className="h-4 w-4 mr-2" />
                    Всі списки
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link href="/watchlists/create">
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Створити список
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {/* Дропдаун для колекцій (видимий тільки для авторизованих) */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className={cn(
                  "text-sm font-medium transition-colors hover:text-primary flex items-center px-2 py-1 rounded-md",
                  pathname === "/watchlist" || pathname === "/archive" || pathname === "/favorite-actors" 
                    ? "text-primary" 
                    : "text-muted-foreground"
                )}>
                  <BookmarkIcon className="h-4 w-4 mr-2" />
                  Колекції
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  {authNavItems.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link 
                        href={item.href} 
                        className={cn(
                          "cursor-pointer",
                          item.isActive ? "bg-muted" : ""
                        )}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>
        
        <div className="ml-auto flex items-center gap-4">
          {/* Кнопка зміни теми */}
          <ThemeToggle />
          
          {/* Кнопка мобільного меню */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Відкрити меню</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
              <div className="flex flex-col h-full">
                <div className="p-4 border-b">
                  <Link 
                    href="/" 
                    className="flex items-center text-xl font-bold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Film className="mr-2 h-6 w-6" />
                    <span>WatchPick</span>
                  </Link>
                </div>
                
                <div className="flex-1 overflow-auto p-6">
                  <nav className="flex flex-col gap-2 mb-6">
                    {/* Основна навігація */}
                    <div className="mb-2">
                      <h3 className="mb-1 text-xs uppercase text-muted-foreground font-semibold">Навігація</h3>
                      {mainNavItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            item.isActive 
                              ? "bg-primary/10 text-primary" 
                              : "hover:bg-muted text-muted-foreground hover:text-foreground"
                          )}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {item.icon}
                          {item.label}
                        </Link>
                      ))}
                    </div>
                    
                    {/* Списки фільмів для мобільного */}
                    {user && (
                      <div>
                        <h3 className="mb-1 text-xs uppercase text-muted-foreground font-semibold">Списки фільмів</h3>
                        <Link
                          href="/watchlists"
                          className={cn(
                            "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            pathname.startsWith("/watchlists") 
                              ? "bg-primary/10 text-primary" 
                              : "hover:bg-muted text-muted-foreground hover:text-foreground"
                          )}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Inbox className="h-4 w-4 mr-2" />
                          Всі списки
                        </Link>
                        
                        {!isLoadingWatchlists && watchlists.length > 0 && (
                          <div className="pl-3 mt-1">
                            {watchlists.slice(0, 5).map((list) => (
                              <Link
                                key={list.id}
                                href={`/watchlists/${list.id}`}
                                className="flex items-center rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-muted"
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                <div 
                                  className="w-2 h-2 rounded-full mr-2"
                                  style={{ backgroundColor: list.color || '#3b82f6' }}
                                />
                                <span className="truncate">
                                  {list.name}
                                </span>
                              </Link>
                            ))}
                            {watchlists.length > 5 && (
                              <Link
                                href="/watchlists"
                                className="flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors text-muted-foreground hover:text-foreground"
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                <span>+ ще {watchlists.length - 5}</span>
                              </Link>
                            )}
                          </div>
                        )}
                        
                        <Link
                          href="/watchlists/create"
                          className="flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <FolderPlus className="h-4 w-4 mr-2" />
                          Створити список
                        </Link>
                      </div>
                    )}
                    
                    {/* Колекції (тільки для авторизованих) */}
                    {user && (
                      <div>
                        <h3 className="mb-1 text-xs uppercase text-muted-foreground font-semibold">Мої колекції</h3>
                        {authNavItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                              item.isActive 
                                ? "bg-primary/10 text-primary" 
                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {item.icon}
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                    
                    {/* Налаштування та тема в мобільному меню */}
                    <div className="mt-4">
                      <h3 className="mb-1 text-xs uppercase text-muted-foreground font-semibold">Налаштування</h3>
                      <div className="flex items-center justify-between rounded-md px-3 py-2">
                        <span className="text-sm font-medium">Тема</span>
                        <ThemeToggle />
                      </div>
                    </div>
                  </nav>
                </div>
                
                <div className="border-t p-4">
                  {user ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || ''} />
                          <AvatarFallback>{userInitials}</AvatarFallback>
                        </Avatar>
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium truncate">{user.email}</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => {
                          logout();
                          setMobileMenuOpen(false);
                        }}
                      >
                        Вийти
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setLoginModalOpen(true);
                        }}
                      >
                        Увійти
                      </Button>
                      <Button 
                        variant="default" 
                        className="w-full" 
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setSignupModalOpen(true);
                        }}
                      >
                        Зареєструватися
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || ''} />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/watchlists">
                      <Inbox className="h-4 w-4 mr-2" />
                      Списки фільмів
                    </Link>
                  </DropdownMenuItem>
                  
                  {authNavItems.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className="cursor-pointer">
                        {item.icon}
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => logout()}
                >
                  Вийти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button 
                variant="ghost" 
                onClick={() => setLoginModalOpen(true)}
              >
                Увійти
              </Button>
              <Button 
                variant="default" 
                onClick={() => setSignupModalOpen(true)}
              >
                Зареєструватися
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Модальне вікно входу */}
      <Dialog open={loginModalOpen} onOpenChange={setLoginModalOpen}>
        <DialogContent className="sm:max-w-[425px] max-w-[95vw] w-full">
          <DialogHeader>
            <DialogTitle>Вхід в обліковий запис</DialogTitle>
          </DialogHeader>
          <LoginForm onSuccess={() => setLoginModalOpen(false)} />
          <div className="mt-4 text-center text-sm">
            <p>
              Немає облікового запису?{' '}
              <Button 
                variant="link" 
                className="p-0 h-auto" 
                onClick={() => {
                  setLoginModalOpen(false);
                  setSignupModalOpen(true);
                }}
              >
                Зареєструватися
              </Button>
            </p>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Модальне вікно реєстрації */}
      <Dialog open={signupModalOpen} onOpenChange={setSignupModalOpen}>
        <DialogContent className="sm:max-w-[425px] max-w-[95vw] w-full">
          <DialogHeader>
            <DialogTitle>Створення облікового запису</DialogTitle>
          </DialogHeader>
          <SignupForm onSuccess={() => setSignupModalOpen(false)} />
          <div className="mt-4 text-center text-sm">
            <p>
              Вже маєте обліковий запис?{' '}
              <Button 
                variant="link" 
                className="p-0 h-auto" 
                onClick={() => {
                  setSignupModalOpen(false);
                  setLoginModalOpen(true);
                }}
              >
                Увійти
              </Button>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}