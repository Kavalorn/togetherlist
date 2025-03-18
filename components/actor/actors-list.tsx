// components/actor/actors-list.tsx
import { Loader2 } from 'lucide-react'
import React from 'react'
import { ActorCard } from './actor-card'
import { Person } from '@/lib/tmdb'

type ActorsListProps = {
    isLoading: boolean,
    actors: Person[],
    emptyPlaceholder?: React.ReactNode
}

export const ActorsList = ({isLoading, actors = [], emptyPlaceholder = "Пустий список"}: ActorsListProps) => {
  return (
    <div>
    {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : actors && actors.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {actors.map((actor) => (
            <ActorCard key={actor.id} actor={actor} />
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