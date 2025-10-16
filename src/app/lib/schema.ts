/**
 * Drizzle ORM Schema for DUECh PostgreSQL Database
 */

import { pgTable, serial, text, timestamp, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('lexicographer'), // lexicographer, editor, admin, superadmin
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Words table
export const words = pgTable('words', {
  id: serial('id').primaryKey(),
  lemma: text('lemma').notNull(),
  root: text('root'),
  letter: text('letter').notNull(), // Single character (a-z, ñ)
  variant: text('variant'),
  status: text('status').notNull().default('draft'), // draft, in_review, reviewed, rejected, published
  createdBy: integer('created_by').references(() => users.id),
  assignedTo: integer('assigned_to').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Meanings table (definitions of words)
export const meanings = pgTable('meanings', {
  id: serial('id').primaryKey(),
  wordId: integer('word_id')
    .notNull()
    .references(() => words.id, { onDelete: 'cascade' }),
  number: integer('number').notNull(),
  origin: text('origin'),
  meaning: text('meaning').notNull(),
  observation: text('observation'),
  remission: text('remission'), // Cross-reference to another word
  categories: text('categories').array(), // Array: ['m', 'f', 'adj', 'tr', 'intr']
  styles: text('styles').array(), // Array: ['espon', 'vulgar', 'hist', 'fest']
  examples: jsonb('examples').$type<
    Array<{
      value: string;
      author?: string;
      title?: string;
      source?: string;
      date?: string;
      page?: string;
    }>
  >(), // JSONB field with examples
  expressions: text('expressions').array(), // Array of expression strings
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Notes table (editorial comments)
export const notes = pgTable('notes', {
  id: serial('id').primaryKey(),
  wordId: integer('word_id')
    .notNull()
    .references(() => words.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id),
  note: text('note').notNull(),
  resolved: boolean('resolved').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const wordsRelations = relations(words, ({ many, one }) => ({
  meanings: many(meanings),
  notes: many(notes),
  creator: one(users, {
    fields: [words.createdBy],
    references: [users.id],
  }),
  assignee: one(users, {
    fields: [words.assignedTo],
    references: [users.id],
  }),
}));

export const meaningsRelations = relations(meanings, ({ one }) => ({
  word: one(words, {
    fields: [meanings.wordId],
    references: [words.id],
  }),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  word: one(words, {
    fields: [notes.wordId],
    references: [words.id],
  }),
  user: one(users, {
    fields: [notes.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  createdWords: many(words),
  notes: many(notes),
}));
