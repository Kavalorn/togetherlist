// app/api/actors/popular/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { tmdbApi } from '@/lib/tmdb';

export async function GET(request: NextRequest) {
  try {
    // Отримуємо параметри запиту
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || '1';
    
    // Виконуємо запит для отримання популярних акторів через TMDB API
    const data = await tmdbApi.getPopularPeople(parseInt(page, 10));
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching popular actors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch popular actors' },
      { status: 500 }
    );
  }
}