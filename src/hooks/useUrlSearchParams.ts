/**
 * Custom hook to parse and memoize URL search parameters
 */

import { useMemo } from 'react';
import { ReadonlyURLSearchParams } from 'next/navigation';
import { parseListParam } from '@/lib/search-utils';

export interface UrlSearchParams {
  query: string;
  trimmedQuery: string;
  categories: string[];
  styles: string[];
  origins: string[];
  letters: string[];
  status: string;
  assignedTo: string[];
  hasUrlCriteria: boolean;
}

// Helper to create stable array references
function arrayEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, idx) => val === b[idx]);
}

/**
 * Parse all search parameters from URL and return memoized values
 */
export function useUrlSearchParams(searchParams: ReadonlyURLSearchParams): UrlSearchParams {
  // Create a stable signature of the search params to use for memoization
  const paramsSignature = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    // Sort to ensure consistent ordering
    params.sort();
    return params.toString();
  }, [searchParams]);

  return useMemo(() => {
    const query = searchParams.get('q') || '';
    const categories = parseListParam(searchParams.get('categories'));
    const styles = parseListParam(searchParams.get('styles'));
    const origins = parseListParam(searchParams.get('origins'));
    const letters = parseListParam(searchParams.get('letters'));
    const status = (searchParams.get('status') || '').trim();
    const assignedTo = parseListParam(searchParams.get('assignedTo'));
    const trimmedQuery = query.trim();

    const hasUrlCriteria =
      Boolean(trimmedQuery) ||
      categories.length > 0 ||
      styles.length > 0 ||
      origins.length > 0 ||
      letters.length > 0 ||
      status.length > 0 ||
      assignedTo.length > 0;

    return {
      query,
      trimmedQuery,
      categories,
      styles,
      origins,
      letters,
      status,
      assignedTo,
      hasUrlCriteria,
    };
  }, [paramsSignature, searchParams]);
}
