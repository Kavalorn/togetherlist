import { NextRequest, NextResponse } from 'next/server';
import { tmdbApi } from '@/lib/tmdb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Невірний ID фільму' },
        { status: 400 }
      );
    }
    
    const data = await tmdbApi.getMovieVideos(id);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Помилка при отриманні відео для фільму:', error);
    return NextResponse.json(
      { error: 'Не вдалося отримати відео для фільму' },
      { status: 500 }
    );
  }
}