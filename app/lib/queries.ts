/**
 * Database query functions using Drizzle ORM
 */

import { eq, ilike, or, and, sql, SQL } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { db } from './db';
import { words, meanings, users } from './schema';
import { Word, SearchResult } from './definitions';
import { dbWordToWord, dbWordToSearchResult } from './transformers';

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
 * Get a random published word
 * Returns in frontend-compatible format
 */
export async function getRandomWord(): Promise<{ word: Word; letter: string } | null> {
  const result = await db
    .select()
    .from(words)
    .where(eq(words.status, 'published'))
    .orderBy(sql`RANDOM()`)
    .limit(1);

  if (result.length === 0) return null;

  const wordWithMeanings = await db.query.words.findFirst({
    where: eq(words.id, result[0].id),
    with: {
      meanings: {
        orderBy: (meanings, { asc }) => [asc(meanings.number)],
      },
    },
  });

  if (!wordWithMeanings) return null;

  return {
    word: dbWordToWord(wordWithMeanings),
    letter: wordWithMeanings.letter,
  };
}

/**
 * Search words and meanings by text query
 * Returns in frontend-compatible format
 */
export async function searchWords(query: string, limit = 20): Promise<SearchResult[]> {
  const searchPattern = `%${query}%`;

  // Search in lemmas (exact match gets higher priority)
  const lemmaMatches = await db.query.words.findMany({
    where: and(eq(words.status, 'published'), ilike(words.lemma, searchPattern)),
    with: {
      meanings: {
        orderBy: (meanings, { asc }) => [asc(meanings.number)],
      },
    },
    limit: limit,
  });

  // Search in meanings
  const meaningMatches = await db
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
    .innerJoin(meanings, eq(words.id, meanings.wordId))
    .where(and(eq(words.status, 'published'), ilike(meanings.meaning, searchPattern)))
    .limit(limit);

  // Get full word data for meaning matches
  const meaningMatchesWithData = await Promise.all(
    meaningMatches.map(async (w) => {
      const fullWord = await db.query.words.findFirst({
        where: eq(words.id, w.id),
        with: {
          meanings: {
            orderBy: (meanings, { asc }) => [asc(meanings.number)],
          },
        },
      });
      return fullWord;
    })
  );

  // Combine and deduplicate results
  const allMatches = new Map();

  lemmaMatches.forEach((w) => {
    if (w) {
      const exactMatch = w.lemma.toLowerCase() === query.toLowerCase();
      allMatches.set(w.lemma, {
        ...dbWordToSearchResult(w),
        matchType: exactMatch ? 'exact' : ('partial' as const),
      });
    }
  });

  meaningMatchesWithData.forEach((w) => {
    if (w && !allMatches.has(w.lemma)) {
      allMatches.set(w.lemma, {
        ...dbWordToSearchResult(w, 'filter'),
        matchType: 'filter' as const,
      });
    }
  });

  return Array.from(allMatches.values()).slice(0, limit);
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
 * Get words by letter with pagination
 */
export async function getWordsByLetter(letter: string, page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const results = await db.query.words.findMany({
    where: and(eq(words.letter, letter.toLowerCase()), eq(words.status, 'published')),
    with: {
      meanings: {
        orderBy: (meanings, { asc }) => [asc(meanings.number)],
      },
    },
    limit: limit,
    offset: offset,
    orderBy: (words, { asc }) => [asc(words.lemma)],
  });

  // Get total count
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(words)
    .where(and(eq(words.letter, letter.toLowerCase()), eq(words.status, 'published')));

  const total = Number(totalResult[0].count);

  return {
    words: results.map((w) => ({ word: dbWordToWord(w), letter: w.letter })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get metadata about the dictionary
 */
export async function getDictionaryMetadata() {
  const stats = await db
    .select({
      totalWords: sql<number>`COUNT(DISTINCT ${words.id})`,
      totalMeanings: sql<number>`COUNT(DISTINCT ${meanings.id})`,
    })
    .from(words)
    .leftJoin(meanings, eq(words.id, meanings.wordId))
    .where(eq(words.status, 'published'));

  const letterCounts = await db
    .select({
      letter: words.letter,
      count: sql<number>`count(*)`,
    })
    .from(words)
    .where(eq(words.status, 'published'))
    .groupBy(words.letter)
    .orderBy(words.letter);

  const wordsByLetter: Record<string, number> = {};
  letterCounts.forEach((lc) => {
    wordsByLetter[lc.letter] = Number(lc.count);
  });

  return {
    total_words: Number(stats[0].totalWords),
    total_meanings: Number(stats[0].totalMeanings),
    total_letters: letterCounts.length,
    words_by_letter: wordsByLetter,
  };
}

/**
 * Get all available letters with word counts
 */
export async function getAvailableLetters(): Promise<Array<{ letter: string; count: number }>> {
  const result = await db
    .select({
      letter: words.letter,
      count: sql<number>`count(*)`,
    })
    .from(words)
    .where(eq(words.status, 'published'))
    .groupBy(words.letter)
    .orderBy(words.letter);

  return result.map((r) => ({
    letter: r.letter,
    count: Number(r.count),
  }));
}

/**
 * USER AUTHENTICATION QUERIES
 */

/**
 * Find user by username
 */
export async function getUserByUsername(username: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Find user by email
 */
export async function getUserByEmail(email: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Create a new user with bcrypt password hashing
 */
export async function createDatabaseUser(
  username: string,
  email: string,
  password: string,
  role: string = 'lexicographer'
) {
  // Check if username or email already exists
  const existingByUsername = await getUserByUsername(username);
  if (existingByUsername) {
    throw new Error('Username already exists');
  }

  if (email) {
    const existingByEmail = await getUserByEmail(email);
    if (existingByEmail) {
      throw new Error('Email already exists');
    }
  }

  // Hash password with bcrypt (salt rounds: 10)
  const passwordHash = await bcrypt.hash(password, 10);

  // Insert user
  const result = await db
    .insert(users)
    .values({
      username,
      email: email || null,
      passwordHash,
      role,
    })
    .returning();

  return result[0];
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
