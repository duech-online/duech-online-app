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
  metaOnly: boolean;
}

interface ParseError {
  errorResponse: NextResponse;
}

type ParseResult = ParseSuccess | ParseError;

const MATCH_ORDER: Record<SearchResult['matchType'], number> = {
  exact: 0,
  partial: 1,
  filter: 2,
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

    const { filters, page, limit, metaOnly } = parsed;

    const dictionaries = await loadDictionaryServer();
    const results: SearchResult[] = [];
    const categories = new Set<string>();
    const styles = new Set<string>();
    const origins = new Set<string>();

    dictionaries.forEach((dict) => {
      dict.value.forEach((letterGroup) => {
        const letterIncluded =
          filters.letters.length === 0 || filters.letters.includes(letterGroup.letter);

        letterGroup.values.forEach((word) => {
          word.values.forEach((definition) => {
            definition.categories.forEach((category) => categories.add(category));

            if (Array.isArray(definition.styles)) {
              definition.styles.forEach((style) => styles.add(style));
            }

            if (definition.origin) {
              origins.add(definition.origin);
            }
          });

          if (metaOnly || !letterIncluded) {
            return;
          }

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

    const metadata = {
      categories: Array.from(categories).sort((a, b) => a.localeCompare(b, 'es')),
      styles: Array.from(styles).sort((a, b) => a.localeCompare(b, 'es')),
      origins: Array.from(origins).sort((a, b) => a.localeCompare(b, 'es')),
    };

    let paginatedResults: SearchResult[] = [];
    let pagination = {
      page: 1,
      limit,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    };

    if (!metaOnly) {
      const sortedResults = results.sort(
        (a, b) => MATCH_ORDER[a.matchType] - MATCH_ORDER[b.matchType]
      );

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      paginatedResults = sortedResults.slice(startIndex, endIndex);

      pagination = {
        page,
        limit,
        total: sortedResults.length,
        totalPages: Math.ceil(sortedResults.length / limit),
        hasNext: endIndex < sortedResults.length,
        hasPrev: page > 1,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        results: paginatedResults,
        metadata,
        pagination,
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

  const metaOnlyParam = searchParams.get('metaOnly');
  const metaOnly = metaOnlyParam === 'true' || metaOnlyParam === '1';

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

  return { filters, page, limit, metaOnly };
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
