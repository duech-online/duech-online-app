/**
 * Database query functions using Drizzle ORM
 */

import { eq, ilike, or, and, sql, SQL } from 'drizzle-orm';
import { db } from './db';
import { words, meanings } from './schema';
import { Word, SearchResult } from './definitions';
import { dbWordToWord, dbWordToSearchResult } from './transformers';

/**
 * Get a word by lemma with all its meanings
 * Returns in frontend-compatible format
 */
export async function getWordByLemma(lemma: string): Promise<{ word: Word; letter: string } | null> {
  const result = await db.query.words.findFirst({
    where: and(eq(words.lemma, lemma), eq(words.status, 'published')),
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
        ...dbWordToSearchResult(w),
        matchType: 'definition' as const,
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
  origin?: string;
  letter?: string;
  limit?: number;
}): Promise<SearchResult[]> {
  const { query, categories, styles, origin, letter, limit = 50 } = params;

  const conditions: SQL[] = [eq(words.status, 'published')];

  // Text search in lemma or meaning
  if (query) {
    const searchPattern = `%${query}%`;
    conditions.push(or(ilike(words.lemma, searchPattern), ilike(meanings.meaning, searchPattern))!);
  }

  // Filter by letter
  if (letter) {
    conditions.push(eq(words.letter, letter.toLowerCase()));
  }

  // Filter by origin
  if (origin) {
    conditions.push(ilike(meanings.origin, `%${origin}%`));
  }

  // Filter by categories
  if (categories && categories.length > 0) {
    const categoryConditions = categories.map((cat) => sql`${cat} = ANY(${meanings.categories})`);
    conditions.push(or(...categoryConditions)!);
  }

  // Filter by styles
  if (styles && styles.length > 0) {
    const styleConditions = styles.map((style) => sql`${style} = ANY(${meanings.styles})`);
    conditions.push(or(...styleConditions)!);
  }

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
    .where(and(...conditions))
    .limit(limit);

  // Get full word data with meanings
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
      return fullWord;
    })
  );

  return wordsWithMeanings.filter((w) => w !== undefined).map((w) => dbWordToSearchResult(w!));
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
