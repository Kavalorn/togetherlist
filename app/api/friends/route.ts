import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { db } from '@/lib/db';
import { friendsTable } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';

// GET - Отримання списку друзів для поточного користувача
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
    
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'accepted';
    
    let friendsData;
    
    if (status === 'all') {
      friendsData = await db.select()
        .from(friendsTable)
        .where(
          or(
            eq(friendsTable.userEmail, user.email),
            eq(friendsTable.friendEmail, user.email)
          )
        )
        .orderBy(friendsTable.createdAt);
    } else if (status === 'pending') {
      friendsData = await db.select()
        .from(friendsTable)
        .where(
          and(
            eq(friendsTable.friendEmail, user.email),
            eq(friendsTable.status, 'pending')
          )
        )
        .orderBy(friendsTable.createdAt);
    } else if (status === 'sent') {
      friendsData = await db.select()
        .from(friendsTable)
        .where(
          and(
            eq(friendsTable.userEmail, user.email),
            eq(friendsTable.status, 'pending')
          )
        )
        .orderBy(friendsTable.createdAt);
    } else {
      friendsData = await db.select()
        .from(friendsTable)
        .where(
          and(
            or(
              eq(friendsTable.userEmail, user.email),
              eq(friendsTable.friendEmail, user.email)
            ),
            eq(friendsTable.status, 'accepted')
          )
        )
        .orderBy(friendsTable.createdAt);
    }
    
    // Трансформуємо дані для фронтенду
    const transformedData = friendsData.map(friendship => {
      const isOutgoing = friendship.userEmail === user.email;
      const friendEmail = isOutgoing ? friendship.friendEmail : friendship.userEmail;
      
      return {
        id: friendship.id,
        userId: user.id,
        friendId: friendEmail, // Використовуємо email замість ID
        status: friendship.status,
        createdAt: friendship.createdAt,
        updatedAt: friendship.updatedAt,
        friend: { 
          id: friendEmail, // Використовуємо email як ID
          email: friendEmail,
          display_name: friendEmail.split('@')[0] // Простий спосіб отримати ім'я
        },
        direction: isOutgoing ? 'outgoing' : 'incoming'
      };
    });
    
    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friends' },
      { status: 500 }
    );
  }
}

// POST - Додавання друга або надсилання запиту
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
    
    const { friendEmail } = await request.json();
    
    if (!friendEmail) {
      return NextResponse.json(
        { error: 'Friend email is required' },
        { status: 400 }
      );
    }
    
    // Нормалізуємо email
    const normalizedFriendEmail = friendEmail.toLowerCase().trim();
    const normalizedUserEmail = user.email.toLowerCase().trim();
    
    // Перевіряємо, чи користувач не намагається додати себе
    if (normalizedUserEmail === normalizedFriendEmail) {
      return NextResponse.json(
        { error: 'You cannot add yourself as a friend' },
        { status: 400 }
      );
    }
    
    // Перевіряємо, чи існує користувач з таким email в системі аутентифікації
    // Тут ми просто припускаємо, що користувач існує, оскільки у нас немає простого способу перевірити
    // Якщо потрібна обов'язкова перевірка, можна використати окремий запит до Supabase аналогічно тому,
    // що ми робимо для перевірки аутентифікації вище

    // Перевіряємо, чи вже існує дружба або запит
    const existingFriendship = await db.select()
      .from(friendsTable)
      .where(
        or(
          and(
            eq(friendsTable.userEmail, normalizedUserEmail),
            eq(friendsTable.friendEmail, normalizedFriendEmail)
          ),
          and(
            eq(friendsTable.userEmail, normalizedFriendEmail),
            eq(friendsTable.friendEmail, normalizedUserEmail)
          )
        )
      )
      .limit(1);
    
    if (existingFriendship.length > 0) {
      const friendship = existingFriendship[0];
      
      // Якщо дружба вже прийнята
      if (friendship.status === 'accepted') {
        return NextResponse.json(
          { error: 'You are already friends with this user' },
          { status: 400 }
        );
      }
      
      // Якщо це вхідний запит, то приймаємо його
      if (friendship.friendEmail === normalizedUserEmail && friendship.status === 'pending') {
        const updatedFriendship = await db.update(friendsTable)
          .set({ 
            status: 'accepted',
            updatedAt: new Date()
          })
          .where(eq(friendsTable.id, friendship.id))
          .returning();
        
        return NextResponse.json({
          success: true,
          message: 'Friend request accepted',
          friendship: {
            ...updatedFriendship[0],
            userId: user.id,
            friendId: normalizedFriendEmail,
            friend: {
              id: normalizedFriendEmail,
              email: normalizedFriendEmail,
              display_name: normalizedFriendEmail.split('@')[0]
            }
          }
        });
      }
      
      // Якщо це вихідний запит, повідомляємо що запит вже надіслано
      return NextResponse.json(
        { error: 'Friend request already sent' },
        { status: 400 }
      );
    }
    
    // Створюємо новий запит на дружбу
    const newFriendship = await db.insert(friendsTable)
      .values({
        userEmail: normalizedUserEmail,
        userId: user.id,  // Додаємо ID поточного користувача
        friendEmail: normalizedFriendEmail,
        friendId: null,  // ID друга ми не знаємо, тому null
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return NextResponse.json({
      success: true,
      message: 'Friend request sent',
      friendship: {
        ...newFriendship[0],
        userId: user.id,
        friendId: normalizedFriendEmail,
        friend: {
          id: normalizedFriendEmail,
          email: normalizedFriendEmail,
          display_name: normalizedFriendEmail.split('@')[0]
        }
      }
    });
  } catch (error) {
    console.error('Error adding friend:', error);
    return NextResponse.json(
      { error: 'Failed to add friend' },
      { status: 500 }
    );
  }
}