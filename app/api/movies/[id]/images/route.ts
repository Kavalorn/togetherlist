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
        { error: 'Invalid movie ID' },
        { status: 400 }
      );
    }
    
    const data = await tmdbApi.getMovieImages(id);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching movie images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch movie images' },
      { status: 500 }
    );
  }
}