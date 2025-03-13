'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, BookmarkIcon, Film, Users } from 'lucide-react';
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
import { useState } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { SignupForm } from '@/components/auth/signup-form';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';

export function MainNav() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [signupModalOpen, setSignupModalOpen] = useState(false);
  
  // Ініціали користувача для аватара
  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'U';
  
  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <Link href="/" className="flex items-center text-xl font-bold mr-6">
          <Film className="mr-2 h-6 w-6" />
          <span>WatchPick</span>
        </Link>
        
        <nav className="flex items-center space-x-2 lg:space-x-4 mx-6">
          <Link
            href="/"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary flex items-center px-2 py-1 rounded-md",
              pathname === "/" ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Search className="h-4 w-4 mr-2" />
            Пошук
          </Link>
          <Link
            href="/watchlist"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary flex items-center px-2 py-1 rounded-md",
              pathname === "/watchlist" ? "text-primary" : "text-muted-foreground"
            )}
          >
            <BookmarkIcon className="h-4 w-4 mr-2" />
            Список перегляду
          </Link>
          {user && (
            <Link
              href="/friends"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary flex items-center px-2 py-1 rounded-md",
                pathname.startsWith("/friends") ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Users className="h-4 w-4 mr-2" />
              Друзі
            </Link>
          )}
        </nav>
        
        <div className="ml-auto flex items-center space-x-4">
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
                  <Link href="/friends" className="cursor-pointer">
                    <Users className="h-4 w-4 mr-2" />
                    Мої друзі
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => logout()}
                >
                  Вийти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
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
        <DialogContent className="sm:max-w-[425px]">
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
        <DialogContent className="sm:max-w-[425px]">
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