/**
 * Custom hook to parse and memoize URL search parameters
 */

import { useMemo } from 'react';
import { ReadonlyURLSearchParams } from 'next/navigation';
import { parseListParam } from '@/app/lib/search-utils';

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
    const urlQuery = useMemo(() => searchParams.get('q') || '', [searchParams]);

    const urlCategories = useMemo(
        () => parseListParam(searchParams.get('categories')),
        [searchParams]
    );

    const urlStyles = useMemo(
        () => parseListParam(searchParams.get('styles')),
        [searchParams]
    );

    const urlOrigins = useMemo(
        () => parseListParam(searchParams.get('origins')),
        [searchParams]
    );

    const urlLetters = useMemo(
        () => parseListParam(searchParams.get('letters')),
        [searchParams]
    );

    const urlStatus = useMemo(
        () => (searchParams.get('status') || '').trim(),
        [searchParams]
    );

    const urlAssignedTo = useMemo(
        () => parseListParam(searchParams.get('assignedTo')),
        [searchParams]
    );

    const trimmedQuery = urlQuery.trim();

    const hasUrlCriteria = useMemo(
        () =>
            Boolean(trimmedQuery) ||
            urlCategories.length > 0 ||
            urlStyles.length > 0 ||
            urlOrigins.length > 0 ||
            urlLetters.length > 0 ||
            urlStatus.length > 0 ||
            urlAssignedTo.length > 0,
        [trimmedQuery, urlCategories, urlStyles, urlOrigins, urlLetters, urlStatus, urlAssignedTo]
    );

    return {
        query: urlQuery,
        trimmedQuery,
        categories: urlCategories,
        styles: urlStyles,
        origins: urlOrigins,
        letters: urlLetters,
        status: urlStatus,
        assignedTo: urlAssignedTo,
        hasUrlCriteria,
    };
}
