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
        { error: 'Invalid person ID' },
        { status: 400 }
      );
    }
    
    const data = await tmdbApi.getPersonMovieCredits(id);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching person movie credits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch person movie credits' },
      { status: 500 }
    );
  }
}