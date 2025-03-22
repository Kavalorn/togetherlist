// app/api/proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRandomProxy, getWorkingProxy } from '@/lib/proxy-utils';

// Список сервісів, які потребують проксі
const SERVICES_NEEDING_PROXY = ['uakino', 'eneyida', 'lavakino'];

// Функція для перевірки, чи потрібно використовувати проксі для даного сервісу
function needsProxy(service: string): boolean {
  return SERVICES_NEEDING_PROXY.includes(service.toLowerCase());
}

export async function GET(request: NextRequest) {
  try {
    // Отримуємо параметри запиту
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');
    const service = searchParams.get('service');
    
    if (!url || !service) {
      return NextResponse.json(
        { error: 'Необхідно вказати url та service параметри' },
        { status: 400 }
      );
    }
    
    console.log(`Запит через проксі до: ${service}, URL: ${url}`);
    
    // Налаштування для запиту
    const fetchOptions: RequestInit = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'uk,en-US;q=0.7,en;q=0.3',
        'Referer': new URL(url).origin,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
    };

    let response;
    
    // Перевіряємо, чи потрібен проксі для цього сервісу
    if (needsProxy(service)) {
      try {
        // Спочатку спробуємо отримати завідомо працюючий проксі
        const workingProxy = await getWorkingProxy();
        
        if (workingProxy) {
          console.log(`Використовуємо перевірений проксі: ${workingProxy}`);
          
          // У реальному коді тут буде використовуватись HTTP клієнт з підтримкою проксі
          // Наприклад:
          // const https = require('https');
          // const { HttpsProxyAgent } = require('https-proxy-agent');
          // const agent = new HttpsProxyAgent(workingProxy);
          
          // response = await fetch(url, {
          //   ...fetchOptions,
          //   agent
          // });
          
          // Для демонстрації, спрощений варіант:
          const proxyAgent = { proxy: workingProxy };
          
          response = await fetch(url, {
            ...fetchOptions,
            // @ts-ignore - в реальному коді вам треба буде використовувати правильний тип агента
            agent: proxyAgent
          });
        } else {
          // Якщо не знайшли жодного працюючого проксі, спробуємо випадковий
          const randomProxy = await getRandomProxy('http');
          
          if (randomProxy) {
            console.log(`Використовуємо випадковий проксі: ${randomProxy}`);
            
            // Та сама логіка що і вище, але з випадковим проксі
            const proxyAgent = { proxy: randomProxy };
            
            response = await fetch(url, {
              ...fetchOptions,
              // @ts-ignore
              agent: proxyAgent
            });
          } else {
            throw new Error('Не вдалося отримати проксі');
          }
        }
      } catch (proxyError) {
        console.error('Помилка при використанні проксі:', proxyError);
        // Використовуємо запасний варіант - звичайний fetch без проксі
        console.log('Використовуємо звичайний fetch без проксі як запасний варіант');
        response = await fetch(url, fetchOptions);
      }
    } else {
      // Для сервісів, які не потребують проксі
      response = await fetch(url, fetchOptions);
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Помилка проксі-запиту:', error);
    
    return NextResponse.json(
      { error: 'Помилка при виконанні проксі-запиту', message: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST для відправки форм
export async function POST(request: NextRequest) {
  try {
    // Отримуємо параметри запиту
    const { url, service, formData } = await request.json();
    
    if (!url || !service || !formData) {
      return NextResponse.json(
        { error: 'Необхідно вказати url, service та formData параметри' },
        { status: 400 }
      );
    }
    
    console.log(`POST-запит через проксі до: ${service}, URL: ${url}`);
    
    // Налаштування для запиту
    const fetchOptions: RequestInit = {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'uk,en-US;q=0.7,en;q=0.3',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': new URL(url).origin,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      body: new URLSearchParams(formData).toString(),
    };

    let response;
    
    // Перевіряємо, чи потрібен проксі для цього сервісу
    if (needsProxy(service)) {
      try {
        // Спочатку спробуємо отримати завідомо працюючий проксі
        const workingProxy = await getWorkingProxy();
        
        if (workingProxy) {
          console.log(`Використовуємо перевірений проксі: ${workingProxy}`);
          
          // У реальному коді тут буде використовуватись HTTP клієнт з підтримкою проксі
          // для POST запиту
          const proxyAgent = { proxy: workingProxy };
          
          response = await fetch(url, {
            ...fetchOptions,
            // @ts-ignore - в реальному коді вам треба буде використовувати правильний тип агента
            agent: proxyAgent
          });
        } else {
          // Якщо не знайшли жодного працюючого проксі, спробуємо випадковий
          const randomProxy = await getRandomProxy('http');
          
          if (randomProxy) {
            console.log(`Використовуємо випадковий проксі: ${randomProxy}`);
            
            // Та сама логіка що і вище, але з випадковим проксі
            const proxyAgent = { proxy: randomProxy };
            
            response = await fetch(url, {
              ...fetchOptions,
              // @ts-ignore
              agent: proxyAgent
            });
          } else {
            throw new Error('Не вдалося отримати проксі');
          }
        }
      } catch (proxyError) {
        console.error('Помилка при використанні проксі:', proxyError);
        // Використовуємо запасний варіант - звичайний fetch без проксі
        console.log('Використовуємо звичайний fetch без проксі як запасний варіант');
        response = await fetch(url, fetchOptions);
      }
    } else {
      // Для сервісів, які не потребують проксі
      response = await fetch(url, fetchOptions);
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Помилка проксі-запиту:', error);
    
    return NextResponse.json(
      { error: 'Помилка при виконанні проксі-запиту', message: (error as Error).message },
      { status: 500 }
    );
  }
}