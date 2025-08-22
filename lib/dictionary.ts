/**
 * Client-side dictionary API functions
 */

import { SearchResult, Word } from '@/types/dictionary';

/**
 * Search words using API
 */
export async function searchWords(query: string, page: number = 1, limit: number = 20): Promise<{
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
  if (!query || query.trim().length === 0) {
    return {
      results: [],
      pagination: { page: 1, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false }
    };
  }

  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    
    if (!response.ok) {
      throw new Error('Search failed');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error searching words:', error);
    return {
      results: [],
      pagination: { page: 1, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false }
    };
  }
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
export async function getWordByLemma(lemma: string): Promise<{ word: Word; letter: string } | null> {
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
export interface AdvancedSearchFilters {
  query?: string;
  categories?: string[];
  styles?: string[];
  origin?: string;
  letter?: string;
}

export async function advancedSearch(
  filters: AdvancedSearchFilters, 
  page: number = 1, 
  limit: number = 20
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
    const params = new URLSearchParams();
    
    if (filters.query) params.append('q', filters.query);
    if (filters.categories?.length) params.append('categories', filters.categories.join(','));
    if (filters.styles?.length) params.append('styles', filters.styles.join(','));
    if (filters.origin) params.append('origin', filters.origin);
    if (filters.letter) params.append('letter', filters.letter);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await fetch(`/api/search/advanced?${params}`);
    
    if (!response.ok) {
      throw new Error('Advanced search failed');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error in advanced search:', error);
    return {
      results: [],
      pagination: { page: 1, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false }
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