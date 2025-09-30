import { SearchFilters, SearchMetadata, SearchResponse, Word } from '@/app/lib/definitions';

const LETTERS = 'abcdefghijklmnñopqrstuvwxyz'.split('');
const wordOfTheDayCache = new Map<string, { word: Word; letter: string }>();

/**
 * Search words using API
 */
export async function searchWords(
  query: string,
  page: number = 1,
  limit: number = 1000
): Promise<SearchResponse> {
  return searchDictionary({ query }, page, limit);
}

/**
 * Get a random word for "Lotería de palabras"
 */
export async function getWordOfTheDay(
  date: Date = new Date()
): Promise<{ word: Word; letter: string } | null> {
  try {
    const seed = date.toISOString().slice(0, 10); // YYYY-MM-DD (UTC based)
    if (wordOfTheDayCache.has(seed)) {
      return wordOfTheDayCache.get(seed)!;
    }
    const startIndex = hashSeed(seed) % LETTERS.length;

    let searchResult: SearchResponse | null = null;
    let selectedLetter = LETTERS[startIndex];

    const idx = startIndex % LETTERS.length;
    const initialLetter = LETTERS[idx];
    const initialResult = await searchDictionary({ letters: [initialLetter] }, 1, 1000);

    if (initialResult.results.length > 0) {
      searchResult = initialResult;
      selectedLetter = initialLetter;
    } else {
      selectedLetter = 'o';
      searchResult = await searchDictionary({ letters: [selectedLetter] }, 1, 1000);
    }

    const pool = [...searchResult.results].sort((a, b) =>
      a.word.lemma.localeCompare(b.word.lemma, 'es')
    );
    if (pool.length === 0) {
      throw new Error(
        `No se encontraron palabras para la fecha ${seed}. (letra=${selectedLetter}, filtros vacíos, Resultados=${searchResult.results.length})`
      );
    }

    const index = hashSeed(`${seed}:${selectedLetter}`) % pool.length;
    const chosen = pool[index];
    const detailed = await getWordByLemma(chosen.word.lemma);

    const fallbackWord = detailed ?? { word: chosen.word, letter: chosen.letter };

    wordOfTheDayCache.set(seed, fallbackWord);
    return fallbackWord;
  } catch (error) {
    console.error('Error getting word of the day:', error);
    throw error;
  }
}

/**
 * Get word by lemma
 */
export async function getWordByLemma(
  lemma: string
): Promise<{ word: Word; letter: string } | null> {
  try {
    const response = await fetch(`/api/words/${encodeURIComponent(lemma)}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to get word');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error getting word:', error);
    return null;
  }
}

export async function searchDictionary(
  filters: SearchFilters,
  page: number = 1,
  limit: number = 1000
): Promise<SearchResponse> {
  try {
    const params = buildFilterParams(filters);

    params.append('page', page.toString());
    params.append('limit', limit.toString());

    return await fetchSearchResults(params, page, limit, 'Error searching dictionary:');
  } catch (error) {
    console.error('Error searching dictionary:', error);
    return {
      results: [],
      metadata: { categories: [], styles: [], origins: [] },
      pagination: { page: 1, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
    };
  }
}

export async function getSearchMetadata(): Promise<SearchMetadata> {
  try {
    const response = await fetch('/api/search?metaOnly=true');

    if (!response.ok) {
      throw new Error('Failed to get search metadata');
    }

    const result = await response.json();
    return result.data.metadata;
  } catch (error) {
    console.error('Error getting search metadata:', error);
    return { categories: [], styles: [], origins: [] };
  }
}

function buildFilterParams(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();

  const query = filters.query?.trim();
  if (query) params.append('q', query);
  if (filters.categories?.length) params.append('categories', filters.categories.join(','));
  if (filters.styles?.length) params.append('styles', filters.styles.join(','));
  if (filters.origins?.length) params.append('origins', filters.origins.join(','));
  if (filters.letters?.length) params.append('letters', filters.letters.join(','));

  return params;
}

async function fetchSearchResults(
  params: URLSearchParams,
  page: number,
  limit: number,
  errorLabel: string
) {
  try {
    const queryString = params.toString();
    const response = await fetch(`/api/search${queryString ? `?${queryString}` : ''}`);

    if (!response.ok) {
      throw new Error('Search failed');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error(errorLabel, error);
    return {
      results: [],
      metadata: { categories: [], styles: [], origins: [] },
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: page > 1,
      },
    };
  }
}

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}
