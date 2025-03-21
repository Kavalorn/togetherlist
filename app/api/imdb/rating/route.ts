// app/api/imdb/rating/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

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
    
    // Створюємо об'єкт результату
    const result = {
      imdbId: '',
      title: '',
      year: '',
      rating: 0,
      votes: 0,
      poster: ''
    };
    
    // Налаштовуємо fetch з користувацьким User-Agent
    const fetchOptions = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'uk,en-US;q=0.7,en;q=0.3',
        'Referer': 'https://www.imdb.com/',
      }
    };
    
    // Робимо запит на сторінку пошуку
    const searchResponse = await fetch(searchUrl, fetchOptions);
    if (!searchResponse.ok) {
      throw new Error(`Помилка пошуку фільму: ${searchResponse.status} ${searchResponse.statusText}`);
    }
    
    const searchHtml = await searchResponse.text();
    const $ = cheerio.load(searchHtml);
    
    // Шукаємо перший результат фільму
    const movieLink = $('a[href*="/title/tt"]').first();
    
    if (!movieLink.length) {
      return NextResponse.json(
        { error: 'Фільм не знайдено' },
        { status: 404 }
      );
    }
    
    // Отримуємо URL і заголовок фільму
    const href = movieLink.attr('href') || '';
    result.title = movieLink.text().trim();
    
    // Отримуємо ID фільму
    const imdbIdMatch = href.match(/\/title\/(tt\d+)\//);
    if (!imdbIdMatch) {
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
    
    const movieResponse = await fetch(movieUrl, fetchOptions);
    if (!movieResponse.ok) {
      throw new Error(`Помилка отримання сторінки фільму: ${movieResponse.status} ${movieResponse.statusText}`);
    }
    
    const movieHtml = await movieResponse.text();
    const $movie = cheerio.load(movieHtml);
    
    // Отримуємо рейтинг
    const ratingElement = $movie('[data-testid="hero-rating-bar__aggregate-rating__score"] span');
    if (ratingElement.length) {
      const ratingText = ratingElement.first().text().trim();
      result.rating = parseFloat(ratingText);
    }
    
    // third element after ratingElement
    const votesElement = $movie('[data-testid="hero-rating-bar__aggregate-rating__score"]').next().next();
    if (votesElement.length) {
      const votesText = votesElement.text().trim();
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
    const yearElement = $movie('[data-testid="title-details-releasedate"] a');
    if (yearElement.length) {
      const yearText = yearElement.text().trim();
      const yearMatch = yearText.match(/(\d{4})/);
      if (yearMatch) {
        result.year = yearMatch[1];
      }
    }
    
    // Якщо не знайшли рік через releasedate, шукаємо в іншому місці
    if (!result.year) {
      const titleYearElement = $movie('span.sc-69e49b85-0');
      if (titleYearElement.length) {
        const yearMatch = titleYearElement.text().match(/(\d{4})/);
        if (yearMatch) {
          result.year = yearMatch[1];
        }
      }
    }
    
    // Отримуємо постер
    const posterElement = $movie('[data-testid="hero-media__poster"] img');
    if (posterElement.length) {
      result.poster = posterElement.attr('src') || '';
    }
    
    // Перевіряємо результати
    if (result.rating === 0) {
      // Спробуємо знайти рейтинг інакше (структура IMDb могла змінитися)
      const altRatingElement = $movie('.sc-7ab21ed2-1 span');
      if (altRatingElement.length) {
        const altRatingText = altRatingElement.first().text().trim();
        const ratingMatch = altRatingText.match(/(\d+\.\d+)\/10/);
        if (ratingMatch) {
          result.rating = parseFloat(ratingMatch[1]);
        }
      }
      
      // Якщо все ще немає рейтингу, повертаємо помилку
      if (result.rating === 0) {
        return NextResponse.json(
          { error: 'Рейтинг не знайдено' },
          { status: 404 }
        );
      }
    }
    
    console.log(`Рейтинг IMDb: ${result.rating}/10 (${result.votes} голосів)`);
    
    // Повертаємо результат
    return NextResponse.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Помилка при скрепінгу IMDb:', error);
    
    return NextResponse.json(
      { error: 'Помилка при отриманні даних з IMDb' },
      { status: 500 }
    );
  }
}