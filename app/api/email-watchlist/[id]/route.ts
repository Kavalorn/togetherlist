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
    
    // Видаляємо фільм зі списку перегляду для цього користувача
    await db.delete(emailWatchlistTable)
      .where(
        and(
          eq(emailWatchlistTable.movieId, movieId),
          eq(emailWatchlistTable.userEmail, user.email.toLowerCase())
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