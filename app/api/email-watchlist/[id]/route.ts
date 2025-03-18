// app/api/email-watchlist/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { db } from '@/lib/db';
import { emailWatchlistTable } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// DELETE - Видалення фільму зі списку перегляду
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('DELETE запит отримано з параметрами:', params);
    
    const supabase = createSupabaseServerClient();
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Unauthorized: відсутній або недійсний заголовок Authorization');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user || !user.email) {
      console.log('Недійсний токен:', authError);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { id } = params;
    console.log(`Отримано параметр ID: "${id}"`);
    
    if (!id) {
      console.error('Відсутній параметр ID');
      return NextResponse.json(
        { error: 'Missing movie ID' },
        { status: 400 }
      );
    }
    
    const movieId = parseInt(id, 10);
    console.log(`Перетворено ID фільму: ${movieId}`);
    
    if (isNaN(movieId)) {
      console.error(`Недійсний ID фільму: "${id}"`);
      return NextResponse.json(
        { error: 'Invalid movie ID' },
        { status: 400 }
      );
    }
    
    console.log(`Спроба видалити фільм ${movieId} для користувача ${user.email.toLowerCase()}`);
    
    // Перевіримо наявність фільму перед видаленням для кращого логування
    const existingMovies = await db.select()
      .from(emailWatchlistTable)
      .where(
        and(
          eq(emailWatchlistTable.movieId, movieId),
          eq(emailWatchlistTable.userEmail, user.email.toLowerCase())
        )
      );
    
    console.log(`Знайдено ${existingMovies.length} фільмів за критеріями`);
    
    if (existingMovies.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Movie not found in watchlist' 
      }, { status: 404 });
    }
    
    await db.delete(emailWatchlistTable)
      .where(
        and(
          eq(emailWatchlistTable.movieId, movieId),
          eq(emailWatchlistTable.userEmail, user.email.toLowerCase())
        )
      );
    
    console.log('Операція видалення успішно завершена');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Movie removed from watchlist' 
    });
  } catch (error) {
    console.error('Помилка видалення зі списку перегляду:', error);
    return NextResponse.json(
      { error: 'Failed to remove movie from watchlist' },
      { status: 500 }
    );
  }
}