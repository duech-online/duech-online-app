/**
 * Utility functions for search functionality
 */

/**
 * Parse a comma-separated string parameter into an array
 */
export function parseListParam(value: string | null): string[] {
    if (!value) return [];
    return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

/**
 * Check if two arrays are equal (same length and same values in order)
 */
export function arraysEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((value, index) => value === b[index]);
}

/**
 * Local type for filters with required arrays (used in search-page component)
 */
export type LocalSearchFilters = {
    categories: string[];
    styles: string[];
    origins: string[];
    letters: string[];
};

/**
 * Check if search filters have changed by comparing each filter array
 */
export function filtersChanged(
    prevFilters: LocalSearchFilters,
    newFilters: LocalSearchFilters
): boolean {
    return (
        prevFilters.categories.length !== newFilters.categories.length ||
        prevFilters.categories.some((cat, idx) => cat !== newFilters.categories[idx]) ||
        prevFilters.styles.length !== newFilters.styles.length ||
        prevFilters.styles.some((style, idx) => style !== newFilters.styles[idx]) ||
        prevFilters.origins.length !== newFilters.origins.length ||
        prevFilters.origins.some((origin, idx) => origin !== newFilters.origins[idx]) ||
        prevFilters.letters.length !== newFilters.letters.length ||
        prevFilters.letters.some((letter, idx) => letter !== newFilters.letters[idx])
    );
}

/**
 * Create a deep copy of search filters
 */
export function cloneFilters(filters: LocalSearchFilters): LocalSearchFilters {
    return {
        categories: [...filters.categories],
        styles: [...filters.styles],
        origins: [...filters.origins],
        letters: [...filters.letters],
    };
}
