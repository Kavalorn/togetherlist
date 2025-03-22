import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { db } from '@/lib/db';
import { friendsTable } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';

// PATCH - Оновлення статусу дружби (прийняття/відхилення запиту)
export async function PATCH(
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
    
    if (authError || !user || !user.email) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const friendshipId = parseInt(id, 10);
    
    if (isNaN(friendshipId)) {
      return NextResponse.json(
        { error: 'Invalid friendship ID' },
        { status: 400 }
      );
    }
    
    // Отримуємо дані з тіла запиту
    const { status } = await request.json();
    
    if (!status || !['accepted', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "accepted" or "rejected"' },
        { status: 400 }
      );
    }
    
    // Нормалізуємо email користувача
    const normalizedUserEmail = user.email.toLowerCase().trim();
    
    // Знаходимо дружбу за ID
    const friendship = await db.select()
      .from(friendsTable)
      .where(eq(friendsTable.id, friendshipId))
      .limit(1);
    
    if (!friendship.length) {
      return NextResponse.json(
        { error: 'Friendship not found' },
        { status: 404 }
      );
    }
    
    // Перевіряємо, чи користувач має право оновлювати цю дружбу
    // (тільки отримувач запиту може його прийняти або відхилити)
    if (friendship[0].friendEmail.toLowerCase() !== normalizedUserEmail) {
      return NextResponse.json(
        { error: 'You are not authorized to update this friendship' },
        { status: 403 }
      );
    }
    
    // Перевіряємо поточний статус
    if (friendship[0].status !== 'pending') {
      return NextResponse.json(
        { error: 'This friendship is not pending' },
        { status: 400 }
      );
    }
    
    // Оновлюємо статус дружби
    const updatedFriendship = await db.update(friendsTable)
      .set({ 
        status: status,
        updatedAt: new Date()
      })
      .where(eq(friendsTable.id, friendshipId))
      .returning();
    
    // Трансформуємо відповідь для клієнта
    const result = {
      ...updatedFriendship[0],
      userId: updatedFriendship[0].userEmail,
      friendId: updatedFriendship[0].friendEmail,
      friend: {
        id: updatedFriendship[0].userEmail,
        email: updatedFriendship[0].userEmail,
        display_name: updatedFriendship[0].userEmail.split('@')[0]
      }
    };
    
    return NextResponse.json({
      success: true,
      message: `Friend request ${status}`,
      friendship: result
    });
  } catch (error) {
    console.error('Error updating friendship:', error);
    return NextResponse.json(
      { error: 'Failed to update friendship' },
      { status: 500 }
    );
  }
}

// DELETE - Видалення дружби або скасування запиту
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
    
    if (authError || !user || !user.email) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    const friendshipId = parseInt(params.id, 10);
    
    if (isNaN(friendshipId)) {
      return NextResponse.json(
        { error: 'Invalid friendship ID' },
        { status: 400 }
      );
    }
    
    // Нормалізуємо email користувача
    const normalizedUserEmail = user.email.toLowerCase().trim();
    
    // Знаходимо дружбу за ID
    const friendship = await db.select()
      .from(friendsTable)
      .where(eq(friendsTable.id, friendshipId))
      .limit(1);
    
    if (!friendship.length) {
      return NextResponse.json(
        { error: 'Friendship not found' },
        { status: 404 }
      );
    }
    
    // Перевіряємо, чи користувач має право видаляти цю дружбу
    // (обидва користувачі можуть видалити дружбу)
    if (friendship[0].userEmail.toLowerCase() !== normalizedUserEmail && 
        friendship[0].friendEmail.toLowerCase() !== normalizedUserEmail) {
      return NextResponse.json(
        { error: 'You are not authorized to delete this friendship' },
        { status: 403 }
      );
    }
    
    // Видаляємо дружбу
    await db.delete(friendsTable)
      .where(eq(friendsTable.id, friendshipId));
    
    return NextResponse.json({
      success: true,
      message: 'Friendship deleted'
    });
  } catch (error) {
    console.error('Error deleting friendship:', error);
    return NextResponse.json(
      { error: 'Failed to delete friendship' },
      { status: 500 }
    );
  }
}