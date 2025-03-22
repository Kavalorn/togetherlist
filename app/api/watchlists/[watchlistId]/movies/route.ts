// app/api/watchlists/[id]/movies/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { db } from '@/lib/db';
import { watchlistsTable, watchlistMoviesTable } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// POST - Додавання фільму до списку перегляду
export async function POST(
  request: NextRequest,
  { params }: { params: { watchlistId: string } }
) {
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

    const { watchlistId: id } = await params;
    
    const watchlistId = parseInt(id, 10);
    
    if (isNaN(watchlistId)) {
      return NextResponse.json(
        { error: 'Invalid watchlist ID' },
        { status: 400 }
      );
    }
    
    // Перевіряємо, чи існує список і чи належить він поточному користувачеві
    const watchlist = await db.select()
      .from(watchlistsTable)
      .where(
        and(
          eq(watchlistsTable.id, watchlistId),
          eq(watchlistsTable.userEmail, user.email.toLowerCase())
        )
      )
      .limit(1);
    
    if (watchlist.length === 0) {
      return NextResponse.json(
        { error: 'Watchlist not found or access denied' },
        { status: 404 }
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
    
    // Перевіряємо, чи фільм вже є в цьому списку
    const existingMovie = await db.select()
      .from(watchlistMoviesTable)
      .where(
        and(
          eq(watchlistMoviesTable.watchlistId, watchlistId),
          eq(watchlistMoviesTable.movieId, movie.id),
          eq(watchlistMoviesTable.userEmail, user.email.toLowerCase())
        )
      )
      .limit(1);
    
    if (existingMovie.length > 0) {
      // Якщо фільм вже є, оновлюємо його дані
      const updatedMovie = await db.update(watchlistMoviesTable)
        .set({
          title: movie.title,
          posterPath: movie.poster_path || null,
          releaseDate: movie.release_date || null,
          overview: movie.overview || null,
          voteAverage: movie.vote_average !== undefined ? movie.vote_average : null,
          voteCount: movie.vote_count !== undefined ? movie.vote_count : null,
          notes: movie.notes || existingMovie[0].notes,
          priority: movie.priority !== undefined ? movie.priority : existingMovie[0].priority
        })
        .where(
          and(
            eq(watchlistMoviesTable.watchlistId, watchlistId),
            eq(watchlistMoviesTable.movieId, movie.id),
            eq(watchlistMoviesTable.userEmail, user.email.toLowerCase())
          )
        )
        .returning();
      
      return NextResponse.json({
        success: true,
        message: 'Movie updated in watchlist',
        movie: updatedMovie[0]
      });
    }
    
    // Якщо фільму немає, додаємо його до списку
    const newMovie = await db.insert(watchlistMoviesTable)
      .values({
        watchlistId,
        userEmail: user.email.toLowerCase(),
        movieId: movie.id,
        title: movie.title,
        posterPath: movie.poster_path || null,
        releaseDate: movie.release_date || null,
        overview: movie.overview || null,
        voteAverage: movie.vote_average !== undefined ? movie.vote_average : null,
        voteCount: movie.vote_count !== undefined ? movie.vote_count : null,
        notes: movie.notes || null,
        priority: movie.priority !== undefined ? movie.priority : 0
      })
      .returning();
    
    return NextResponse.json({
      success: true,
      message: 'Movie added to watchlist',
      movie: newMovie[0]
    });
  } catch (error) {
    console.error('Error adding movie to watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to add movie to watchlist' },
      { status: 500 }
    );
  }
}

// GET - Отримання всіх фільмів зі списку
export async function GET(
  request: NextRequest,
  { params }: { params: { watchlistId: string } }
) {
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

    const { watchlistId: id } = await params;
    
    const watchlistId = parseInt(id, 10);
    
    if (isNaN(watchlistId)) {
      return NextResponse.json(
        { error: 'Invalid watchlist ID' },
        { status: 400 }
      );
    }
    
    // Перевіряємо, чи існує список і чи належить він поточному користувачеві
    const watchlist = await db.select()
      .from(watchlistsTable)
      .where(
        and(
          eq(watchlistsTable.id, watchlistId),
          eq(watchlistsTable.userEmail, user.email.toLowerCase())
        )
      )
      .limit(1);
    
    if (watchlist.length === 0) {
      return NextResponse.json(
        { error: 'Watchlist not found or access denied' },
        { status: 404 }
      );
    }
    
    // Отримуємо всі фільми зі списку
    const movies = await db.select()
      .from(watchlistMoviesTable)
      .where(
        and(
          eq(watchlistMoviesTable.watchlistId, watchlistId),
          eq(watchlistMoviesTable.userEmail, user.email.toLowerCase())
        )
      )
      .orderBy(watchlistMoviesTable.createdAt);
    
    // Трансформуємо дані для фронтенду
    const transformedMovies = movies.map(movie => ({
      id: movie.id,
      movie_id: movie.movieId,
      title: movie.title,
      poster_path: movie.posterPath,
      release_date: movie.releaseDate,
      overview: movie.overview,
      vote_average: movie.voteAverage,
      vote_count: movie.voteCount,
      created_at: movie.createdAt,
      notes: movie.notes,
      priority: movie.priority
    }));
    
    return NextResponse.json(transformedMovies);
  } catch (error) {
    console.error('Error fetching movies from watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch movies from watchlist' },
      { status: 500 }
    );
  }
}