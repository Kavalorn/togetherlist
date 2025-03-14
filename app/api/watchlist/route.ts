// app/api/watchlist/route.ts (повна заміна)
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { db } from '@/lib/db';
import { emailWatchlistTable } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// GET - Отримання списку перегляду для поточного користувача
export async function GET(request: NextRequest) {
  try {
    // Створюємо серверний клієнт Supabase
    const supabase = createSupabaseServerClient();
    
    // Отримуємо токен з заголовка запиту
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Верифікуємо токен та отримуємо користувача
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user || !user.email) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    // Отримуємо список перегляду з бази даних за email
    const watchlist = await db.select().from(emailWatchlistTable)
      .where(eq(emailWatchlistTable.userEmail, user.email.toLowerCase()))
      .orderBy(emailWatchlistTable.createdAt);
    
    console.log("Дані зі списку перегляду з БД:", watchlist.map(item => ({
      movie_id: item.movieId,
      title: item.title,
      vote_count: item.voteCount
    })));
    
    // Трансформуємо властивості для відповідності очікуванням фронтенду
    // та переконуємося, що vote_count правильно передається
    const transformedWatchlist = watchlist.map(item => ({
      id: item.id,
      movie_id: item.movieId,
      title: item.title,
      poster_path: item.posterPath,
      release_date: item.releaseDate,
      overview: item.overview,
      vote_average: item.voteAverage,
      // Явно передаємо vote_count як число
      vote_count: item.voteCount !== null && item.voteCount !== undefined 
        ? Number(item.voteCount) 
        : 0,
      created_at: item.createdAt
    }));
    
    return NextResponse.json(transformedWatchlist);
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' },
      { status: 500 }
    );
  }
}

// POST - Додавання фільму до списку перегляду
export async function POST(request: NextRequest) {
  try {
    // Створюємо серверний клієнт Supabase
    const supabase = createSupabaseServerClient();
    
    // Отримуємо токен з заголовка запиту
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Верифікуємо токен та отримуємо користувача
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user || !user.email) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    // Отримуємо дані фільму з тіла запиту
    const movie = await request.json();
    
    // Валідація обов'язкових полів
    if (!movie.id || !movie.title) {
      return NextResponse.json(
        { error: 'Movie ID and title are required' },
        { status: 400 }
      );
    }
    
    console.log("Додавання фільму до списку перегляду:", { 
      id: movie.id, 
      title: movie.title, 
      vote_count: movie.vote_count 
    });
    
    // Переконуємося, що vote_count є числом
    const voteCount = movie.vote_count !== undefined && movie.vote_count !== null
      ? Number(movie.vote_count)
      : 0;
    
    // Додаємо фільм до списку перегляду
    await db.insert(emailWatchlistTable)
      .values({
        userEmail: user.email.toLowerCase(),
        movieId: movie.id,
        title: movie.title,
        posterPath: movie.poster_path || null,
        releaseDate: movie.release_date || null,
        overview: movie.overview || null,
        voteAverage: movie.vote_average || null,
        voteCount: voteCount, // Зберігаємо як число
      })
      .onConflictDoUpdate({
        target: [emailWatchlistTable.movieId, emailWatchlistTable.userEmail],
        set: {
          title: movie.title,
          posterPath: movie.poster_path || null,
          releaseDate: movie.release_date || null,
          overview: movie.overview || null,
          voteAverage: movie.vote_average || null,
          voteCount: voteCount, // Оновлюємо vote_count при конфлікті
        }
      });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Movie added to watchlist' 
    });
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to add movie to watchlist' },
      { status: 500 }
    );
  }
}