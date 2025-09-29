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
): Promise<{
  results: SearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {
  return searchDictionary({ query }, page, limit);
}

/**
 * Get a random word for "Lotería de palabras"
 */
export async function getRandomWord(): Promise<{ word: Word; letter: string } | null> {
  try {
    const response = await fetch('/api/words/random');

    if (!response.ok) {
      throw new Error('Failed to get random word');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error getting random word:', error);
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

export async function searchDictionary(
  filters: SearchFilters,
  page: number = 1,
  limit: number = 1000
): Promise<{
  results: SearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {
  try {
    const params = buildFilterParams(filters);

    if (!params.has('q') && !hasFilterValues(filters)) {
      return {
        results: [],
        pagination: { page: 1, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
      };
    }

    params.append('page', page.toString());
    params.append('limit', limit.toString());

    return await fetchSearchResults(params, page, limit, 'Error searching dictionary:');
  } catch (error) {
    console.error('Error searching dictionary:', error);
    return {
      results: [],
      pagination: { page: 1, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
    };
  }
}

/**
 * Get metadata (categories, styles, origins)
 */
export async function getMetadata(): Promise<{
  categories: string[];
  styles: string[];
  origins: string[];
}> {
  try {
    const response = await fetch('/api/metadata');

    if (!response.ok) {
      throw new Error('Failed to get metadata');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error getting metadata:', error);
    return { categories: [], styles: [], origins: [] };
  }
}

/**
 * Get unique categories from dictionary
 */
export async function getAvailableCategories(): Promise<string[]> {
  const metadata = await getMetadata();
  return metadata.categories;
}

/**
 * Get unique styles from dictionary
 */
export async function getAvailableStyles(): Promise<string[]> {
  const metadata = await getMetadata();
  return metadata.styles;
}

/**
 * Get unique origins from dictionary
 */
export async function getAvailableOrigins(): Promise<string[]> {
  const metadata = await getMetadata();
  return metadata.origins;
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

function hasFilterValues(filters: SearchFilters): boolean {
  return Boolean(
    filters.categories?.length || filters.styles?.length || filters.origins?.length || filters.letters?.length
  );
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
