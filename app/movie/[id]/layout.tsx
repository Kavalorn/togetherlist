import { Metadata } from 'next';

async function getMovieData(id: string) {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.TMDB_API_KEY}&language=uk`, { 
      next: { revalidate: 3600 } // Кешировать на 1 час
    });
    
    if (!res.ok) {
      return null;
    }
    
    return res.json();
  } catch (error) {
    console.error('Error fetching movie data for metadata:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const id = params.id;
  const movie = await getMovieData(id);
  
  if (!movie) {
    return {
      title: 'Фільм не знайдено | WatchPick',
      description: 'Інформація про фільм не знайдена',
    };
  }
  
  const title = movie.title;
  const description = movie.overview 
    ? movie.overview.substring(0, 160) + (movie.overview.length > 160 ? '...' : '')
    : 'Детальна інформація про фільм на WatchPick';
    
  const releaseYear = movie.release_date 
    ? new Date(movie.release_date).getFullYear().toString()
    : '';
    
  const ogImage = movie.backdrop_path 
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
    : movie.poster_path 
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : undefined;
  
  return {
    title: `${title}${releaseYear ? ` (${releaseYear})` : ''} | WatchPick`,
    description,
    openGraph: {
      title: `${title}${releaseYear ? ` (${releaseYear})` : ''}`,
      description,
      images: ogImage ? [ogImage] : undefined,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title}${releaseYear ? ` (${releaseYear})` : ''}`,
      description,
    }
  };
}

export default function MovieLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}