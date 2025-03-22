// app/api/watchlists/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { db } from '@/lib/db';
import { watchlistsTable, watchlistMoviesTable } from '@/lib/db/schema';
import { eq, and, ne } from 'drizzle-orm';

// GET - Отримання конкретного списку та його фільмів
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
    
    // Отримуємо фільми зі списку перегляду
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
    const result = {
      ...watchlist[0],
      movies: movies.map(movie => ({
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
      }))
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching watchlist details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watchlist details' },
      { status: 500 }
    );
  }
}

// PATCH - Оновлення списку перегляду
export async function PATCH(
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
    
    // Не дозволяємо змінювати статус "за замовчуванням" через цей ендпоінт
    // для списку "Невідсортоване"
    if (watchlist[0].isDefault) {
      const { name, description, color, icon, sortOrder } = await request.json();
      
      if (name && name !== watchlist[0].name) {
        return NextResponse.json(
          { error: 'Cannot change name of default watchlist' },
          { status: 400 }
        );
      }
      
      // Оновлюємо лише дозволені поля для списку за замовчуванням
      const updatedWatchlist = await db.update(watchlistsTable)
        .set({
          description: description !== undefined ? description : watchlist[0].description,
          color: color || watchlist[0].color,
          icon: icon || watchlist[0].icon,
          sortOrder: sortOrder !== undefined ? sortOrder : watchlist[0].sortOrder,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(watchlistsTable.id, watchlistId),
            eq(watchlistsTable.userEmail, user.email.toLowerCase())
          )
        )
        .returning();
      
      return NextResponse.json(updatedWatchlist[0]);
    }
    
    // Для звичайних списків дозволяємо змінювати всі поля
    const { name, description, color, icon, sortOrder } = await request.json();
    
    // Перевіряємо, чи не змінюється назва на вже існуючу
    if (name && name !== watchlist[0].name) {
      const existingWatchlist = await db.select()
        .from(watchlistsTable)
        .where(
          and(
            eq(watchlistsTable.userEmail, user.email.toLowerCase()),
            eq(watchlistsTable.name, name),
            ne(watchlistsTable.id, watchlistId) // Не дорівнює поточному ID
          )
        )
        .limit(1);
      
      if (existingWatchlist.length > 0) {
        return NextResponse.json(
          { error: 'Watchlist with this name already exists' },
          { status: 400 }
        );
      }
    }
    
    // Оновлюємо список перегляду
    const updatedWatchlist = await db.update(watchlistsTable)
      .set({
        name: name || watchlist[0].name,
        description: description !== undefined ? description : watchlist[0].description,
        color: color || watchlist[0].color,
        icon: icon || watchlist[0].icon,
        sortOrder: sortOrder !== undefined ? sortOrder : watchlist[0].sortOrder,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(watchlistsTable.id, watchlistId),
          eq(watchlistsTable.userEmail, user.email.toLowerCase())
        )
      )
      .returning();
    
    return NextResponse.json(updatedWatchlist[0]);
  } catch (error) {
    console.error('Error updating watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to update watchlist' },
      { status: 500 }
    );
  }
}

// DELETE - Видалення списку перегляду
export async function DELETE(
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
    
    // Не дозволяємо видаляти список за замовчуванням
    if (watchlist[0].isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default watchlist' },
        { status: 400 }
      );
    }
    
    // Отримуємо список за замовчуванням для переміщення фільмів
    const defaultWatchlist = await db.select()
      .from(watchlistsTable)
      .where(
        and(
          eq(watchlistsTable.userEmail, user.email.toLowerCase()),
          eq(watchlistsTable.isDefault, true)
        )
      )
      .limit(1);
    
    if (defaultWatchlist.length === 0) {
      // Якщо з якоїсь причини список за замовчуванням відсутній, створюємо його
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
      
      defaultWatchlist.push(newDefaultWatchlist[0]);
    }
    
    // Отримуємо фільми з видаленого списку
    const movies = await db.select()
      .from(watchlistMoviesTable)
      .where(
        and(
          eq(watchlistMoviesTable.watchlistId, watchlistId),
          eq(watchlistMoviesTable.userEmail, user.email.toLowerCase())
        )
      );
    
    // Переміщуємо фільми до списку за замовчуванням
    for (const movie of movies) {
      // Перевіряємо, чи фільм вже існує в списку за замовчуванням
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
      
      // Якщо фільм відсутній у списку за замовчуванням, додаємо його
      if (existingMovie.length === 0) {
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
            notes: movie.notes,
            priority: movie.priority
          });
      }
    }
    
    // Видаляємо всі фільми зі списку
    await db.delete(watchlistMoviesTable)
      .where(
        and(
          eq(watchlistMoviesTable.watchlistId, watchlistId),
          eq(watchlistMoviesTable.userEmail, user.email.toLowerCase())
        )
      );
    
    // Видаляємо список перегляду
    await db.delete(watchlistsTable)
      .where(
        and(
          eq(watchlistsTable.id, watchlistId),
          eq(watchlistsTable.userEmail, user.email.toLowerCase())
        )
      );
    
    return NextResponse.json({
      success: true,
      message: 'Watchlist deleted and movies moved to default watchlist'
    });
  } catch (error) {
    console.error('Error deleting watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to delete watchlist' },
      { status: 500 }
    );
  }
}