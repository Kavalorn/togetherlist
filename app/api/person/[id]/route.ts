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
        { error: 'Invalid person ID' },
        { status: 400 }
      );
    }
    
    const data = await tmdbApi.getPersonDetails(id);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching person details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch person details' },
      { status: 500 }
    );
  }
}