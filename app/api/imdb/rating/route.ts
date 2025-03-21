// app/api/imdb/rating/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';

export async function GET(request: NextRequest) {
  try {
    // Отримуємо параметри запиту
    const searchParams = request.nextUrl.searchParams;
    const title = searchParams.get('title');
    const year = searchParams.get('year');
    
    if (!title) {
      return NextResponse.json(
        { error: 'Назва фільму обов\'язкова' },
        { status: 400 }
      );
    }
    
    // Логуємо запит
    console.log(`Отримуємо рейтинг IMDb для: ${title} (${year || 'рік не вказано'})`);
    
    // Формуємо пошуковий запит для IMDb
    const formattedTitle = encodeURIComponent(title.trim());
    let searchUrl = `https://www.imdb.com/find/?q=${formattedTitle}`;
    if (year) {
      searchUrl += `+${year}`;
    }

    console.log(`Пошуковий URL: ${searchUrl}`);
    
    // Запускаємо браузер
    const browser = await chromium.launch({
      headless: false  // Без відображення UI
    });
    
    try {
      // Створюємо об'єкт результату
      const result = {
        imdbId: '',
        title: '',
        year: '',
        rating: 0,
        votes: 0,
        poster: ''
      };
      
      // Створюємо нову сторінку
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });
      const page = await context.newPage();
      
      // Переходимо на сторінку пошуку
      console.log(`Відкриваємо сторінку пошуку: ${searchUrl}`);
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
      
      // Чекаємо, щоб завантажилися результати пошуку
      await page.waitForLoadState('networkidle');
      
      // Шукаємо перший результат фільму
      const movieLink = await page.$('a[href*="/title/tt"]');
      
      if (!movieLink) {
        await browser.close();
        return NextResponse.json(
          { error: 'Фільм не знайдено' },
          { status: 404 }
        );
      }
      
      // Отримуємо URL і заголовок фільму
      const href = await movieLink.getAttribute('href') || '';
      result.title = (await movieLink.textContent() || '').trim();
      
      // Отримуємо ID фільму
      const imdbIdMatch = href.match(/\/title\/(tt\d+)\//);
      if (!imdbIdMatch) {
        await browser.close();
        return NextResponse.json(
          { error: 'Не вдалося отримати ID фільму' },
          { status: 404 }
        );
      }
      
      result.imdbId = imdbIdMatch[1];
      console.log(`Знайдено фільм: ${result.title} (IMDb ID: ${result.imdbId})`);
      
      // Переходимо на сторінку фільму
      const movieUrl = `https://www.imdb.com${href}`;
      console.log(`Відкриваємо сторінку фільму: ${movieUrl}`);
      await page.goto(movieUrl, { waitUntil: 'domcontentloaded' });
      
      // Чекаємо, щоб завантажилася сторінка фільму
      await page.waitForLoadState('networkidle');
      
      // Отримуємо рейтинг
      const ratingElement = await page.$('[data-testid="hero-rating-bar__aggregate-rating__score"]');
      if (ratingElement) {
        const ratingText = await ratingElement.textContent() || '';
        result.rating = parseFloat(ratingText.trim());
      }
      
      // Отримуємо кількість голосів
      const votesElement = await page.$('[data-testid="hero-rating-bar__aggregate-rating__vote-count"]');
      if (votesElement) {
        const votesText = await votesElement.textContent() || '';
        // Видаляємо "K" або "M" та конвертуємо у число
        const votesClean = votesText.replace(/[^\d.]/g, '');
        
        if (votesText.includes('K')) {
          result.votes = Math.round(parseFloat(votesClean) * 1000);
        } else if (votesText.includes('M')) {
          result.votes = Math.round(parseFloat(votesClean) * 1000000);
        } else {
          result.votes = parseInt(votesClean, 10) || 0;
        }
      }
      
      // Отримуємо рік випуску
      const yearElement = await page.$('[data-testid="title-details-releasedate"] a');
      if (yearElement) {
        const yearText = await yearElement.textContent() || '';
        const yearMatch = yearText.match(/(\d{4})/);
        if (yearMatch) {
          result.year = yearMatch[1];
        }
      }
      
      // Отримуємо постер
      const posterElement = await page.$('[data-testid="hero-media__poster"] img');
      if (posterElement) {
        result.poster = await posterElement.getAttribute('src') || '';
      }
      
      // Закриваємо браузер
      await browser.close();
      
      // Перевіряємо результати
      if (result.rating === 0) {
        return NextResponse.json(
          { error: 'Рейтинг не знайдено' },
          { status: 404 }
        );
      }
      
      console.log(`Рейтинг IMDb: ${result.rating}/10 (${result.votes} голосів)`);
      
      // Повертаємо результат
      return NextResponse.json({
        success: true,
        data: result
      });
      
    } catch (innerError) {
      // Закриваємо браузер у випадку помилки всередині обробки
      await browser.close();
      throw innerError;
    }
    
  } catch (error) {
    console.error('Помилка при скрепінгу IMDb:', error);
    
    return NextResponse.json(
      { error: 'Помилка при отриманні даних з IMDb' },
      { status: 500 }
    );
  }
}