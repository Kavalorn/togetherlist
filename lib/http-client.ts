// lib/http-client.ts
import 'server-only';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { getWorkingProxy, getRandomProxy, testProxy } from './proxy-utils';

interface FetchWithProxyOptions extends RequestInit {
  useProxy?: boolean;
  proxyType?: 'http' | 'https' | 'socks5';
  timeout?: number;
  retries?: number;
}

/**
 * Функція для виконання HTTP запитів через проксі
 */
export async function fetchWithProxy(
  url: string, 
  options: FetchWithProxyOptions = {}
): Promise<Response> {
  const { 
    useProxy = true, 
    proxyType = 'http',
    timeout = 10000, 
    retries = 2,
    ...fetchOptions 
  } = options;
  
  // Якщо проксі не потрібно використовувати
  if (!useProxy) {
    return fetch(url, fetchOptions);
  }
  
  // Встановлюємо таймаут
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort('Timeout'), timeout);
  
  let lastError: Error | null = null;
  
  // Спробуємо кілька разів, якщо потрібно
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // При першій спробі використовуємо перевірений проксі, при наступних - випадковий
      const proxyUrl = attempt === 0 
        ? await getWorkingProxy() 
        : await getRandomProxy(proxyType as 'http' | 'https');
      
      // Якщо не вдалося отримати проксі, пробуємо звичайний запит
      if (!proxyUrl) {
        console.log(`Проксі не знайдено, спроба ${attempt + 1}/${retries + 1}: звичайний запит`);
        return fetch(url, {
          ...fetchOptions,
          signal: controller.signal
        });
      }
      
      console.log(`Запит через проксі ${proxyUrl}, спроба ${attempt + 1}/${retries + 1}`);
      
      // Створюємо відповідний агент залежно від типу проксі
      let agent;
      if (proxyUrl.startsWith('socks')) {
        agent = new SocksProxyAgent(proxyUrl);
      } else {
        agent = new HttpsProxyAgent(proxyUrl);
      }
      
      // Виконуємо запит
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        // @ts-ignore - тип не відповідає, але це працює
        agent
      });
      
      // Якщо отримали помилку 403 (Forbidden) або 429 (Too Many Requests), спробуємо інший проксі
      if (response.status === 403 || response.status === 429) {
        throw new Error(`HTTP помилка ${response.status}`);
      }
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Помилка проксі-запиту (спроба ${attempt + 1}/${retries + 1}):`, error);
      
      // Якщо це остання спроба, вийдемо з циклу і повернемо помилку
      if (attempt === retries) {
        break;
      }
    }
  }
  
  clearTimeout(timeoutId);
  
  // Якщо всі спроби невдалі, робимо останню спробу без проксі
  console.log('Всі спроби через проксі невдалі, остання спроба без проксі');
  try {
    return await fetch(url, fetchOptions);
  } catch (error) {
    // Якщо і без проксі не вдалося, повертаємо останню помилку
    throw lastError || new Error('Помилка запиту');
  }
}

/**
 * Функція для виконання POST запитів через проксі
 */
export async function postWithProxy(
  url: string,
  data: any,
  options: FetchWithProxyOptions = {}
): Promise<Response> {
  const { headers, ...rest } = options;
  
  // Визначаємо, чи дані вже є URLSearchParams або FormData
  let contentType = 'application/json';
  let body: any = data;
  
  if (data instanceof URLSearchParams) {
    contentType = 'application/x-www-form-urlencoded';
  } else if (data instanceof FormData) {
    // Для FormData не встановлюємо Content-Type, браузер сам додасть boundary
    contentType = '';
  } else if (typeof data === 'object') {
    body = JSON.stringify(data);
  }
  
  return fetchWithProxy(url, {
    method: 'POST',
    headers: {
      ...(contentType && { 'Content-Type': contentType }),
      ...headers
    },
    body,
    ...rest
  });
}

/**
 * Функція для перевірки доступності URL через проксі
 */
export async function isUrlAccessible(url: string, useProxy = true): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetchWithProxy(url, {
      method: 'HEAD',
      useProxy,
      signal: controller.signal,
      timeout: 5000,
      retries: 1
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}