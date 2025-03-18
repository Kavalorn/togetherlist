import { NextRequest, NextResponse } from 'next/server';
import { tmdbApi } from '@/lib/tmdb';

export async function GET(request: NextRequest) {
  try {
    // Отримуємо параметри запиту
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const page = searchParams.get('page') || '1';
    
    // Перевіряємо наявність запиту
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }
    
    // Виконуємо пошук акторів через TMDB API
    const data = await tmdbApi.searchPeople(query, parseInt(page, 10));
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching actors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch actors' },
      { status: 500 }
    );
  }
}