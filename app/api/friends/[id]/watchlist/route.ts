// app/api/friends/[id]/watchlist/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { db } from '@/lib/db';
import { emailWatchlistTable, friendsTable } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';

// GET - Отримання списку перегляду друга
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("Початок запиту списку фільмів друга");
    
    // Створюємо серверний клієнт Supabase
    const supabase = createSupabaseServerClient();
    
    // Отримуємо токен з заголовка запиту
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("Відсутній токен авторизації");
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Верифікуємо токен та отримуємо користувача
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user || !user.email) {
      console.log("Помилка авторизації:", authError);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    const friendEmail = decodeURIComponent(params.id);
    console.log("Email друга:", friendEmail);
    
    if (!friendEmail) {
      console.log("Email друга відсутній");
      return NextResponse.json(
        { error: 'Friend email is required' },
        { status: 400 }
      );
    }
    
    // Нормалізуємо email
    const normalizedUserEmail = user.email.toLowerCase().trim();
    const normalizedFriendEmail = friendEmail.toLowerCase().trim();
    console.log("Нормалізовані email:", { user: normalizedUserEmail, friend: normalizedFriendEmail });
    
    // Перевіряємо, чи є користувачі друзями
    const friendship = await db.select()
      .from(friendsTable)
      .where(
        and(
          or(
            and(
              eq(friendsTable.userEmail, normalizedUserEmail),
              eq(friendsTable.friendEmail, normalizedFriendEmail)
            ),
            and(
              eq(friendsTable.userEmail, normalizedFriendEmail),
              eq(friendsTable.friendEmail, normalizedUserEmail)
            )
          ),
          eq(friendsTable.status, 'accepted')
        )
      )
      .limit(1);
    
    console.log("Результат перевірки дружби:", friendship);
    
    if (!friendship.length) {
      console.log("Користувачі не є друзями");
      return NextResponse.json(
        { error: 'You are not friends with this user' },
        { status: 403 }
      );
    }
    
    // Створюємо інформацію про друга
    const friendInfo = {
      id: normalizedFriendEmail,
      email: normalizedFriendEmail,
      display_name: normalizedFriendEmail.split('@')[0]
    };
    
    // Отримуємо список перегляду друга з нової таблиці за email
    const watchlist = await db.select()
      .from(emailWatchlistTable)
      .where(eq(emailWatchlistTable.userEmail, normalizedFriendEmail))
      .orderBy(emailWatchlistTable.createdAt);
    
    console.log("Список фільмів друга:", watchlist);
    
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
    
    console.log("Відправляємо відповідь:", { 
      friend: friendInfo, 
      watchlistLength: transformedWatchlist.length 
    });
    
    return NextResponse.json({
      friend: friendInfo,
      watchlist: transformedWatchlist
    });
  } catch (error) {
    console.error('Error fetching friend watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friend watchlist' },
      { status: 500 }
    );
  }
}