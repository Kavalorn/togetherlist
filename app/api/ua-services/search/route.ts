// app/api/ua-services/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { fetchWithProxy, postWithProxy } from '@/lib/http-client';

// Інтерфейси для типізації
interface ServiceResult {
  found: boolean;
  url?: string;
  title?: string;
  error?: string;
}

interface SearchResponse {
  query: string;
  results: {
    [service: string]: ServiceResult;
  };
}

// Сервіси, які потребують проксі
const SERVICES_NEEDING_PROXY = ['uakino', 'eneyida', 'lavakino'];

export async function GET(request: NextRequest) {
  try {
    // Отримуємо параметри запиту
    const searchParams = request.nextUrl.searchParams;
    const title = searchParams.get('title');
    const year = searchParams.get('year');
    const service = searchParams.get('service'); // Опціональний параметр для пошуку в конкретному сервісі
    
    if (!title) {
      return NextResponse.json(
        { error: 'Назва фільму обов\'язкова' },
        { status: 400 }
      );
    }
    
    // Логуємо запит
    console.log(`Пошук фільму на українських сервісах: ${title} (${year || 'рік не вказано'})`);
    
    // Формуємо чисту назву для пошуку
    const formattedTitle = title.trim();
    const services = service ? [service] : ['uakino', 'eneyida', 'uaserials', 'uafix', 'lavakino', 'kinogo'];
    
    // Ініціалізуємо результат пошуку
    const response: SearchResponse = {
      query: formattedTitle,
      results: {}
    };
    
    // Виконуємо пошук для кожного сервісу асинхронно
    const searchPromises = services.map(async (serviceName) => {
      try {
        // Вибираємо відповідну функцію пошуку
        const searchResult = await searchServices[serviceName](formattedTitle, year);
        response.results[serviceName] = searchResult;
      } catch (error) {
        console.error(`Помилка пошуку на ${serviceName}:`, error);
        response.results[serviceName] = {
          found: false,
          error: `Помилка пошуку: ${error instanceof Error ? error.message : 'Невідома помилка'}`
        };
      }
    });
    
    // Чекаємо завершення всіх пошуків
    await Promise.all(searchPromises);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Помилка при пошуку фільму:', error);
    return NextResponse.json(
      { error: 'Помилка при пошуку фільму на українських сервісах' },
      { status: 500 }
    );
  }
}

// Налаштування для запитів
const fetchOptions = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'uk,en-US;q=0.7,en;q=0.3',
  },
};

// Функції пошуку для кожного сервісу
const searchServices: { [key: string]: (title: string, year?: string | null) => Promise<ServiceResult> } = {
  // Пошук на UAKino
  async uakino(title: string, year?: string | null): Promise<ServiceResult> {
    const params = new URLSearchParams({
      do: 'search',
      subaction: 'search',
      from_page: '0',
      story: title.toLowerCase()
    });
    
    const searchUrl = 'https://uakino.me/index.php?do=search';
    
    console.log(`Пошук на UAKino: ${searchUrl} з параметрами: ${params.toString()}`);
    
    try {
      // Використовуємо проксі для POST-запиту
      const useProxy = SERVICES_NEEDING_PROXY.includes('uakino');
      
      const response = await postWithProxy(searchUrl, params, {
        useProxy,
        headers: {
          ...fetchOptions.headers,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': 'https://uakino.me/'
        },
        timeout: 15000, // 15 секунд таймаут
        retries: 2      // 2 повторні спроби
      });
      
      if (!response.ok) {
        throw new Error(`Помилка запиту до UAKino: ${response.status}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Шукаємо результати пошуку
      const searchResults = $('.movie-item');
      
      if (searchResults.length === 0) {
        return { found: false };
      }
      
      // Перевіряємо кожен результат
      for (let i = 0; i < searchResults.length; i++) {
        const result = searchResults.eq(i);
        const resultTitle = result.find('.movie-title').text().trim();
        const resultYear = result.find('.movie-title').text().match(/\((\d{4})\)/)?.[1];
        const url = result.find('a').attr('href');
        
        // Перевіряємо відповідність назви (та року, якщо вказано)
        const titleMatches = resultTitle.toLowerCase().includes(title.toLowerCase());
        const yearMatches = !year || !resultYear || resultYear === year;
        
        if (titleMatches && yearMatches && url) {
          return {
            found: true,
            url,
            title: resultTitle
          };
        }
      }
      
      return { found: false };
    } catch (error) {
      console.error('Помилка при пошуку на UAKino:', error);
      return { 
        found: false, 
        error: error instanceof Error ? error.message : 'Невідома помилка при пошуку на UAKino' 
      };
    }
  },

  // Пошук на Eneyida
  async eneyida(title: string, year?: string | null): Promise<ServiceResult> {
    const encodedTitle = encodeURIComponent(title.toLowerCase());
    const searchUrl = `https://eneyida.tv/index.php?do=search&subaction=search&search_start=0&full_search=0&story=${encodedTitle}`;
    
    console.log(`Пошук на Eneyida: ${searchUrl}`);

    try {
      // Використовуємо проксі для GET-запиту
      const useProxy = SERVICES_NEEDING_PROXY.includes('eneyida');
      
      const response = await fetchWithProxy(searchUrl, {
        useProxy,
        headers: {
          ...fetchOptions.headers,
          'Referer': 'https://eneyida.tv/'
        },
        timeout: 15000,
        retries: 2
      });
        
      if (!response.ok) {
          throw new Error(`Помилка запиту до Eneyida: ${response.status}`);
      }
        
      const html = await response.text();
      const $ = cheerio.load(html);
        
      // Шукаємо всі результати пошуку
      const searchResults = $('#dle-content .related_item').map((i, el) => {
          const url = $(el).find('a').attr('href');
          const itemTitle = $(el).find('.short_title').text().trim();
          const itemYear = itemTitle.match(/\((\d{4})\)/)?.[1];
          
          // Рахуємо "вагу" співпадіння
          let matchScore = 0;
          
          // Видаляємо рік з заголовка для порівняння
          const cleanItemTitle = itemTitle.replace(/\(\d{4}\)/, '').trim().toLowerCase();
          const cleanSearchTitle = title.toLowerCase();
          
          // Перевіряємо на точне співпадіння
          if (cleanItemTitle === cleanSearchTitle) {
              matchScore += 100;
          } else if (cleanItemTitle.includes(cleanSearchTitle)) {
              matchScore += 75;
          } else if (cleanSearchTitle.includes(cleanItemTitle)) {
              matchScore += 50;
          }
          
          // Додаткові бали за співпадіння року
          if (year && itemYear && year === itemYear) {
              matchScore += 25;
          }
          
          return { 
              url, 
              title: itemTitle,
              matchScore 
          };
      }).get();
        
      // Сортуємо результати за оцінкою співпадіння
      searchResults.sort((a, b) => b.matchScore - a.matchScore);
        
      // Беремо результат з найвищим співпадінням
      const bestMatch = searchResults[0];
        
      if (bestMatch && bestMatch.url && bestMatch.matchScore > 0) {
          return {
              found: true,
              url: bestMatch.url,
              title: bestMatch.title
          };
      } else {
          return { found: false };
      }
    } catch (error) {
      console.error('Помилка при пошуку на Eneyida:', error);
      return { 
        found: false, 
        error: error instanceof Error ? error.message : 'Невідома помилка при пошуку на Eneyida' 
      };
    }
  },
  
  // Пошук на LavaKino
  async lavakino(title: string, year?: string | null): Promise<ServiceResult> {
    const params = new URLSearchParams({
      do: 'search',
      subaction: 'search',
      story: title.toLowerCase()
    });
    
    const searchUrl = 'https://lavakino.cc/';
    
    console.log(`Пошук на LavaKino: ${searchUrl} з параметрами: ${params.toString()}`);
    
    try {
      // Використовуємо проксі для POST-запиту
      const useProxy = SERVICES_NEEDING_PROXY.includes('lavakino');
      
      const response = await postWithProxy(searchUrl, params, {
        useProxy,
        headers: {
          ...fetchOptions.headers,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': 'https://lavakino.cc/'
        },
        timeout: 15000,
        retries: 2
      });
      
      if (!response.ok) {
        throw new Error(`Помилка запиту до LavaKino: ${response.status}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Шукаємо результати пошуку
      const searchResults = $('#dle-content .short').map((i, el) => {
        const url = $(el).find('.short-title').attr('href');
        const title = $(el).find('.short-title').text();
        return { url, title };
      }).get()[0] || {
        url: null,
        title: null
      };
      
      if (searchResults && (searchResults.url || searchResults.title)) {
        return {
          found: true,
          url: searchResults.url,
          title: searchResults.title
        };
      } else {
        return { found: false };
      }
    } catch (error) {
      console.error('Помилка при пошуку на LavaKino:', error);
      return { 
        found: false, 
        error: error instanceof Error ? error.message : 'Невідома помилка при пошуку на LavaKino' 
      };
    }
  },
  
  // Інші сервіси, які не потребують проксі
  async uaserials(title: string, year?: string | null): Promise<ServiceResult> {
    const encodedTitle = encodeURIComponent(title.toLowerCase());
    const searchUrl = `https://uaserials.pro/index.php?do=search&subaction=search&search_start=0&full_search=0&story=${encodedTitle}`;
    
    console.log(`Пошук на UASerials: ${searchUrl}`);

    try {
      const response = await fetchWithProxy(searchUrl, {
        useProxy: false, // Без проксі
        headers: fetchOptions.headers
      });
      
      if (!response.ok) {
        throw new Error(`Помилка запиту до UASerials: ${response.status}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Шукаємо результати пошуку
      const searchResults = $('#dle-content .short-item').map((i, el) => {
        const url = $(el).find('a').attr('href');
        const title = $(el).find('.th-title').text();
        return { url, title };
      }).get()[0] || {
        url: null,
        title: null
      };
      
      if (searchResults && (searchResults.url || searchResults.title)) {
        return {
          found: true,
          url: searchResults.url,
          title: searchResults.title
        };
      } else {
        return { found: false };
      }
    } catch (error) {
      console.error('Помилка при пошуку на UASerials:', error);
      return { 
        found: false, 
        error: error instanceof Error ? error.message : 'Невідома помилка при пошуку на UASerials' 
      };
    }
  },
  
  // Пошук на UAFix.net
  async uafix(title: string, year?: string | null): Promise<ServiceResult> {
    try {
      // Правильне кодування назви для пошуку
      const encodedTitle = encodeURIComponent(title.toLowerCase());
      // Правильний URL для пошуку на uafix.net
      const searchUrl = `https://uafix.net/index.php?do=search&subaction=search&story=${encodedTitle}`;
      
      console.log(`Пошук на UAFix: ${searchUrl}`);
      
      const response = await fetchWithProxy(searchUrl, {
        useProxy: false, // Без проксі
        headers: {
          ...fetchOptions.headers,
          'Referer': 'https://uafix.net/'
        },
        timeout: 12000
      });
      
      if (!response.ok) {
        throw new Error(`Помилка запиту до UAFix: ${response.status}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);

      // Беремо перший результат пошуку
      const searchResults = $('#dle-content > a').map((i, el) => {
        const url = $(el).attr('href');
        const title = $(el).find('.sres-text h2').text();
        return { url, title };
      }).get()[0] || {
        url: null,
        title: null
      };
        
      if (searchResults.url || searchResults.title) {
        return {
          found: true,
          url: searchResults.url,
          title: searchResults.title,
        };
      } else {
        return { found: false };
      }
    } catch (error) {
      console.error('Помилка при пошуку на UAFix:', error);
      return { 
        found: false, 
        error: error instanceof Error ? error.message : 'Невідома помилка при пошуку на UAFix' 
      };
    }
  },

  // Пошук на Kinogo
  async kinogo(title: string, year?: string | null): Promise<ServiceResult> {
    try {
      // Правильне кодування назви для пошуку
      const encodedTitle = encodeURIComponent(title.toLowerCase());
      // Правильний URL для пошуку на kinogo
      const searchUrl = `https://ua.kinogo.online/search/${encodedTitle}`;
      
      console.log(`Пошук на Kinogo: ${searchUrl}`);
      
      const response = await fetchWithProxy(searchUrl, {
        useProxy: false, // Без проксі
        headers: {
          ...fetchOptions.headers,
          'Referer': 'https://ua.kinogo.online'
        },
        timeout: 12000
      });
      
      if (!response.ok) {
        throw new Error(`Помилка запиту до Kinogo: ${response.status}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);

      // Беремо перший результат пошуку
      const searchResults = $('#dle-content > .shortStory').map((i, el) => {
        const url = $(el).find('a').attr('href');
        const title = $(el).find('a').text();
        return { url, title };
      }).get()[0] || {
        url: null,
        title: null
      };
        
      if (searchResults.url || searchResults.title) {
        return {
          found: true,
          url: searchResults.url,
          title: searchResults.title,
        };
      } else {
        return { found: false };
      }
    } catch (error) {
      console.error('Помилка при пошуку на Kinogo:', error);
      return { 
        found: false, 
        error: error instanceof Error ? error.message : 'Невідома помилка при пошуку на Kinogo' 
      };
    }
  }
};