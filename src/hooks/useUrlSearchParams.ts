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

/**
 * Parse all search parameters from URL and return memoized values
 */
export function useUrlSearchParams(searchParams: ReadonlyURLSearchParams): UrlSearchParams {
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
  }, [searchParams]);
}
