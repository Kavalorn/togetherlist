import { NextRequest, NextResponse } from 'next/server';
import { tmdbApi } from '@/lib/tmdb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: movieId } = params;
    const id = parseInt(movieId, 10);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Невірний ID фільму' },
        { status: 400 }
      );
    }
    
    const data = await tmdbApi.getMovieProviders(id);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Помилка при отриманні провайдерів для фільму:', error);
    return NextResponse.json(
      { error: 'Не вдалося отримати провайдерів для фільму' },
      { status: 500 }
    );
  }
}