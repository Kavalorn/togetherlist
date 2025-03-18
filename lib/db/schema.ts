// lib/db/schema.ts - Оновлення схеми з додаванням списків перегляду

import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  unique,
  pgEnum,
  real,
} from "drizzle-orm/pg-core";

// Таблиця для зберігання списків перегляду
export const watchlistsTable = pgTable(
  "watchlists",
  {
    id: serial("id").primaryKey(),
    userEmail: varchar("user_email", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    isDefault: boolean("is_default").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    color: varchar("color", { length: 50 }).default("#3b82f6"), // Колір для візуального відображення
    icon: varchar("icon", { length: 50 }).default("list"), // Назва іконки для відображення
    sortOrder: integer("sort_order").default(0), // Порядок сортування для відображення
  },
  (table) => ({
    // Унікальна комбінація користувача і назви списку
    uniqueNamePerUser: unique().on(table.userEmail, table.name),
  })
);

// Оновлена таблиця фільмів у списку перегляду
export const watchlistMoviesTable = pgTable(
  "watchlist_movies",
  {
    id: serial("id").primaryKey(),
    watchlistId: integer("watchlist_id").notNull(),
    userEmail: varchar("user_email", { length: 255 }).notNull(),
    movieId: integer("movie_id").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    posterPath: varchar("poster_path", { length: 255 }),
    releaseDate: varchar("release_date", { length: 20 }),
    overview: text("overview"),
    voteAverage: real("vote_average"),
    voteCount: integer("vote_count"),
    createdAt: timestamp("created_at").defaultNow(),
    notes: text("notes"), // Додаємо поле для користувацьких нотаток до фільму
    priority: integer("priority").default(0), // Пріоритет перегляду
  },
  (table) => ({
    // Унікальна комбінація списку та ID фільму
    uniqueMoviePerWatchlist: unique().on(table.watchlistId, table.movieId),
  })
);

// Існуюча таблиця для зворотної сумісності
// Це колишня таблиця списку перегляду, яку ми залишаємо для міграції
export const emailWatchlistTable = pgTable("email_watchlist", {
  id: serial("id").primaryKey(),
  userEmail: varchar("user_email", { length: 255 }).notNull(),
  movieId: integer("movie_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  posterPath: varchar("poster_path", { length: 255 }),
  releaseDate: varchar("release_date", { length: 20 }),
  overview: text("overview"),
  voteAverage: real("vote_average"),
  voteCount: integer("vote_count"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Таблиця переглянутих фільмів
export const watchedMoviesTable = pgTable("watched_movies", {
  id: serial("id").primaryKey(),
  userEmail: varchar("user_email", { length: 255 }).notNull(),
  movieId: integer("movie_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  posterPath: varchar("poster_path", { length: 255 }),
  releaseDate: varchar("release_date", { length: 20 }),
  overview: text("overview"),
  voteAverage: real("vote_average"),
  voteCount: integer("vote_count"),
  watchedAt: timestamp("watched_at").defaultNow(),
  comment: text("comment"),
  rating: integer("rating"),
});

// Таблиця улюблених акторів
export const favoriteActorsTable = pgTable("favorite_actors", {
  id: serial("id").primaryKey(),
  userEmail: varchar("user_email", { length: 255 }).notNull(),
  actorId: integer("actor_id").notNull(),
  actorName: varchar("actor_name", { length: 255 }).notNull(),
  profilePath: varchar("profile_path", { length: 255 }),
  knownForDepartment: varchar("known_for_department", { length: 100 }),
  popularity: real("popularity"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Таблиця друзів
export const friendsTable = pgTable("friends", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  userEmail: varchar("user_email", { length: 255 }).notNull(),
  friendId: varchar("friend_id", { length: 255 }),
  friendEmail: varchar("friend_email", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Типи на основі схеми
export type WatchlistMovies = typeof watchlistMoviesTable.$inferSelect;
export type NewWatchlistMovieEntry = typeof watchlistMoviesTable.$inferInsert;

export type Friend = typeof friendsTable.$inferSelect;
export type NewFriend = typeof friendsTable.$inferInsert;

export type EmailWatchlist = typeof emailWatchlistTable.$inferSelect;
export type NewEmailWatchlistEntry = typeof emailWatchlistTable.$inferInsert;

export type WatchedMovie = typeof watchedMoviesTable.$inferSelect;
export type NewWatchedMovie = typeof watchedMoviesTable.$inferInsert;

export type FavoriteActor = typeof favoriteActorsTable.$inferSelect;
export type NewFavoriteActor = typeof favoriteActorsTable.$inferInsert;