/**
 * Custom hook to manage search state with URL and cookie synchronization
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { arraysEqual, LocalSearchFilters } from '@/lib/search-utils';
import {
  setEditorSearchFilters,
  getEditorSearchFilters,
  clearEditorSearchFilters,
} from '@/lib/cookies';
import { UrlSearchParams } from '@/hooks/useUrlSearchParams';

interface SearchState {
  query: string;
  filters: LocalSearchFilters;
  status: string;
  assignedTo: string[];
}

const createDefaultSearchState = (): SearchState => ({
  query: '',
  filters: {
    categories: [],
    styles: [],
    origins: [],
    letters: [],
  },
  status: '',
  assignedTo: [],
});

interface UseSearchStateOptions {
  editorMode: boolean;
  urlParams: UrlSearchParams;
}

/**
 * Manages search state with synchronization from URL params (priority) or cookies (fallback)
 */
export function useSearchState({ editorMode, urlParams }: UseSearchStateOptions) {
  const [searchState, setSearchState] = useState<SearchState>(() => {
    if (editorMode) {
      return createDefaultSearchState();
    }
    // Public mode: use URL params
    return {
      query: urlParams.query,
      filters: {
        categories: urlParams.categories,
        styles: urlParams.styles,
        origins: urlParams.origins,
        letters: urlParams.letters,
      },
      status: '',
      assignedTo: [],
    };
  });

  const isInitializedRef = useRef(false);
  const mountedRef = useRef(false);

  // Initialize state on mount for editor mode (URL params take precedence over cookies)
  useEffect(() => {
    if (!editorMode || mountedRef.current) return;

    mountedRef.current = true;

    if (urlParams.hasUrlCriteria) {
      setSearchState({
        query: urlParams.trimmedQuery,
        filters: {
          categories: [...urlParams.categories],
          styles: [...urlParams.styles],
          origins: [...urlParams.origins],
          letters: [...urlParams.letters],
        },
        status: urlParams.status,
        assignedTo: [...urlParams.assignedTo],
      });
      isInitializedRef.current = true;
    } else {
      const savedFilters = getEditorSearchFilters();

      setSearchState({
        query: savedFilters.query,
        filters: {
          categories: savedFilters.selectedCategories,
          styles: savedFilters.selectedStyles,
          origins: savedFilters.selectedOrigins,
          letters: savedFilters.selectedLetters,
        },
        status: savedFilters.selectedStatus,
        assignedTo: savedFilters.selectedAssignedTo,
      });
      isInitializedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorMode]);
  // Only run on mount to initialize state from URL params or cookies

  // Sync state when URL params change (e.g., browser back/forward navigation)
  useEffect(() => {
    if (!editorMode || !mountedRef.current) return;
    if (!urlParams.hasUrlCriteria) return;

    // Check if URL params differ from current state
    const urlMatchesState =
      searchState.query === urlParams.trimmedQuery &&
      arraysEqual(searchState.filters.categories, urlParams.categories) &&
      arraysEqual(searchState.filters.styles, urlParams.styles) &&
      arraysEqual(searchState.filters.origins, urlParams.origins) &&
      arraysEqual(searchState.filters.letters, urlParams.letters) &&
      searchState.status === urlParams.status &&
      arraysEqual(searchState.assignedTo, urlParams.assignedTo);

    if (urlMatchesState) return;

    // URL params changed (e.g., from browser navigation), sync state
    setSearchState({
      query: urlParams.trimmedQuery,
      filters: {
        categories: [...urlParams.categories],
        styles: [...urlParams.styles],
        origins: [...urlParams.origins],
        letters: [...urlParams.letters],
      },
      status: urlParams.status,
      assignedTo: [...urlParams.assignedTo],
    });
  }, [
    editorMode,
    urlParams.hasUrlCriteria,
    urlParams.trimmedQuery,
    urlParams.categories,
    urlParams.styles,
    urlParams.origins,
    urlParams.letters,
    urlParams.status,
    urlParams.assignedTo,
    // Intentionally excluding searchState to avoid circular updates
  ]);

  // Save filters to cookies for editor mode
  const saveFilters = useCallback(() => {
    if (!editorMode || !isInitializedRef.current) return;

    setEditorSearchFilters({
      query: searchState.query,
      selectedCategories: searchState.filters.categories,
      selectedStyles: searchState.filters.styles,
      selectedOrigins: searchState.filters.origins,
      selectedLetters: searchState.filters.letters,
      selectedStatus: searchState.status,
      selectedAssignedTo: searchState.assignedTo,
    });
  }, [editorMode, searchState]);

  // Clear all filters and reset state
  const clearAll = useCallback(() => {
    setSearchState(createDefaultSearchState());
    if (editorMode) {
      clearEditorSearchFilters();
    }
  }, [editorMode]);

  // Update search state
  const updateState = useCallback((updater: (prev: SearchState) => SearchState) => {
    setSearchState(updater);
  }, []);

  return {
    searchState,
    setSearchState,
    updateState,
    saveFilters,
    clearAll,
    isInitialized: isInitializedRef.current,
  };
}
