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

  // Restore filters on mount for editor mode (URL params take precedence)
  useEffect(() => {
    if (!editorMode) return;

    const urlFiltersMatchState =
      searchState.query === urlParams.trimmedQuery &&
      arraysEqual(searchState.filters.categories, urlParams.categories) &&
      arraysEqual(searchState.filters.styles, urlParams.styles) &&
      arraysEqual(searchState.filters.origins, urlParams.origins) &&
      arraysEqual(searchState.filters.letters, urlParams.letters) &&
      searchState.status === urlParams.status &&
      arraysEqual(searchState.assignedTo, urlParams.assignedTo);

    if (urlParams.hasUrlCriteria && urlFiltersMatchState) {
      isInitializedRef.current = true;
      return;
    }

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

      const cookiesMatchState =
        searchState.query === savedFilters.query &&
        arraysEqual(searchState.filters.categories, savedFilters.selectedCategories) &&
        arraysEqual(searchState.filters.styles, savedFilters.selectedStyles) &&
        arraysEqual(searchState.filters.origins, savedFilters.selectedOrigins) &&
        arraysEqual(searchState.filters.letters, savedFilters.selectedLetters) &&
        searchState.status === savedFilters.selectedStatus &&
        arraysEqual(searchState.assignedTo, savedFilters.selectedAssignedTo);

      if (cookiesMatchState) {
        isInitializedRef.current = true;
        return;
      }

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
  }, [
    editorMode,
    urlParams,
    searchState.assignedTo,
    searchState.filters.categories,
    searchState.filters.letters,
    searchState.filters.origins,
    searchState.filters.styles,
    searchState.query,
    searchState.status,
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
