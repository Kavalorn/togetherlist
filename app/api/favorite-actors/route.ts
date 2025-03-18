// app/api/favorite-actors/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { db } from '@/lib/db';
import { favoriteActorsTable } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// GET - Отримання списку улюблених акторів для поточного користувача
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
    
    // Отримуємо список улюблених акторів з бази даних для цього користувача
    const favoriteActors = await db.select().from(favoriteActorsTable)
      .where(eq(favoriteActorsTable.userEmail, user.email.toLowerCase()))
      .orderBy(favoriteActorsTable.createdAt);
    
    // Трансформуємо властивості для відповідності очікуванням фронтенду
    const transformedActors = favoriteActors.map(item => ({
      id: item.id,
      actor_id: item.actorId,
      name: item.actorName,
      profile_path: item.profilePath,
      known_for_department: item.knownForDepartment,
      popularity: item.popularity,
      created_at: item.createdAt
    }));
    
    return NextResponse.json(transformedActors);
  } catch (error) {
    console.error('Error fetching favorite actors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorite actors' },
      { status: 500 }
    );
  }
}

// POST - Додавання актора до улюблених
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
    
    console.log("Adding actor to favorites:", {
      id: actor.id,
      name: actor.name,
      email: user.email
    });
    
    // Check if this actor is already in favorites for this user
    const existingActor = await db.select()
      .from(favoriteActorsTable)
      .where(
        and(
          eq(favoriteActorsTable.userEmail, user.email.toLowerCase()),
          eq(favoriteActorsTable.actorId, actor.id)
        )
      )
      .limit(1);
    
    if (existingActor.length > 0) {
      // Update the existing record
      await db.update(favoriteActorsTable)
        .set({
          actorName: actor.name,
          profilePath: actor.profile_path || null,
          knownForDepartment: actor.known_for_department || null,
          popularity: actor.popularity !== undefined && actor.popularity !== null 
            ? actor.popularity 
            : null,
        })
        .where(
          and(
            eq(favoriteActorsTable.userEmail, user.email.toLowerCase()),
            eq(favoriteActorsTable.actorId, actor.id)
          )
        );
    } else {
      // Insert a new record
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
          createdAt: new Date()
        });
    }
    
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