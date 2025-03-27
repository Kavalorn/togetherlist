import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';
export const contentType = 'image/png';
export const size = {
  width: 1200,
  height: 630,
};

export default async function og({ params }: { params: { id: string } }) {
  try {
    // Получаем ID фильма
    const id = params.id;
    
    // Получаем данные о фильме из API
    const movieRes = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.TMDB_API_KEY}&language=uk`, { 
      cache: 'force-cache' 
    });
    
    if (!movieRes.ok) {
      return defaultOgImage('Фільм не знайдено');
    }
    
    const movie = await movieRes.json();
    
    // Получаем постер фильма
    const posterPath = movie.poster_path;
    const backdropPath = movie.backdrop_path;
    
    // Если нет постера или фона, используем стандартное изображение
    if (!posterPath && !backdropPath) {
      return defaultOgImage(movie.title);
    }
    
    // Загружаем изображение фона (если есть) или постер
    const imagePath = backdropPath || posterPath;
    const imageUrl = `https://image.tmdb.org/t/p/w1280${imagePath}`;
    
    // Создаем OpenGraph изображение
    return new ImageResponse(
      (
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            background: 'black',
            color: 'white',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Фоновое изображение с затемнением */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'brightness(0.5)',
            }}
          />
          
          {/* Основное содержимое */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'row',
              padding: '40px',
              alignItems: 'center',
              height: '100%',
              gap: '40px',
              zIndex: 1,
              fontWeight: 'bold',
            }}
          >
            {/* Постер фильма */}
            {posterPath && (
              <div
                style={{
                  display: 'flex',
                  flexShrink: 0,
                  width: '300px',
                  height: '450px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                }}
              >
                <img
                  src={`https://image.tmdb.org/t/p/w500${posterPath}`}
                  alt={movie.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </div>
            )}
            
            {/* Информация о фильме */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                gap: '20px',
              }}
            >
              <div
                style={{
                  fontSize: '48px',
                  lineHeight: 1.2,
                  textShadow: '0 2px 10px rgba(0,0,0,0.7)',
                }}
              >
                {movie.title}
              </div>
              
              {movie.tagline && (
                <div
                  style={{
                    fontSize: '24px',
                    color: '#ccc',
                    textShadow: '0 2px 6px rgba(0,0,0,0.7)',
                  }}
                >
                  {movie.tagline}
                </div>
              )}
              
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '15px',
                  color: '#eee',
                  fontSize: '20px',
                }}
              >
                {movie.release_date && (
                  <div>
                    {new Date(movie.release_date).getFullYear()}
                  </div>
                )}
                {movie.vote_average > 0 && (
                  <div>
                    ⭐ {movie.vote_average.toFixed(1)}
                  </div>
                )}
              </div>
              
              {movie.overview && (
                <div
                  style={{
                    fontSize: '22px',
                    color: '#eee',
                    maxWidth: '700px',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    textShadow: '0 1px 4px rgba(0,0,0,0.7)',
                  }}
                >
                  {movie.overview.slice(0, 180)}
                  {movie.overview.length > 180 ? '...' : ''}
                </div>
              )}
              
              <div
                style={{
                  marginTop: 'auto',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#fff',
                  textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                }}
              >
                WatchPick
              </div>
            </div>
          </div>
        </div>
      ),
      size
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return defaultOgImage('Фільм');
  }
}

// Функция для создания стандартного OG-изображения
function defaultOgImage(title: string) {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to bottom right, #3b82f6, #1e3a8a)',
          color: 'white',
          fontFamily: 'sans-serif',
          padding: '40px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: '48px',
            fontWeight: 'bold',
            marginBottom: '20px',
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: '24px',
          }}
        >
          WatchPick - Ваш путівник у світі кіно
        </div>
      </div>
    ),
    size
  );
}