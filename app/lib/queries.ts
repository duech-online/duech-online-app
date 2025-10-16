/**
 * Database query functions using Drizzle ORM
 */

import { eq, ilike, or, and, sql, SQL } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { db } from '@/app/lib/db';
import { words, meanings, users } from '@/app/lib/schema';
import { Word, SearchResult } from '@/app/lib/definitions';
import { dbWordToWord, dbWordToSearchResult } from '@/app/lib/transformers';

/**
 * Get a word by lemma with all its meanings
 * Returns in frontend-compatible format
 */
interface GetWordByLemmaOptions {
  includeDrafts?: boolean;
}

export async function getWordByLemma(
  lemma: string,
  options: GetWordByLemmaOptions = {}
): Promise<{ word: Word; letter: string; status: string; assignedTo: number | null } | null> {
  const { includeDrafts = false } = options;

  const whereCondition = includeDrafts
    ? eq(words.lemma, lemma)
    : and(eq(words.lemma, lemma), eq(words.status, 'published'));

  const result = await db.query.words.findFirst({
    where: whereCondition,
    with: {
      meanings: {
        orderBy: (meanings, { asc }) => [asc(meanings.number)],
      },
    },
  });

  if (!result) return null;

  return {
    word: dbWordToWord(result),
    letter: result.letter,
    status: result.status,
    assignedTo: result.assignedTo ?? null,
  };
}

/**
 * Advanced search with filters
 * Returns in frontend-compatible format
 */
export async function advancedSearch(params: {
  query?: string;
  categories?: string[];
  styles?: string[];
  origins?: string[];
  letter?: string;
  status?: string;
  assignedTo?: string[];
  limit?: number;
}): Promise<SearchResult[]> {
  const { query, categories, styles, origins, letter, status, assignedTo, limit = 50 } = params;

  const conditions: SQL[] = [];

  // Filter by status
  if (status !== undefined && status !== '') {
    conditions.push(eq(words.status, status));
  } else if (status === '') {
    // Empty string means public search - only show published
    conditions.push(eq(words.status, 'published'));
  }

  // Filter by assignedTo (OR within assignedTo values)
  if (assignedTo && assignedTo.length > 0) {
    const assignedToIds = assignedTo.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));
    if (assignedToIds.length > 0) {
      const assignedConditions = assignedToIds.map((id) => eq(words.assignedTo, id));
      conditions.push(or(...assignedConditions)!);
    }
  }

  // Text search in lemma or meaning
  if (query) {
    const searchPattern = `%${query}%`;
    conditions.push(or(ilike(words.lemma, searchPattern), ilike(meanings.meaning, searchPattern))!);
  }

  // Filter by letter (OR within letters - if multiple letters provided)
  if (letter) {
    conditions.push(eq(words.letter, letter.toLowerCase()));
  }

  // Filter by origins (OR within origins - any selected origin matches)
  if (origins && origins.length > 0) {
    const originConditions = origins.map((origin) => ilike(meanings.origin, `%${origin}%`));
    conditions.push(or(...originConditions)!);
  }

  // Filter by categories (OR within categories - any selected category matches)
  if (categories && categories.length > 0) {
    const categoryConditions = categories.map((cat) => sql`${cat} = ANY(${meanings.categories})`);
    conditions.push(or(...categoryConditions)!);
  }

  // Filter by styles (OR within styles - any selected style matches)
  if (styles && styles.length > 0) {
    const styleConditions = styles.map((style) => sql`${style} = ANY(${meanings.styles})`);
    conditions.push(or(...styleConditions)!);
  }

  // All conditions are combined with AND
  // Within each filter type (categories, styles, assignedTo), values are OR'ed
  // This means: (cat1 OR cat2) AND (style1 OR style2) AND letter AND query
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Execute query
  const results = await db
    .selectDistinctOn([words.id], {
      id: words.id,
      lemma: words.lemma,
      root: words.root,
      letter: words.letter,
      variant: words.variant,
      status: words.status,
      createdBy: words.createdBy,
      assignedTo: words.assignedTo,
      createdAt: words.createdAt,
      updatedAt: words.updatedAt,
    })
    .from(words)
    .leftJoin(meanings, eq(words.id, meanings.wordId))
    .where(whereClause)
    .limit(limit);

  // Get full word data with meanings and determine match type
  const wordsWithMeanings = await Promise.all(
    results.map(async (w) => {
      const fullWord = await db.query.words.findFirst({
        where: eq(words.id, w.id),
        with: {
          meanings: {
            orderBy: (meanings, { asc }) => [asc(meanings.number)],
          },
        },
      });

      // Determine match type
      let matchType: 'exact' | 'partial' | 'filter' = 'filter';
      if (query && fullWord) {
        const normalizedQuery = query.toLowerCase();
        const lemma = fullWord.lemma.toLowerCase();
        if (lemma === normalizedQuery) {
          matchType = 'exact';
        } else if (lemma.includes(normalizedQuery)) {
          matchType = 'partial';
        }
      }

      return { fullWord, matchType };
    })
  );

  return wordsWithMeanings
    .filter((w) => w.fullWord !== undefined)
    .map((w) => dbWordToSearchResult(w.fullWord!, w.matchType));
}

/**
 * USER AUTHENTICATION QUERIES
 */

/**
 * Find user by username
 */
export async function getUserByUsername(username: string) {
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Find user by email
 */
export async function getUserByEmail(email: string) {
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Verify password against bcrypt hash
 */
export async function verifyUserPassword(
  dbPasswordHash: string,
  password: string
): Promise<boolean> {
  return await bcrypt.compare(password, dbPasswordHash);
}

/**
 * Get all users (without sensitive data)
 */
export async function getUsers() {
  return await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
    })
    .from(users);
}
