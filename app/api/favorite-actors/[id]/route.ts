// app/api/favorite-actors/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { db } from '@/lib/db';
import { favoriteActorsTable } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// DELETE - Видалення актора зі списку улюблених
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
    
    const actorId = parseInt(id, 10);
    
    if (isNaN(actorId)) {
      return NextResponse.json(
        { error: 'Invalid actor ID' },
        { status: 400 }
      );
    }
    
    // Видаляємо актора зі списку улюблених
    await db.delete(favoriteActorsTable)
      .where(
        and(
          eq(favoriteActorsTable.actorId, actorId),
          eq(favoriteActorsTable.userEmail, user.email.toLowerCase())
        )
      );
    
    return NextResponse.json({ 
      success: true, 
      message: 'Actor removed from favorites' 
    });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return NextResponse.json(
      { error: 'Failed to remove actor from favorites' },
      { status: 500 }
    );
  }
}