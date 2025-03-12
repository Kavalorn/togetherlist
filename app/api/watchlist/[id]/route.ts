import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { db } from '@/lib/db';
import { watchlistTable } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// DELETE - Видалення фільму зі списку перегляду
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = await params;
    
    // Отримуємо ID фільму з параметрів запиту
    const movieId = parseInt(id, 10);
    
    if (isNaN(movieId)) {
      return NextResponse.json(
        { error: 'Invalid movie ID' },
        { status: 400 }
      );
    }
    
    // Видаляємо фільм зі списку перегляду для цього користувача
    await db.delete(watchlistTable)
      .where(
        and(
          eq(watchlistTable.movieId, movieId),
          eq(watchlistTable.userId, user.id)
        )
      );
    
    return NextResponse.json({ 
      success: true, 
      message: 'Movie removed from watchlist' 
    });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove movie from watchlist' },
      { status: 500 }
    );
  }
}