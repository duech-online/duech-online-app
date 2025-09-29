import { NextRequest, NextResponse } from 'next/server';
import { loadDictionaryServer } from '@/app/lib/dictionary-server';
import { SearchResult, Word } from '@/app/lib/definitions';
import { applyRateLimit } from '@/app/lib/rate-limiting';

const MAX_QUERY_LENGTH = 100;
const MAX_FILTER_OPTIONS = 10;
const MAX_LIMIT = 1000;

interface SearchFilters {
  query: string;
  categories: string[];
  styles: string[];
  origins: string[];
  letters: string[];
}

interface ParseSuccess {
  filters: SearchFilters;
  page: number;
  limit: number;
}

interface ParseError {
  errorResponse: NextResponse;
}

type ParseResult = ParseSuccess | ParseError;

const MATCH_ORDER: Record<SearchResult['matchType'], number> = {
  exact: 0,
  partial: 1,
  definition: 2,
  filter: 3,
};

export async function GET(request: NextRequest) {
  const rateLimitResult = await applyRateLimit(request);
  if (!rateLimitResult.success) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const parsed = parseSearchParams(searchParams);

    if ('errorResponse' in parsed) {
      return parsed.errorResponse;
    }

    const { filters, page, limit } = parsed;

    const dictionaries = await loadDictionaryServer();
    const results: SearchResult[] = [];

    dictionaries.forEach((dict) => {
      dict.value.forEach((letterGroup) => {
        if (filters.letters.length > 0 && !filters.letters.includes(letterGroup.letter)) {
          return;
        }

        letterGroup.values.forEach((word) => {
          const evaluation = evaluateWord(word, filters);

          if (!evaluation.matches) {
            return;
          }

          results.push({
            word,
            letter: letterGroup.letter,
            matchType: evaluation.matchType,
          });
        });
      });
    });

    const sortedResults = results.sort(
      (a, b) => MATCH_ORDER[a.matchType] - MATCH_ORDER[b.matchType]
    );

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = sortedResults.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: {
        results: paginatedResults,
        pagination: {
          page,
          limit,
          total: sortedResults.length,
          totalPages: Math.ceil(sortedResults.length / limit),
          hasNext: endIndex < sortedResults.length,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error in search API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function parseSearchParams(searchParams: URLSearchParams): ParseResult {
  const rawQuery = searchParams.get('q') ?? '';
  const query = rawQuery.trim();

  if (query.length > MAX_QUERY_LENGTH) {
    return {
      errorResponse: NextResponse.json({ error: 'Query too long' }, { status: 400 }),
    };
  }

  const categories = parseList(searchParams.get('categories'));
  const styles = parseList(searchParams.get('styles'));
  const origins = parseList(searchParams.get('origins'));
  const letters = parseList(searchParams.get('letters'));

  if (
    categories.length > MAX_FILTER_OPTIONS ||
    styles.length > MAX_FILTER_OPTIONS ||
    origins.length > MAX_FILTER_OPTIONS ||
    letters.length > MAX_FILTER_OPTIONS
  ) {
    return {
      errorResponse: NextResponse.json({ error: 'Too many filter options' }, { status: 400 }),
    };
  }

  const page = Math.max(parseInteger(searchParams.get('page'), 1), 1);
  const limit = Math.max(Math.min(parseInteger(searchParams.get('limit'), 20), MAX_LIMIT), 1);

  if (!Number.isFinite(page) || !Number.isFinite(limit)) {
    return {
      errorResponse: NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400 }),
    };
  }

  const filters: SearchFilters = {
    query,
    categories,
    styles,
    origins,
    letters,
  };

  return { filters, page, limit };
}

function parseList(value: string | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseInteger(input: string | null, fallback: number): number {
  if (!input) return fallback;
  const parsed = parseInt(input, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function evaluateWord(
  word: Word,
  filters: SearchFilters
): { matches: boolean; matchType: SearchResult['matchType'] } {
  let matchType: SearchResult['matchType'] = 'filter';

  if (filters.query) {
    const normalizedQuery = filters.query.toLowerCase();
    const lemma = word.lemma.toLowerCase();

    if (lemma === normalizedQuery) {
      matchType = 'exact';
    } else if (lemma.includes(normalizedQuery)) {
      matchType = 'partial';
    } else {
      const hasDefinitionMatch = word.values.some((def) =>
        def.meaning.toLowerCase().includes(normalizedQuery)
      );

      if (!hasDefinitionMatch) {
        return { matches: false, matchType };
      }

      matchType = 'definition';
    }
  }

  if (filters.categories.length > 0) {
    const hasCategory = word.values.some((def) =>
      def.categories.some((category) => filters.categories.includes(category))
    );

    if (!hasCategory) {
      return { matches: false, matchType };
    }
  }

  if (filters.styles.length > 0) {
    const hasStyle = word.values.some(
      (def) =>
        Array.isArray(def.styles) && def.styles.some((style) => filters.styles.includes(style))
    );

    if (!hasStyle) {
      return { matches: false, matchType };
    }
  }

  if (filters.origins.length > 0) {
    const hasOrigin = word.values.some(
      (def) =>
        typeof def.origin === 'string' &&
        filters.origins.some((origin) => def.origin!.toLowerCase().includes(origin.toLowerCase()))
    );

    if (!hasOrigin) {
      return { matches: false, matchType };
    }
  }

  return { matches: true, matchType };
}
