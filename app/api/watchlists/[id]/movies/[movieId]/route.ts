// app/api/watchlists/[watchlistId]/movies/[movieId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { db } from '@/lib/db';
import { watchlistsTable, watchlistMoviesTable } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

type RouteParams = {
  params: {
    watchlistId: string;
    movieId: string;
  }
};

// DELETE - Видалення фільму зі списку перегляду
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { watchlistId, movieId } = params;
    
    const parsedWatchlistId = parseInt(watchlistId, 10);
    const parsedMovieId = parseInt(movieId, 10);
    
    if (isNaN(parsedWatchlistId) || isNaN(parsedMovieId)) {
      return NextResponse.json(
        { error: 'Invalid watchlist ID or movie ID' },
        { status: 400 }
      );
    }
    
    // Перевіряємо, чи існує список і чи належить він поточному користувачеві
    const watchlist = await db.select()
      .from(watchlistsTable)
      .where(
        and(
          eq(watchlistsTable.id, parsedWatchlistId),
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
    
    // Видаляємо фільм зі списку перегляду
    await db.delete(watchlistMoviesTable)
      .where(
        and(
          eq(watchlistMoviesTable.watchlistId, parsedWatchlistId),
          eq(watchlistMoviesTable.movieId, parsedMovieId),
          eq(watchlistMoviesTable.userEmail, user.email.toLowerCase())
        )
      );
    
    return NextResponse.json({
      success: true,
      message: 'Movie removed from watchlist'
    });
  } catch (error) {
    console.error('Error removing movie from watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove movie from watchlist' },
      { status: 500 }
    );
  }
}

// PATCH - Оновлення нотаток або пріоритету фільму
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const { watchlistId, movieId } = params;
    
    const parsedWatchlistId = parseInt(watchlistId, 10);
    const parsedMovieId = parseInt(movieId, 10);
    
    if (isNaN(parsedWatchlistId) || isNaN(parsedMovieId)) {
      return NextResponse.json(
        { error: 'Invalid watchlist ID or movie ID' },
        { status: 400 }
      );
    }
    
    // Перевіряємо, чи існує запис фільму в списку
    const existingMovie = await db.select()
      .from(watchlistMoviesTable)
      .where(
        and(
          eq(watchlistMoviesTable.watchlistId, parsedWatchlistId),
          eq(watchlistMoviesTable.movieId, parsedMovieId),
          eq(watchlistMoviesTable.userEmail, user.email.toLowerCase())
        )
      )
      .limit(1);
    
    if (existingMovie.length === 0) {
      return NextResponse.json(
        { error: 'Movie not found in this watchlist' },
        { status: 404 }
      );
    }
    
    // Отримуємо дані з тіла запиту
    const { notes, priority } = await request.json();
    
    // Оновлюємо запис фільму
    const updatedMovie = await db.update(watchlistMoviesTable)
      .set({
        notes: notes !== undefined ? notes : existingMovie[0].notes,
        priority: priority !== undefined ? priority : existingMovie[0].priority
      })
      .where(
        and(
          eq(watchlistMoviesTable.watchlistId, parsedWatchlistId),
          eq(watchlistMoviesTable.movieId, parsedMovieId),
          eq(watchlistMoviesTable.userEmail, user.email.toLowerCase())
        )
      )
      .returning();
    
    return NextResponse.json({
      success: true,
      message: 'Movie details updated',
      movie: {
        id: updatedMovie[0].id,
        movie_id: updatedMovie[0].movieId,
        title: updatedMovie[0].title,
        notes: updatedMovie[0].notes,
        priority: updatedMovie[0].priority
      }
    });
  } catch (error) {
    console.error('Error updating movie details:', error);
    return NextResponse.json(
      { error: 'Failed to update movie details' },
      { status: 500 }
    );
  }
}