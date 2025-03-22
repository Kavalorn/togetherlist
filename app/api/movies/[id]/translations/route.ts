import { NextRequest, NextResponse } from 'next/server';
import { tmdbApi } from '@/lib/tmdb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
        const { id: someId } = await params;
    const id = parseInt(someId, 10);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Невірний ID фільму' },
        { status: 400 }
      );
    }
    
    const data = await tmdbApi.getMovieTranslations(id);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Помилка при отриманні перекладів для фільму:', error);
    return NextResponse.json(
      { error: 'Не вдалося отримати переклади для фільму' },
      { status: 500 }
    );
  }
}