'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Check } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Movie, MovieDetails } from '@/lib/tmdb';

interface ShareButtonsProps {
  movie: Movie | MovieDetails;
  className?: string;
  usePermalink?: boolean; // Использовать ли постоянную ссылку на страницу фильма
}

export function ShareButtons({ movie, className, usePermalink = true }: ShareButtonsProps) {
  const [isCopied, setIsCopied] = useState(false);
  
  // Список социальных сетей
  const socialNetworks = [
    {
      name: 'Telegram',
      icon: '📱',
      shareUrl: (url: string, title: string) => 
        `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
    },
    {
      name: 'Facebook',
      icon: '👤',
      shareUrl: (url: string) => 
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    },
    {
      name: 'Twitter',
      icon: '🐦',
      shareUrl: (url: string, title: string) => 
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
    },
    {
      name: 'Viber',
      icon: '💬',
      shareUrl: (url: string) => 
        `viber://forward?text=${encodeURIComponent(url)}`
    },
    {
      name: 'WhatsApp',
      icon: '📲',
      shareUrl: (url: string) => 
        `https://api.whatsapp.com/send?text=${encodeURIComponent(url)}`
    }
  ];

    // Создаем URL для шаринга
    const getShareableUrl = () => {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        
        if (usePermalink) {
          // Используем постоянную ссылку на страницу фильма
          return `${baseUrl}/movie/${movie.id}`;
        } else {
          // Используем параметр запроса для текущей страницы
          return `${baseUrl}/?movie=${movie.id}`;
        }
      };
      
      // Копирование ссылки в буфер обмена
      const handleCopyLink = async () => {
        const url = getShareableUrl();
        try {
          await navigator.clipboard.writeText(url);
          setIsCopied(true);
          toast.success('Посилання скопійовано!');
          setTimeout(() => setIsCopied(false), 2000);
        } catch (error) {
          toast.error('Не вдалося скопіювати посилання');
        }
      };
      
      // Открытие окна для шаринга
      const handleShare = (network: typeof socialNetworks[0]) => {
        const url = getShareableUrl();
        const title = `${movie.title} - WatchPick`;
        window.open(network.shareUrl(url, title), '_blank', 'noopener,noreferrer');
      };
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className={className}>
              <Share2 className="mr-2 h-4 w-4" />
              Поділитися
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <div className="text-sm font-medium p-2">Поділитися фільмом</div>
            <DropdownMenuSeparator />
            
            {socialNetworks.map((network) => (
              <DropdownMenuItem 
                key={network.name}
                onClick={() => handleShare(network)}
              >
                <span className="mr-2">{network.icon}</span>
                {network.name}
              </DropdownMenuItem>
            ))}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCopyLink}>
              {isCopied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  <span>Скопійовано!</span>
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  <span>Копіювати посилання</span>
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }