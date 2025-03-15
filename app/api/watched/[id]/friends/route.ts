// app/api/watched/[id]/friends/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { db } from '@/lib/db';
import { watchedMoviesTable, friendsTable } from '@/lib/db/schema';
import { eq, and, or, inArray } from 'drizzle-orm';

// GET - Отримання друзів, які переглянули конкретний фільм
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;
    
    const movieId = parseInt(id, 10);
    
    if (isNaN(movieId)) {
      return NextResponse.json(
        { error: 'Invalid movie ID' },
        { status: 400 }
      );
    }
    
    // Спочатку отримуємо список друзів користувача
    const userFriends = await db.select({
      friendEmail: friendsTable.friendEmail,
      userEmail: friendsTable.userEmail
    })
    .from(friendsTable)
    .where(
      and(
        or(
          eq(friendsTable.userEmail, user.email.toLowerCase()),
          eq(friendsTable.friendEmail, user.email.toLowerCase())
        ),
        eq(friendsTable.status, 'accepted')
      )
    );
    
    // Формуємо список електронних адрес друзів
    const friendEmails = userFriends.map(friend => 
      friend.friendEmail === user.email?.toLowerCase() ? friend.userEmail : friend.friendEmail
    );
    
    // Якщо немає друзів, повертаємо порожній список
    if (friendEmails.length === 0) {
      return NextResponse.json([]);
    }
    
    // Отримуємо інформацію про друзів, які переглянули цей фільм
    const friendsWhoWatched = await db.select({
      userEmail: watchedMoviesTable.userEmail,
      watchedAt: watchedMoviesTable.watchedAt,
      rating: watchedMoviesTable.rating
    })
    .from(watchedMoviesTable)
    .where(
      and(
        eq(watchedMoviesTable.movieId, movieId),
        inArray(watchedMoviesTable.userEmail, friendEmails)
      )
    );
    
    // Форматуємо дані для фронтенду
    const formattedData = friendsWhoWatched.map(friend => ({
      email: friend.userEmail,
      display_name: friend.userEmail.split('@')[0], // Простий спосіб отримати ім'я
      watched_at: friend.watchedAt,
      rating: friend.rating
    }));
    
    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error fetching friends who watched:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friends who watched this movie' },
      { status: 500 }
    );
  }
}