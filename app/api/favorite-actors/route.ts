// app/api/favorite-actors/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { db } from '@/lib/db';
import { favoriteActorsTable } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// GET - Отримання списку улюблених акторів для поточного користувача
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
      
      // Отримуємо дані актора з тіла запиту
      const actor = await request.json();
      
      // Валідація обов'язкових полів
      if (!actor.id || !actor.name) {
        return NextResponse.json(
          { error: 'Actor ID and name are required' },
          { status: 400 }
        );
      }
      
      // Додаємо актора до списку улюблених з безпечною обробкою null значень
      await db.insert(favoriteActorsTable)
        .values({
          userEmail: user.email.toLowerCase(),
          actorId: actor.id,
          actorName: actor.name,
          profilePath: actor.profile_path || null,
          knownForDepartment: actor.known_for_department || null,
          popularity: actor.popularity !== undefined && actor.popularity !== null 
            ? actor.popularity 
            : null,
        })
        .onConflictDoUpdate({
          target: [favoriteActorsTable.actorId, favoriteActorsTable.userEmail],
          set: {
            actorName: actor.name,
            profilePath: actor.profile_path || null,
            knownForDepartment: actor.known_for_department || null,
            popularity: actor.popularity !== undefined && actor.popularity !== null 
              ? actor.popularity 
              : null,
          }
        });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Actor added to favorites' 
      });
    } catch (error) {
      console.error('Error adding to favorites:', error);
      return NextResponse.json(
        { error: 'Failed to add actor to favorites' },
        { status: 500 }
      );
    }
  }