import { pgTable, serial, integer, text, timestamp, real, uniqueIndex, boolean, primaryKey } from 'drizzle-orm/pg-core';

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

// Нова схема для управління друзями
export const friendsTable = pgTable('friends', {
  id: serial('id').primaryKey(),
  userEmail: text('user_email').notNull(),
  friendEmail: text('friend_email').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
}, (table) => {
  return {
    friendshipIdx: uniqueIndex('friendship_idx').on(table.userEmail, table.friendEmail),
  }
});


export const emailWatchlistTable = pgTable('email_watchlist', {
  id: serial('id').primaryKey(),
  userEmail: text('user_email').notNull(),
  movieId: integer('movie_id').notNull(),
  title: text('title').notNull(),
  posterPath: text('poster_path'),
  releaseDate: text('release_date'),
  overview: text('overview'),
  voteAverage: real('vote_average'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
}, (table) => {
  return {
    movieIdIdx: uniqueIndex('email_movie_id_idx').on(table.movieId, table.userEmail),
  }
});

// Типи на основі схеми
export type Watchlist = typeof watchlistTable.$inferSelect;
export type NewWatchlistEntry = typeof watchlistTable.$inferInsert;

export type Friend = typeof friendsTable.$inferSelect;
export type NewFriend = typeof friendsTable.$inferInsert;

export type EmailWatchlist = typeof emailWatchlistTable.$inferSelect;
export type NewEmailWatchlistEntry = typeof emailWatchlistTable.$inferInsert;