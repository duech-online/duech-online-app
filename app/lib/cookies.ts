'use client';

export interface AdvancedSearchFilters {
  query: string;
  selectedCategories: string[];
  selectedStyles: string[];
  selectedOrigins: string[];
  selectedLetters: string[];
}

const COOKIE_NAME = 'duech_advanced_search_filters';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function setAdvancedSearchFilters(filters: AdvancedSearchFilters): void {
  try {
    const serializedFilters = JSON.stringify(filters);
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(serializedFilters)}; max-age=${COOKIE_MAX_AGE}; path=/; samesite=lax`;
  } catch (error) {
    console.error('Error setting advanced search filters cookie:', error);
  }
}

export function getAdvancedSearchFilters(): AdvancedSearchFilters {
  const defaultFilters: AdvancedSearchFilters = {
    query: '',
    selectedCategories: [],
    selectedStyles: [],
    selectedOrigins: [],
    selectedLetters: [],
  };

  try {
    if (typeof document === 'undefined') {
      return defaultFilters;
    }

    const cookies = document.cookie.split(';');
    const filterCookie = cookies.find((cookie) =>
      cookie.trim().startsWith(`${COOKIE_NAME}=`)
    );

    if (!filterCookie) {
      return defaultFilters;
    }

    const cookieValue = filterCookie.split('=')[1];
    if (!cookieValue) {
      return defaultFilters;
    }

    const decodedValue = decodeURIComponent(cookieValue);
    const parsedFilters = JSON.parse(decodedValue) as AdvancedSearchFilters;

    // Validate the structure
    if (
      typeof parsedFilters.query === 'string' &&
      Array.isArray(parsedFilters.selectedCategories) &&
      Array.isArray(parsedFilters.selectedStyles) &&
      Array.isArray(parsedFilters.selectedOrigins) &&
      Array.isArray(parsedFilters.selectedLetters)
    ) {
      return parsedFilters;
    }

    return defaultFilters;
  } catch (error) {
    console.error('Error getting advanced search filters cookie:', error);
    return defaultFilters;
  }
}

export function clearAdvancedSearchFilters(): void {
  try {
    document.cookie = `${COOKIE_NAME}=; max-age=0; path=/; samesite=lax`;
  } catch (error) {
    console.error('Error clearing advanced search filters cookie:', error);
  }
}