/**
 * Client-side dictionary API functions
 */

import { SearchResult, Word } from '@/app/lib/definitions';

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
export async function getWordOfTheDay(date: Date = new Date()): Promise<{ word: Word; letter: string } | null> {
  try {
    const seed = date.toISOString().slice(0, 10); // YYYY-MM-DD (UTC based)
    const letter = pickLetterFromSeed(seed);

    let searchResult = await searchDictionary({ letters: [letter] }, 1, 1000);

    if (searchResult.results.length === 0) {
      // Fallback to entire dictionary if a letter has no entries
      searchResult = await searchDictionary({}, 1, 1000);
    }

    const pool = [...searchResult.results].sort((a, b) =>
      a.word.lemma.localeCompare(b.word.lemma, 'es')
    );
    if (pool.length === 0) {
      return null;
    }

    const index = hashSeed(`${seed}:${letter}`) % pool.length;
    const chosen = pool[index];
    const detailed = await getWordByLemma(chosen.word.lemma);

    if (detailed) {
      return detailed;
    }

    return { word: chosen.word, letter: chosen.letter };
  } catch (error) {
    console.error('Error getting word of the day:', error);
    return null;
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

/**
 * Advanced search with filters
 */
export interface SearchFilters {
  query?: string;
  categories?: string[];
  styles?: string[];
  origins?: string[];
  letters?: string[];
}

export interface SearchMetadata {
  categories: string[];
  styles: string[];
  origins: string[];
}

export interface SearchResponse {
  results: SearchResult[];
  metadata: SearchMetadata;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
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

function pickLetterFromSeed(seed: string): string {
  const letters = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
  const index = hashSeed(seed) % letters.length;
  return letters[index];
}

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}
