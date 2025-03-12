import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { db } from '@/lib/db';
import { watchlistTable } from '@/lib/db/schema';
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
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    // Отримуємо список перегляду з бази даних для цього користувача
    const watchlist = await db.select().from(watchlistTable)
      .where(eq(watchlistTable.userId, user.id))
      .orderBy(watchlistTable.createdAt);
    
    // Трансформуємо властивості для відповідності очікуванням фронтенду
    const transformedWatchlist = watchlist.map(item => ({
      id: item.id,
      movie_id: item.movieId,
      title: item.title,
      poster_path: item.posterPath,
      release_date: item.releaseDate,
      overview: item.overview,
      vote_average: item.voteAverage,
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
    
    if (authError || !user) {
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
    
    // Додаємо фільм до списку перегляду
    await db.insert(watchlistTable)
      .values({
        userId: user.id,
        movieId: movie.id,
        title: movie.title,
        posterPath: movie.poster_path || null,
        releaseDate: movie.release_date || null,
        overview: movie.overview || null,
        voteAverage: movie.vote_average || null,
      })
      .onConflictDoUpdate({
        target: [watchlistTable.movieId, watchlistTable.userId],
        set: {
          title: movie.title,
          posterPath: movie.poster_path || null,
          releaseDate: movie.release_date || null,
          overview: movie.overview || null,
          voteAverage: movie.vote_average || null,
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