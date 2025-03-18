// app/api/watchlists/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { db } from '@/lib/db';
import { watchlistsTable } from '@/lib/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';

// GET - Отримання всіх списків перегляду користувача
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
    
    // Отримуємо всі списки перегляду для даного користувача
    const watchlists = await db.select()
      .from(watchlistsTable)
      .where(eq(watchlistsTable.userEmail, user.email.toLowerCase()))
      .orderBy(asc(watchlistsTable.sortOrder), desc(watchlistsTable.createdAt));
    
    // Перевіряємо, чи є у користувача список за замовчуванням
    const hasDefaultWatchlist = watchlists.some(list => list.isDefault);
    
    // Якщо немає жодного списку або відсутній список за замовчуванням, створюємо його
    if (watchlists.length === 0 || !hasDefaultWatchlist) {
      const defaultWatchlist = await db.insert(watchlistsTable)
        .values({
          userEmail: user.email.toLowerCase(),
          name: "Невідсортоване",
          description: "Фільми без категорії",
          isDefault: true,
          color: "#3b82f6", // Синій колір
          icon: "inbox", // Іконка inbox
          sortOrder: 0
        })
        .returning();
      
      // Додаємо новий список до результату
      watchlists.push(defaultWatchlist[0]);
    }
    
    return NextResponse.json(watchlists);
  } catch (error) {
    console.error('Error fetching watchlists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watchlists' },
      { status: 500 }
    );
  }
}

// POST - Створення нового списку перегляду
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
    
    // Отримуємо дані з тіла запиту
    const { name, description, color, icon } = await request.json();
    
    // Перевірка наявності обов'язкового поля
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    // Перевіряємо, чи вже існує список з такою назвою для цього користувача
    const existingWatchlist = await db.select()
      .from(watchlistsTable)
      .where(
        and(
          eq(watchlistsTable.userEmail, user.email.toLowerCase()),
          eq(watchlistsTable.name, name)
        )
      )
      .limit(1);
    
    if (existingWatchlist.length > 0) {
      return NextResponse.json(
        { error: 'Watchlist with this name already exists' },
        { status: 400 }
      );
    }
    
    // Знаходимо максимальний порядок сортування для поточного користувача
    const maxOrderResult = await db.select({ maxOrder: watchlistsTable.sortOrder })
      .from(watchlistsTable)
      .where(eq(watchlistsTable.userEmail, user.email.toLowerCase()))
      .orderBy(desc(watchlistsTable.sortOrder))
      .limit(1);
    
    const nextOrder = maxOrderResult.length > 0 ? (maxOrderResult[0].maxOrder + 1) : 0;
    
    // Створюємо новий список перегляду
    const newWatchlist = await db.insert(watchlistsTable)
      .values({
        userEmail: user.email.toLowerCase(),
        name,
        description: description || '',
        color: color || '#3b82f6',
        icon: icon || 'list',
        isDefault: false,
        sortOrder: nextOrder
      })
      .returning();
    
    return NextResponse.json(newWatchlist[0]);
  } catch (error) {
    console.error('Error creating watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to create watchlist' },
      { status: 500 }
    );
  }
}