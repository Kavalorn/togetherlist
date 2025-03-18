// app/api/email-watchlist/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { db } from '@/lib/db';
import { emailWatchlistTable } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

type RouteParams = {
  params: {
    id: string;
  };
};

// DELETE - Видалення фільму зі списку перегляду
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('DELETE request received with params:', params);
    
    const supabase = createSupabaseServerClient();
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Unauthorized: missing or invalid Authorization header');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user || !user.email) {
      console.log('Invalid token:', authError);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { id } = params;
    console.log(`Received ID parameter: "${id}"`);
    
    if (!id) {
      console.error('Missing ID parameter');
      return NextResponse.json(
        { error: 'Missing movie ID' },
        { status: 400 }
      );
    }
    
    const movieId = parseInt(id, 10);
    console.log(`Parsed movie ID: ${movieId}`);
    
    if (isNaN(movieId)) {
      console.error(`Invalid movie ID: "${id}"`);
      return NextResponse.json(
        { error: 'Invalid movie ID' },
        { status: 400 }
      );
    }
    
    console.log(`Attempting to delete movie ${movieId} for user ${user.email.toLowerCase()}`);
    
    const result = await db.delete(emailWatchlistTable)
      .where(
        and(
          eq(emailWatchlistTable.movieId, movieId),
          eq(emailWatchlistTable.userEmail, user.email.toLowerCase())
        )
      );
    
    console.log('Delete operation completed:', result);
    
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