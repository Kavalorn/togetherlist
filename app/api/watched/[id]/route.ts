// app/api/watched/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { db } from '@/lib/db';
import { watchedMoviesTable } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// DELETE - Видалення фільму зі списку переглянутих
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
    
    // Видаляємо фільм зі списку переглянутих
    await db.delete(watchedMoviesTable)
      .where(
        and(
          eq(watchedMoviesTable.movieId, movieId),
          eq(watchedMoviesTable.userEmail, user.email.toLowerCase())
        )
      );
    
    return NextResponse.json({ 
      success: true, 
      message: 'Movie removed from watched list' 
    });
  } catch (error) {
    console.error('Error removing from watched list:', error);
    return NextResponse.json(
      { error: 'Failed to remove movie from watched list' },
      { status: 500 }
    );
  }
}