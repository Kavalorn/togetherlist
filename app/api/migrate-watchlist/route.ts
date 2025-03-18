// app/api/migrate-watchlist/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { db } from '@/lib/db';
import { watchlistsTable, watchlistMoviesTable, emailWatchlistTable } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// POST - Міграція фільмів зі старого списку до нового за замовчуванням
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
    
    // Спочатку перевіряємо, чи є вже список за замовчуванням
    let defaultWatchlist = await db.select()
      .from(watchlistsTable)
      .where(
        and(
          eq(watchlistsTable.userEmail, user.email.toLowerCase()),
          eq(watchlistsTable.isDefault, true)
        )
      )
      .limit(1);
    
    // Якщо список за замовчуванням відсутній, створюємо його
    if (defaultWatchlist.length === 0) {
      const newDefaultWatchlist = await db.insert(watchlistsTable)
        .values({
          userEmail: user.email.toLowerCase(),
          name: "Невідсортоване",
          description: "Фільми без категорії",
          isDefault: true,
          color: "#3b82f6", // Синій колір
          icon: "inbox", // Іконка inbox
          sortOrder: 0
        })
        .returning();
      
      defaultWatchlist = newDefaultWatchlist;
    }
    
    // Отримуємо всі фільми зі старого списку перегляду
    const oldWatchlistMovies = await db.select()
      .from(emailWatchlistTable)
      .where(eq(emailWatchlistTable.userEmail, user.email.toLowerCase()));
    
    // Підраховуємо статистику для звіту
    const stats = {
      totalMovies: oldWatchlistMovies.length,
      migratedMovies: 0,
      skippedMovies: 0,
      errors: 0
    };
    
    // Для кожного фільму в старому списку
    for (const movie of oldWatchlistMovies) {
      try {
        // Перевіряємо, чи фільм вже є в новому списку
        const existingMovie = await db.select()
          .from(watchlistMoviesTable)
          .where(
            and(
              eq(watchlistMoviesTable.watchlistId, defaultWatchlist[0].id),
              eq(watchlistMoviesTable.movieId, movie.movieId),
              eq(watchlistMoviesTable.userEmail, user.email.toLowerCase())
            )
          )
          .limit(1);
        
        // Якщо фільм вже є в новому списку, пропускаємо його
        if (existingMovie.length > 0) {
          stats.skippedMovies++;
          continue;
        }
        
        // Додаємо фільм до нового списку
        await db.insert(watchlistMoviesTable)
          .values({
            watchlistId: defaultWatchlist[0].id,
            userEmail: user.email.toLowerCase(),
            movieId: movie.movieId,
            title: movie.title,
            posterPath: movie.posterPath,
            releaseDate: movie.releaseDate,
            overview: movie.overview,
            voteAverage: movie.voteAverage,
            voteCount: movie.voteCount,
            notes: null,
            priority: 0
          });
        
        stats.migratedMovies++;
      } catch (err) {
        console.error(`Error migrating movie ID ${movie.movieId}:`, err);
        stats.errors++;
      }
    }
    
    // Не видаляємо старі дані, щоб не втратити їх у разі проблем з міграцією
    // Це можна зробити пізніше після підтвердження успішної міграції
    
    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      watchlistId: defaultWatchlist[0].id,
      stats
    });
  } catch (error) {
    console.error('Error during watchlist migration:', error);
    return NextResponse.json(
      { error: 'Failed to migrate watchlist' },
      { status: 500 }
    );
  }
}