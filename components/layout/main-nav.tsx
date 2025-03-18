// components/layout/main-nav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, BookmarkIcon, Film, Users, Menu, X, Shuffle, Archive, Eye, UserCircle, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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

export function MainNav() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [signupModalOpen, setSignupModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Ініціали користувача для аватара
  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'U';

  // Закривати мобільне меню при зміні шляху
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);
  
  const navItems = [
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
    {
      href: "/watchlist",
      label: "Список перегляду",
      icon: <BookmarkIcon className="h-4 w-4 mr-2" />,
      isActive: pathname === "/watchlist"
    },
    {
      href: "/archive",
      label: "Архів",
      icon: <Eye className="h-4 w-4 mr-2" />,
      isActive: pathname === "/archive",
      requireAuth: true
    },
    {
      href: "/favorite-actors",
      label: "Улюблені актори",
      icon: <Heart className="h-4 w-4 mr-2" />,
      isActive: pathname === "/favorite-actors",
      requireAuth: true
    },
    {
      href: "/friends",
      label: "Друзі",
      icon: <Users className="h-4 w-4 mr-2" />,
      isActive: pathname.startsWith("/friends"),
      requireAuth: true
    }
  ];
  
  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <Link href="/" className="flex items-center text-xl font-bold">
          <Film className="mr-2 h-6 w-6" />
          <span>WatchPick</span>
        </Link>
        
        {/* Десктопна навігація */}
        <nav className="hidden md:flex items-center space-x-2 lg:space-x-4 mx-6">
          {navItems.map((item) => (
            (!item.requireAuth || user) && (
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
            )
          ))}
        </nav>
        
        <div className="ml-auto flex items-center gap-4">
          {/* Кнопка мобільного меню - переміщена вправо */}
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
                    {navItems.map((item) => (
                      (!item.requireAuth || user) && (
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
                      )
                    ))}
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
                <DropdownMenuItem asChild>
                  <Link href="/watchlist" className="cursor-pointer">
                    <BookmarkIcon className="h-4 w-4 mr-2" />
                    Список перегляду
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/archive" className="cursor-pointer">
                    <Eye className="h-4 w-4 mr-2" />
                    Архів переглянутих
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/favorite-actors" className="cursor-pointer">
                    <Heart className="h-4 w-4 mr-2" />
                    Улюблені актори
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/friends" className="cursor-pointer">
                    <Users className="h-4 w-4 mr-2" />
                    Мої друзі
                  </Link>
                </DropdownMenuItem>
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