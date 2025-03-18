// app/api/email-watchlist/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { db } from '@/lib/db';
import { emailWatchlistTable } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// GET - Отримання списку перегляду для поточного користувача
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
    
    // Отримуємо список перегляду з бази даних для цього користувача
    const watchlist = await db.select().from(emailWatchlistTable)
      .where(eq(emailWatchlistTable.userEmail, user.email.toLowerCase()))
      .orderBy(emailWatchlistTable.createdAt);
    
    // Трансформуємо властивості для відповідності очікуванням фронтенду
    const transformedWatchlist = watchlist.map(item => ({
      id: item.id,
      movie_id: item.movieId, // Важливо: movie_id для фронтенду
      title: item.title,
      poster_path: item.posterPath,
      release_date: item.releaseDate,
      overview: item.overview,
      vote_average: item.voteAverage,
      vote_count: item.voteCount,
      created_at: item.createdAt
    }));

    console.log("Повернуто елементів списку перегляду:", transformedWatchlist.length);
    
    return NextResponse.json(transformedWatchlist);
  } catch (error) {
    console.error('Помилка отримання списку перегляду:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' },
      { status: 500 }
    );
  }
}

// POST - Додавання фільму до списку перегляду
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
    
    console.log("Додавання фільму до списку перегляду:", {
      id: movie.id,
      title: movie.title,
      vote_count: movie.vote_count,
      user: user.email.toLowerCase()
    });
    
    // Перевіряємо, чи фільм вже є в списку перегляду
    const existingMovie = await db.select()
      .from(emailWatchlistTable)
      .where(
        and(
          eq(emailWatchlistTable.movieId, movie.id),
          eq(emailWatchlistTable.userEmail, user.email.toLowerCase())
        )
      )
      .limit(1);
    
    if (existingMovie.length > 0) {
      console.log("Фільм вже є в списку перегляду, оновлюємо");
      
      // Оновлюємо існуючий запис
      await db.update(emailWatchlistTable)
        .set({
          title: movie.title,
          posterPath: movie.poster_path || null,
          releaseDate: movie.release_date || null,
          overview: movie.overview || null,
          voteAverage: movie.vote_average || null,
          voteCount: movie.vote_count !== undefined ? movie.vote_count : null,
        })
        .where(
          and(
            eq(emailWatchlistTable.movieId, movie.id),
            eq(emailWatchlistTable.userEmail, user.email.toLowerCase())
          )
        );
        
      console.log("Фільм успішно оновлено");
    } else {
      console.log("Додаємо новий фільм до списку перегляду");
      
      // Додаємо новий запис
      await db.insert(emailWatchlistTable)
        .values({
          userEmail: user.email.toLowerCase(),
          movieId: movie.id,
          title: movie.title,
          posterPath: movie.poster_path || null,
          releaseDate: movie.release_date || null,
          overview: movie.overview || null,
          voteAverage: movie.vote_average || null,
          voteCount: movie.vote_count !== undefined ? movie.vote_count : null,
        });
        
      console.log("Фільм успішно додано");
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Movie added to watchlist' 
    });
  } catch (error) {
    console.error('Помилка додавання до списку перегляду:', error);
    return NextResponse.json(
      { error: 'Failed to add movie to watchlist' },
      { status: 500 }
    );
  }
}