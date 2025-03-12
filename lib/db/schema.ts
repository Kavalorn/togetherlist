import { pgTable, serial, integer, text, timestamp, real, uniqueIndex } from 'drizzle-orm/pg-core';

// Схема таблиці списку перегляду для PostgreSQL
export const watchlistTable = pgTable('watchlist', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  movieId: integer('movie_id').notNull(),
  title: text('title').notNull(),
  posterPath: text('poster_path'),
  releaseDate: text('release_date'),
  overview: text('overview'),
  voteAverage: real('vote_average'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
}, (table) => {
  return {
    // Унікальний індекс для запобігання дублювання фільмів для одного користувача
    movieIdIdx: uniqueIndex('movie_id_user_id_idx').on(table.movieId, table.userId),
  }
});

// Типи на основі схеми
export type Watchlist = typeof watchlistTable.$inferSelect;
export type NewWatchlistEntry = typeof watchlistTable.$inferInsert;