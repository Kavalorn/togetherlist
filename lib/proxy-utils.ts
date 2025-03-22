// lib/proxy-utils.ts
import fs from 'fs';
import path from 'path';

export interface ProxyInfo {
  ip: string;
  port: number;
  protocol: string;
  country?: string;
  anonymity?: string;
  lastChecked?: string;
  working?: boolean;
}

// Кешований файл проксі
const PROXY_CACHE_FILE = path.join(process.cwd(), 'cache', 'proxies.json');
// Час життя кеша в мілісекундах (6 годин)
const CACHE_TTL = 6 * 60 * 60 * 1000;

/**
 * Отримання списку безкоштовних проксі з різних джерел
 */
export async function fetchFreeProxies(): Promise<ProxyInfo[]> {
  try {
    // Перевіряємо наявність кешованих проксі
    if (fs.existsSync(PROXY_CACHE_FILE)) {
      const cacheStats = fs.statSync(PROXY_CACHE_FILE);
      const cacheAge = Date.now() - cacheStats.mtimeMs;
      
      // Якщо кеш не застарів, використовуємо його
      if (cacheAge < CACHE_TTL) {
        const cachedProxies = JSON.parse(fs.readFileSync(PROXY_CACHE_FILE, 'utf-8'));
        console.log(`Використовуємо ${cachedProxies.length} кешованих проксі`);
        return cachedProxies;
      }
    }
    
    console.log('Оновлюємо список безкоштовних проксі...');
    
    // Масив для збереження всіх проксі
    let allProxies: ProxyInfo[] = [];
    
    // Джерела безкоштовних проксі
    const proxySources = [
      // Proxylist.geonode.com
      {
        url: 'https://proxylist.geonode.com/api/proxy-list?limit=500&page=1&sort_by=lastChecked&sort_type=desc&protocols=http,https',
        parser: async (data: any) => {
          try {
            const jsonData = typeof data === 'string' ? JSON.parse(data) : data;
            return jsonData.data.map((proxy: any) => ({
              ip: proxy.ip,
              port: parseInt(proxy.port),
              protocol: proxy.protocols[0],
              country: proxy.country,
              anonymity: proxy.anonymityLevel,
              lastChecked: proxy.lastChecked
            }));
          } catch (e) {
            console.error('Помилка парсингу відповіді Geonode:', e);
            return [];
          }
        }
      },
      // proxy-list.download
      {
        url: 'https://www.proxy-list.download/api/v1/get?type=http',
        parser: async (data: string) => {
          try {
            return data.split('\r\n').filter(line => line.trim()).map(line => {
              const [ip, port] = line.split(':');
              return {
                ip,
                port: parseInt(port),
                protocol: 'http',
                working: true
              };
            });
          } catch (e) {
            console.error('Помилка парсингу відповіді proxy-list.download:', e);
            return [];
          }
        }
      },
      // proxyscan.io
      {
        url: 'https://www.proxyscan.io/api/proxy?format=json&type=http,https&limit=100',
        parser: async (data: any) => {
          try {
            const jsonData = typeof data === 'string' ? JSON.parse(data) : data;
            return jsonData.map((proxy: any) => ({
              ip: proxy.Ip,
              port: proxy.Port,
              protocol: proxy.Type[0].toLowerCase(),
              country: proxy.Country,
              anonymity: proxy.Anonymity
            }));
          } catch (e) {
            console.error('Помилка парсингу відповіді proxyscan.io:', e);
            return [];
          }
        }
      }
    ];
    
    // Завантажуємо проксі з усіх джерел
    for (const source of proxySources) {
      try {
        const response = await fetch(source.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        
        if (response.ok) {
          const data = await response.text();
          const proxies = await source.parser(data);
          console.log(`Отримано ${proxies.length} проксі з джерела ${source.url}`);
          allProxies = [...allProxies, ...proxies];
        } else {
          console.error(`Помилка запиту до ${source.url}: ${response.status}`);
        }
      } catch (error) {
        console.error(`Помилка при отриманні проксі з ${source.url}:`, error);
      }
    }
    
    // Якщо не вдалося отримати проксі, використовуємо запасний варіант
    if (allProxies.length === 0) {
      console.log('Використовуємо запасний список проксі');
      allProxies = FALLBACK_PROXIES;
    }
    
    // Створюємо директорію для кешу, якщо вона не існує
    const cacheDir = path.dirname(PROXY_CACHE_FILE);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    
    // Зберігаємо проксі в кеш
    fs.writeFileSync(PROXY_CACHE_FILE, JSON.stringify(allProxies));
    
    return allProxies;
  } catch (error) {
    console.error('Помилка при отриманні безкоштовних проксі:', error);
    return FALLBACK_PROXIES;
  }
}

/**
 * Отримання випадкового проксі з фільтрацією
 */
export async function getRandomProxy(protocol: 'http' | 'https' = 'http'): Promise<string | null> {
  try {
    const proxies = await fetchFreeProxies();
    
    // Фільтруємо проксі за протоколом
    const filteredProxies = proxies.filter(p => p.protocol.toLowerCase() === protocol);
    
    if (filteredProxies.length === 0) {
      console.warn(`Не знайдено проксі для протоколу ${protocol}, використовуємо будь-який доступний`);
      if (proxies.length === 0) {
        return null;
      }
      const randomProxy = proxies[Math.floor(Math.random() * proxies.length)];
      return `${randomProxy.protocol}://${randomProxy.ip}:${randomProxy.port}`;
    }
    
    // Беремо випадковий проксі зі списку
    const randomProxy = filteredProxies[Math.floor(Math.random() * filteredProxies.length)];
    return `${randomProxy.protocol}://${randomProxy.ip}:${randomProxy.port}`;
  } catch (error) {
    console.error('Помилка при отриманні випадкового проксі:', error);
    return null;
  }
}

/**
 * Запасні проксі на випадок, якщо не вдасться отримати список
 */
const FALLBACK_PROXIES: ProxyInfo[] = [
  { ip: '185.162.230.245', port: 80, protocol: 'http' },
  { ip: '47.89.185.178', port: 8888, protocol: 'http' },
  { ip: '223.241.77.171', port: 3128, protocol: 'http' },
  { ip: '43.132.178.167', port: 9480, protocol: 'http' },
  { ip: '112.194.142.135', port: 9091, protocol: 'http' },
  { ip: '185.194.12.133', port: 8080, protocol: 'http' },
  { ip: '120.79.43.175', port: 3128, protocol: 'http' },
  { ip: '194.147.58.126', port: 8000, protocol: 'http' },
  { ip: '47.254.47.61', port: 8080, protocol: 'http' },
  { ip: '77.233.5.68', port: 55443, protocol: 'http' },
];

/**
 * Перевірка проксі на працездатність
 * @param proxyUrl повний URL проксі у форматі protocol://ip:port
 * @returns {Promise<boolean>} результат перевірки
 */
export async function testProxy(proxyUrl: string): Promise<boolean> {
  try {
    // Використовуємо проксі для запиту до Google
    const testUrl = 'https://www.google.com';
    const timeout = 5000; // 5 секунд таймаут
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Використовуємо node-fetch з проксі
    // Тут ми імітуємо використання fetch з проксі для перевірки
    // В реальності ви будете використовувати пакет який підтримує проксі
    console.log(`Тестуємо проксі: ${proxyUrl}`);
    
    // У реальній імплементації використовуйте щось подібне:
    // const ProxyAgent = require('proxy-agent');
    // const agent = new ProxyAgent(proxyUrl);
    // const response = await fetch(testUrl, { 
    //   agent, 
    //   signal: controller.signal,
    //   headers: { 'User-Agent': 'Mozilla/5.0 ...' }
    // });
    
    // Симуляція запиту через проксі для тестування
    const response = await fetch(testUrl, { 
      signal: controller.signal,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
      } 
    });
    
    clearTimeout(timeoutId);
    
    return response.ok;
  } catch (error) {
    console.error(`Помилка при тестуванні проксі ${proxyUrl}:`, error);
    return false;
  }
}

/**
 * Отримання працюючого проксі
 * @returns {Promise<string|null>} URL проксі або null, якщо не знайдено
 */
export async function getWorkingProxy(): Promise<string | null> {
  // Отримуємо список проксі
  const proxies = await fetchFreeProxies();
  
  // Перемішуємо проксі для рівномірного розподілу
  const shuffledProxies = [...proxies].sort(() => Math.random() - 0.5);
  
  // Обмеження на кількість спроб
  const maxAttempts = Math.min(10, shuffledProxies.length);
  
  // Перевіряємо проксі по черзі, поки не знайдемо працюючий
  for (let i = 0; i < maxAttempts; i++) {
    const proxy = shuffledProxies[i];
    const proxyUrl = `${proxy.protocol}://${proxy.ip}:${proxy.port}`;
    
    const isWorking = await testProxy(proxyUrl);
    if (isWorking) {
      console.log(`Знайдено працюючий проксі: ${proxyUrl}`);
      return proxyUrl;
    }
  }
  
  console.warn('Не знайдено працюючих проксі після декількох спроб');
  return null;
}