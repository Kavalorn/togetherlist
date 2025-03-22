'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Loader2, ExternalLink, MousePointerClick, SearchX, Check
} from 'lucide-react';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';

// Сервіси, які підтримуються
const SERVICES = [
  { id: 'uakino', name: 'UAKino', color: '#3BA0FF', icon: '🎬' },
  { id: 'eneyida', name: 'Eneyida', color: '#FF9147', icon: '🎭' },
  { id: 'uaserials', name: 'UASerials', color: '#61CDFF', icon: '📺' },
  { id: 'uafix', name: 'UAFix.net', color: '#FF6347', icon: '🎞️' },
  { id: 'lavakino', name: 'lavakino.cc', color: '#86655f', icon: '🎥' },
  { id: 'kinogo', name: 'kinogo', color: '#db0000', icon: ':)' },
  // { id: 'uakinoBay', name: 'uakino-bay.net', color: '#88960d', icon: '🎬' }
];

interface UAServiceFinderProps {
  movieTitle: string;
  movieYear?: string;
  className?: string;
}

interface ServiceResult {
  found: boolean;
  url?: string;
  title?: string;
  error?: string;
}

type SearchResults = {
  [service: string]: ServiceResult | null;
};

export function UAServiceFinder({ movieTitle, movieYear, className }: UAServiceFinderProps) {
  const [results, setResults] = useState<SearchResults>({});
  const [loadingServices, setLoadingServices] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  
  // Функція для пошуку на одному сервісі
  const searchService = async (serviceId: string) => {
    if (loadingServices.has(serviceId)) return;
    
    setLoadingServices((prev) => new Set([...prev, serviceId]));
    setError(null);
    
    try {
      // Будуємо URL з параметрами
      const params = new URLSearchParams();
      params.append('title', movieTitle);
      params.append('service', serviceId);
      if (movieYear) {
        params.append('year', movieYear);
      }
      
      // Виконуємо запит до API
      const response = await fetch(`/api/ua-services/search?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Не вдалося виконати пошук на ${getServiceName(serviceId)}`);
      }
      
      const data = await response.json();
      
      // Оновлюємо стан з результатами
      setResults(prev => ({
        ...prev,
        [serviceId]: data.results[serviceId]
      }));
      
      // Показуємо повідомлення про результат
      const serviceName = getServiceName(serviceId);
      if (data.results[serviceId].found) {
        toast.success(`Знайдено на ${serviceName}!`);
      } else {
        toast.info(`Не знайдено на ${serviceName}`);
      }
      
    } catch (err) {
      console.error(`Помилка при пошуку на ${serviceId}:`, err);
      setError(err instanceof Error ? err.message : 'Не вдалося виконати пошук');
      toast.error(`Помилка пошуку на ${getServiceName(serviceId)}`);
      
      // Також оновлюємо стан результатів з помилкою
      setResults(prev => ({
        ...prev,
        [serviceId]: { 
          found: false, 
          error: err instanceof Error ? err.message : 'Не вдалося виконати пошук'
        }
      }));
    } finally {
      setLoadingServices((prev) => {
        const newSet = new Set(prev);
        newSet.delete(serviceId);
        return newSet;
      });
    }
  };
  
  // Функція для пошуку на всіх сервісах
  const searchAllServices = async () => {
    // Перевіряємо, чи всі сервіси вже завантажуються
    const allServicesLoading = SERVICES.every(service => loadingServices.has(service.id));
    if (allServicesLoading) return;
    
    // Позначаємо всі сервіси як такі, що завантажуються
    setLoadingServices(new Set(SERVICES.map(service => service.id)));
    setError(null);
    
    try {
      // Будуємо URL з параметрами
      const params = new URLSearchParams();
      params.append('title', movieTitle);
      if (movieYear) {
        params.append('year', movieYear);
      }
      
      // Виконуємо запит до API для всіх сервісів
      const response = await fetch(`/api/ua-services/search?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не вдалося виконати пошук на українських сервісах');
      }
      
      const data = await response.json();
      
      // Оновлюємо стан з результатами
      setResults(data.results);
      
      // Показуємо повідомлення про результат
      const foundServices = Object.entries(data.results)
        .filter(([_, result]) => result.found)
        .map(([serviceId, _]) => getServiceName(serviceId));
      
      if (foundServices.length > 0) {
        toast.success(`Знайдено на ${foundServices.join(', ')}!`);
      } else {
        toast.info('Не знайдено на жодному сервісі');
      }
      
    } catch (err) {
      console.error('Помилка при пошуку на всіх сервісах:', err);
      setError(err instanceof Error ? err.message : 'Не вдалося виконати пошук');
      toast.error('Помилка пошуку на українських сервісах');
    } finally {
      setLoadingServices(new Set());
    }
  };
  
  // Допоміжна функція для отримання назви сервісу за його ID
  const getServiceName = (serviceId: string): string => {
    const service = SERVICES.find(s => s.id === serviceId);
    return service ? service.name : serviceId;
  };
  
  // Функція для отримання поточного статусу результату
  const getResultStatus = (serviceId: string) => {
    if (loadingServices.has(serviceId)) {
      return 'loading';
    }
    
    const result = results[serviceId];
    if (!result) {
      return 'pending';
    }
    
    if (result.error) {
      return 'error';
    }
    
    return result.found ? 'found' : 'not-found';
  };
  
  // Чи завантажуються всі сервіси одночасно
  const isLoadingAll = SERVICES.every(service => loadingServices.has(service.id));
  
  // Чи був уже виконаний пошук хоча б на одному сервісі
  const hasAnyResults = Object.keys(results).length > 0;
  
  return (
    <div className={`space-y-4 ${className || ''}`}>
      <div className="flex flex-col md:flex-row gap-2">
        {/* Кнопки для окремих сервісів */}
        <div className="flex flex-wrap gap-2">
          {SERVICES.map(service => {
            const status = getResultStatus(service.id);
            const result = results[service.id];
            
            // Визначаємо вигляд кнопки в залежності від статусу
            let buttonVariant: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive' = 'outline';
            let buttonContent: React.ReactNode;
            
            if (status === 'loading') {
              buttonContent = (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {service.icon} {service.name}
                </>
              );
            } else if (status === 'found') {
              buttonVariant = 'default';
              buttonContent = (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {service.icon} {service.name}
                </>
              );
            } else if (status === 'not-found') {
              buttonVariant = 'secondary';
              buttonContent = (
                <>
                  <SearchX className="mr-2 h-4 w-4" />
                  {service.icon} {service.name}
                </>
              );
            } else if (status === 'error') {
              buttonVariant = 'destructive';
              buttonContent = (
                <>
                  <SearchX className="mr-2 h-4 w-4" />
                  {service.icon} {service.name}
                </>
              );
            } else {
              buttonContent = (
                <>
                  <MousePointerClick className="mr-2 h-4 w-4" />
                  {service.icon} {service.name}
                </>
              );
            }
            
            // Якщо фільм знайдено, зробимо кнопку посиланням
            if (status === 'found' && result?.url) {
              return (
                <TooltipProvider key={service.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 
                        bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2`}
                        style={{ backgroundColor: service.color }}
                      >
                        {buttonContent}
                        <ExternalLink className="ml-2 h-3.5 w-3.5" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Дивитися на {service.name}</p>
                      {result.title && <p className="text-xs opacity-80">Знайдено: {result.title}</p>}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            }
            
            return (
              <TooltipProvider key={service.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={buttonVariant}
                      onClick={() => searchService(service.id)}
                      disabled={loadingServices.has(service.id)}
                      style={status === 'found' ? { backgroundColor: service.color, borderColor: service.color } : {}}
                    >
                      {buttonContent}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {status === 'pending' && <p>Пошук на {service.name}</p>}
                    {status === 'loading' && <p>Завантаження...</p>}
                    {status === 'not-found' && <p>Не знайдено на {service.name}</p>}
                    {status === 'error' && <p>Помилка: {result?.error}</p>}
                    {status === 'found' && <p>Знайдено на {service.name}: {result?.title}</p>}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
        
        {/* Кнопка для пошуку на всіх сервісах */}
        <Button
          variant="default"
          onClick={searchAllServices}
          disabled={isLoadingAll}
          className="mt-2 md:mt-0"
        >
          {isLoadingAll ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Пошук на всіх сервісах...
            </>
          ) : (
            <>
              <MousePointerClick className="mr-2 h-4 w-4" />
              Перевірити всі сервіси
            </>
          )}
        </Button>
      </div>
      
      {/* Відображення знайдених результатів у вигляді списку */}
      {hasAnyResults && (
        <div className="mt-3">
          <div className="text-sm font-medium mb-2">Результати пошуку:</div>
          <div className="space-y-2">
            {SERVICES.map(service => {
              const status = getResultStatus(service.id);
              const result = results[service.id];
              
              if (!result && status !== 'loading') {
                return null;
              }
              
              return (
                <div
                  key={service.id}
                  className={`p-2 rounded-md text-sm flex items-center ${
                    status === 'found'
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900'
                      : status === 'error'
                      ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900'
                      : status === 'not-found'
                      ? 'bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800'
                      : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900'
                  }`}
                >
                  <div className="w-6 h-6 flex-shrink-0 mr-3 flex items-center justify-center">
                    {status === 'loading' ? (
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    ) : status === 'found' ? (
                                            <Check className="h-5 w-5 text-green-500" />
                    ) : status === 'error' ? (
                      <SearchX className="h-5 w-5 text-red-500" />
                    ) : (
                      <SearchX className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="font-medium">{service.name}:</span>
                      {status === 'loading' ? (
                        <span className="ml-2 text-blue-600 dark:text-blue-400">Пошук...</span>
                      ) : status === 'found' ? (
                        <span className="ml-2 text-green-600 dark:text-green-400">Знайдено</span>
                      ) : status === 'error' ? (
                        <span className="ml-2 text-red-600 dark:text-red-400">Помилка</span>
                      ) : (
                        <span className="ml-2 text-gray-600 dark:text-gray-400">Не знайдено</span>
                      )}
                    </div>
                    
                    {status === 'found' && result?.title && (
                      <div className="text-xs mt-1">Знайдено: {result.title}</div>
                    )}
                    
                    {status === 'error' && result?.error && (
                      <div className="text-xs mt-1 text-red-500">{result.error}</div>
                    )}
                    
                    {status === 'found' && result?.url && (
                      <div className="mt-1">
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Перейти до фільму
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}