// app/api/watched/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { db } from '@/lib/db';
import { emailWatchlistTable, watchedMoviesTable } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// GET - Отримання списку переглянутих фільмів для поточного користувача
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user || !user.email) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    // Отримуємо список переглянутих фільмів з бази даних для цього користувача
    const watchedMovies = await db.select().from(watchedMoviesTable)
      .where(eq(watchedMoviesTable.userEmail, user.email.toLowerCase()))
      .orderBy(watchedMoviesTable.watchedAt);
    
    // Трансформуємо властивості для відповідності очікуванням фронтенду
    const transformedMovies = watchedMovies.map(item => ({
      id: item.id,
      movie_id: item.movieId,
      title: item.title,
      poster_path: item.posterPath,
      release_date: item.releaseDate,
      overview: item.overview,
      vote_average: item.voteAverage,
      vote_count: item.voteCount,
      watched_at: item.watchedAt,
      comment: item.comment,
      rating: item.rating
    }));
    
    return NextResponse.json(transformedMovies);
  } catch (error) {
    console.error('Error fetching watched movies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watched movies' },
      { status: 500 }
    );
  }
}

// POST - Додавання фільму до списку переглянутих
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    
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
    
    console.log("Додавання фільму до списку переглянутих:", { 
      id: movie.id, 
      title: movie.title
    });
    
    // Добавляємо фільм до списку переглянутих
    const result = await db.insert(watchedMoviesTable)
      .values({
        userEmail: user.email.toLowerCase(),
        movieId: movie.id,
        title: movie.title,
        posterPath: movie.poster_path || null,
        releaseDate: movie.release_date || null,
        overview: movie.overview || null,
        voteAverage: movie.vote_average || null,
        voteCount: movie.vote_count || null,
        comment: movie.comment || null,
        rating: movie.rating || null
      })
      .onConflictDoUpdate({
        target: [watchedMoviesTable.movieId, watchedMoviesTable.userEmail],
        set: {
          title: movie.title,
          posterPath: movie.poster_path || null,
          releaseDate: movie.release_date || null,
          overview: movie.overview || null,
          voteAverage: movie.vote_average || null,
          voteCount: movie.vote_count || null,
          watchedAt: new Date(),
          comment: movie.comment || null,
          rating: movie.rating || null
        }
      });
    
    // Якщо фільм був у списку перегляду, видаляємо його звідти
    if (movie.removeFromWatchlist !== false) {
      await db.delete(emailWatchlistTable)
        .where(
          and(
            eq(emailWatchlistTable.movieId, movie.id),
            eq(emailWatchlistTable.userEmail, user.email.toLowerCase())
          )
        );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Movie marked as watched' 
    });
  } catch (error) {
    console.error('Error marking movie as watched:', error);
    return NextResponse.json(
      { error: 'Failed to mark movie as watched' },
      { status: 500 }
    );
  }
}