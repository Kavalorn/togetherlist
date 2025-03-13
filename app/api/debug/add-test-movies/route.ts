// app/api/debug/add-test-movies/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailWatchlistTable } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  try {
    const userEmail = request.nextUrl.searchParams.get('email');
    if (!userEmail) {
      return NextResponse.json({
        error: 'Email parameter is required'
      }, { status: 400 });
    }
    
    // Додаємо тестові фільми
    const movies = [
      {
        movieId: 550,
        title: "Бійцівський клуб",
        posterPath: "/adw6Lq9FiC9zjYEpOqfq03ituwp.jpg",
        releaseDate: "1999-10-15",
        overview: "Службовець страждає від безсоння і відчуває себе нещасним...",
        voteAverage: 8.4,
      },
      {
        movieId: 278,
        title: "Втеча з Шоушенка",
        posterPath: "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
        releaseDate: "1994-09-23",
        overview: "Бухгалтера Енді Дюфрейна засуджують за вбивство дружини...",
        voteAverage: 8.7,
      },
      {
        movieId: 238,
        title: "Хрещений батько",
        posterPath: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
        releaseDate: "1972-03-14",
        overview: "Дон Віто Корлеоне — голова мафіозної сім'ї...",
        voteAverage: 8.7,
      }
    ];
    
    // Додаємо фільми до нової таблиці
    const results = [];
    for (const movie of movies) {
      const result = await db.insert(emailWatchlistTable)
        .values({
          userEmail: userEmail.toLowerCase(),
          movieId: movie.movieId,
          title: movie.title,
          posterPath: movie.posterPath,
          releaseDate: movie.releaseDate,
          overview: movie.overview,
          voteAverage: movie.voteAverage,
          createdAt: new Date()
        })
        .onConflictDoNothing()
        .returning();
      
      results.push(result);
    }
    
    return NextResponse.json({
      success: true,
      message: `Added test movies for user ${userEmail}`,
      results
    });
  } catch (error) {
    console.error('Error adding test movies:', error);
    return NextResponse.json({
      error: 'Failed to add test movies'
    }, { status: 500 });
  }
}