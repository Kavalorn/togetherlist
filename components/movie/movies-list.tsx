import { Loader2 } from 'lucide-react'
import React from 'react'
import { MovieCard } from './movie-card'
import { Movie } from '@/lib/tmdb'

type MoviesListProps = {
    isLoading: boolean,
    movies: Movie[],
    emptyPlaceholder?: React.ReactNode
}

export const MoviesList = ({isLoading, movies = [], emptyPlaceholder = "Пустий список"}: MoviesListProps) => {
  return (
    <div>
    {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : movies && movies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{emptyPlaceholder}</p>
        </div>
      )}
      </div>
  )
}