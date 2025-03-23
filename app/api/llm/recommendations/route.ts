// app/api/llm/recommendations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { tmdbApi } from '@/lib/tmdb';

// Типи для рекомендацій фільмів
interface MovieRecommendation {
  title: string;
  year?: string;
  tmdbMovie?: any;
  notFound?: boolean;
}

// Параметри запиту
interface RequestParams {
  model: string;
  prompt: string;
  movieId: number;
  movieTitle: string;
  genres?: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Отримуємо параметри запиту
    const params: RequestParams = await request.json();
    
    if (!params.model || !params.prompt) {
      return NextResponse.json(
        { error: 'Модель та промпт обов\'язкові' },
        { status: 400 }
      );
    }
    
    console.log(`Запит рекомендацій для фільму ${params.movieTitle} (ID: ${params.movieId})`);
    console.log(`Використовується модель: ${params.model}`);
    
    // Виконуємо запит до Hugging Face API
    const recommendations = await getRecommendationsFromLLM(params);
    
    // Обробляємо отримані рекомендації
    const processedRecommendations = await processRecommendations(recommendations);
    
    return NextResponse.json({ recommendations: processedRecommendations });
  } catch (error) {
    console.error('Помилка при отриманні рекомендацій від LLM:', error);
    return NextResponse.json(
      { error: 'Не вдалося отримати рекомендації' },
      { status: 500 }
    );
  }
}

// Функція для запиту до Hugging Face API
async function getRecommendationsFromLLM(params: RequestParams): Promise<MovieRecommendation[]> {
  // Тут буде запит до Hugging Face API
  const apiUrl = 'https://api-inference.huggingface.co/models/' + params.model;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: params.prompt,
        parameters: {
          max_new_tokens: 1024,
          temperature: 0.7,
          top_p: 0.9,
          do_sample: true
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Помилка API Hugging Face: ${response.status} ${errorText}`);
    }
    
    // Обробка відповіді
    const data = await response.json();
    
    let modelOutput = '';
    if (Array.isArray(data) && data.length > 0 && data[0].generated_text) {
      modelOutput = data[0].generated_text;
    } else if (typeof data === 'object' && data.generated_text) {
      modelOutput = data.generated_text;
    } else if (typeof data === 'string') {
      modelOutput = data;
    } else {
      console.error('Неочікуваний формат відповіді від Hugging Face:', data);
      throw new Error('Невідомий формат відповіді');
    }
    
    // Парсинг тексту відповіді в структуровані рекомендації
    return parseRecommendations(modelOutput);
  } catch (error) {
    console.error('Помилка при запиті до Hugging Face:', error);
    
    // Якщо не вдалося отримати рекомендації, генеруємо заглушки
    return generateFallbackRecommendations(params);
  }
}

// Функція для парсингу тексту відповіді в структуровані рекомендації
function parseRecommendations(text: string): MovieRecommendation[] {
  const recommendations: MovieRecommendation[] = [];
  
  // Шаблон для парсингу рекомендацій в форматі "1. "Назва фільму" (Рік)"
  const recommendationPattern = /\d+\.\s+[""]([^""]+)[""](?:\s+\((\d{4})\))?/gs;
  
  let match;
  while ((match = recommendationPattern.exec(text)) !== null) {
    const [_, title, year] = match;
    
    if (title) {
      recommendations.push({
        title: title.trim(),
        year: year?.trim()
      });
    }
  }
  
  // Якщо парсинг не знайшов рекомендацій, спробуємо простіший підхід
  if (recommendations.length === 0) {
    const lines = text.split(/(?:\r?\n|\r)/);
    
    for (const line of lines) {
      // Шукаємо рядки, які починаються з цифри та крапки
      const simpleMatch = line.match(/^\s*\d+\.\s+[""]?([^""]+)[""]?(?:\s+\((\d{4})\))?/);
      if (simpleMatch) {
        const [_, title, year] = simpleMatch;
        if (title) {
          recommendations.push({
            title: title.trim(),
            year: year?.trim()
          });
        }
      }
    }
  }
  
  return recommendations.slice(0, 3); // Обмежуємо до 3 рекомендацій
}

// Функція для генерації заглушок рекомендацій
function generateFallbackRecommendations(params: RequestParams): MovieRecommendation[] {
  // Заглушки для різних жанрів
  const genreRecommendations: Record<string, MovieRecommendation[]> = {
    'Драма': [
      { title: 'Втеча з Шоушенка', year: '1994' },
      { title: 'Форрест Гамп', year: '1994' },
      { title: 'Зелена миля', year: '1999' }
    ],
    'Комедія': [
      { title: 'Суперперці', year: '2007' },
      { title: 'Похмілля у Вегасі', year: '2009' },
      { title: 'Великий Лебовскі', year: '1998' }
    ],
    'Бойовик': [
      { title: 'Джон Вік', year: '2014' },
      { title: 'Матриця', year: '1999' },
      { title: 'Темний лицар', year: '2008' }
    ],
    'Жахи': [
      { title: 'Сяйво', year: '1980' },
      { title: 'Спадковість', year: '2018' },
      { title: 'Екзорцист', year: '1973' }
    ]
  };
  
  // Шукаємо рекомендації за жанрами фільму
  const relevantGenres = params.genres || [];
  let fallbackRecs: MovieRecommendation[] = [];
  
  // Додаємо рекомендації для кожного жанру
  for (const genre of relevantGenres) {
    if (genreRecommendations[genre]) {
      fallbackRecs = [...fallbackRecs, ...genreRecommendations[genre]];
    }
  }
  
  // Якщо не знайдено рекомендацій за жанрами, даємо змішані рекомендації
  if (fallbackRecs.length === 0) {
    fallbackRecs = [
      { title: 'Початок', year: '2010' },
      { title: 'Володар перснів: Хранителі персня', year: '2001' },
      { title: 'Кримінальне чтиво', year: '1994' },
      { title: 'Бійцівський клуб', year: '1999' },
      { title: 'Інтерстеллар', year: '2014' }
    ];
  }
  
  // Обмежуємо до 3 унікальних рекомендацій
  const uniqueRecs = Array.from(new Map(fallbackRecs.map(item => [item.title, item])).values());
  return uniqueRecs.slice(0, 3);
}

// Функція для пошуку фільмів на TMDB
async function processRecommendations(recommendations: MovieRecommendation[]): Promise<MovieRecommendation[]> {
  // Збагачуємо рекомендації даними з TMDB
  const processedRecs = [...recommendations];
  const enrichedRecs: MovieRecommendation[] = [];
  
  // Виконуємо пошук по кожній рекомендації
  for (const rec of processedRecs) {
    try {
      // Формуємо запит для пошуку в TMDB
      const query = `${rec.title} ${rec.year || ''}`.trim();
      console.log(`Пошук фільму в TMDB: "${query}"`);
      
      // Виконуємо пошук через API
      const searchResults = await tmdbApi.searchMovies(query, 1);
      
      if (searchResults && searchResults.results && searchResults.results.length > 0) {
        // Знайдено фільм - додаємо його до рекомендації
        const firstMatch = searchResults.results[0];
        
        // Перевіряємо відповідність року, якщо рік указано в рекомендації
        let bestMatch = firstMatch;
        if (rec.year) {
          const matchWithYear = searchResults.results.find(
            movie => movie.release_date && movie.release_date.startsWith(rec.year!)
          );
          if (matchWithYear) {
            bestMatch = matchWithYear;
          }
        }
        
        enrichedRecs.push({
          ...rec,
          tmdbMovie: bestMatch
        });
        
        console.log(`Знайдено фільм: "${bestMatch.title}" (ID: ${bestMatch.id})`);
      } else {
        // Фільм не знайдено в TMDB
        console.log(`Фільм "${rec.title}" не знайдено в TMDB`);
        enrichedRecs.push({
          ...rec,
          notFound: true
        });
      }
    } catch (error) {
      console.error(`Помилка при пошуку фільму "${rec.title}" в TMDB:`, error);
      enrichedRecs.push({
        ...rec,
        notFound: true
      });
    }
  }
  
  return enrichedRecs;
}