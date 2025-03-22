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
        { error: 'Invalid movie ID' },
        { status: 400 }
      );
    }
    
    const data = await tmdbApi.getMovieDetails(id);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching movie details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch movie details' },
      { status: 500 }
    );
  }
}