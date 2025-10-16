'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { SelectDropdown, MultiSelectDropdown } from '@/components/common/dropdown';
import SearchBar from '@/components/search/search-bar';
import { searchDictionary } from '@/lib/dictionary-client';
import { SearchResult } from '@/lib/definitions';
import { STATUS_OPTIONS } from '@/lib/definitions';
import { WordCard } from '@/components/search/word-card';
import { AddWordModal } from '@/components/search/add-word-modal';
import { useUrlSearchParams } from '@/hooks/useUrlSearchParams';
import { useSearchState } from '@/hooks/useSearchState';
import {
  SearchLoadingSkeleton,
  EmptySearchState,
  NoResultsState,
  SearchResultsCount,
} from '@/components/search/search-results-components';
import { arraysEqual, filtersChanged, cloneFilters, LocalSearchFilters } from '@/lib/search-utils';
import { isEditorModeClient } from '@/lib/editor-mode';

interface User {
  id: number;
  username: string;
  email?: string | null;
  role: string;
}

interface SearchPageProps {
  title?: string;
  placeholder: string;
  initialUsers?: User[];
}

export function SearchPage({ title, placeholder, initialUsers = [] }: SearchPageProps) {
  // Detect editor mode
  const editorMode = isEditorModeClient();

  // Parse URL search params
  const searchParams = useSearchParams();
  const urlParams = useUrlSearchParams(searchParams);

  // Set title based on editor mode if not provided
  const pageTitle = title || (editorMode ? 'Editor de Diccionario' : 'Diccionario');

  // Manage search state with URL/cookie synchronization
  const { searchState, updateState, saveFilters, clearAll, isInitialized } = useSearchState({
    editorMode,
    urlParams,
  });

  const urlSearchTriggeredRef = useRef(false);

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(!editorMode);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  // Editor mode: Use users passed from server
  const availableUsers = initialUsers;

  const initialFilters = useMemo(
    () => ({
      categories: urlParams.categories,
      styles: urlParams.styles,
      origins: urlParams.origins,
      letters: urlParams.letters,
    }),
    [urlParams.categories, urlParams.styles, urlParams.origins, urlParams.letters]
  );

  // Reset URL search trigger when URL params change
  useEffect(() => {
    if (!editorMode) return;

    if (!urlParams.hasUrlCriteria) {
      urlSearchTriggeredRef.current = false;
      return;
    }

    if (!isInitialized) return;

    const matchesUrlState =
      searchState.query === urlParams.trimmedQuery &&
      arraysEqual(searchState.filters.categories, urlParams.categories) &&
      arraysEqual(searchState.filters.styles, urlParams.styles) &&
      arraysEqual(searchState.filters.origins, urlParams.origins) &&
      arraysEqual(searchState.filters.letters, urlParams.letters) &&
      searchState.status === urlParams.status &&
      arraysEqual(searchState.assignedTo, urlParams.assignedTo);

    if (!matchesUrlState) {
      urlSearchTriggeredRef.current = false;
      setHasSearched(false);
      setSearchResults([]);
      setTotalResults(0);
    }
  }, [
    editorMode,
    isInitialized,
    urlParams,
    searchState.query,
    searchState.filters.categories,
    searchState.filters.styles,
    searchState.filters.origins,
    searchState.filters.letters,
    searchState.status,
    searchState.assignedTo,
  ]);

  // Auto-search on mount for public mode
  useEffect(() => {
    if (editorMode || hasSearched) return;

    let cancelled = false;

    const hasSearchCriteria =
      Boolean(urlParams.trimmedQuery) ||
      initialFilters.categories.length > 0 ||
      initialFilters.styles.length > 0 ||
      initialFilters.origins.length > 0 ||
      initialFilters.letters.length > 0;

    if (!hasSearchCriteria) {
      setSearchResults([]);
      setTotalResults(0);
      setIsLoading(false);
      return;
    }

    const executeInitialSearch = async () => {
      setIsLoading(true);
      try {
        const data = await searchDictionary(
          {
            query: urlParams.trimmedQuery,
            categories: initialFilters.categories,
            styles: initialFilters.styles,
            origins: initialFilters.origins,
            letters: initialFilters.letters,
          },
          1,
          1000
        );

        if (!cancelled) {
          setSearchResults(data.results);
          setTotalResults(data.pagination.total);
          setHasSearched(true);
        }
      } catch {
        if (!cancelled) {
          setSearchResults([]);
          setTotalResults(0);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    executeInitialSearch();

    return () => {
      cancelled = true;
    };
  }, [editorMode, hasSearched, urlParams.query, urlParams.trimmedQuery, initialFilters]);

  const handleSearchStateChange = useCallback(
    ({ query, filters }: { query: string; filters: LocalSearchFilters }) => {
      updateState((prev) => {
        const hasFiltersChanged = filtersChanged(prev.filters, filters);
        const queryChanged = prev.query !== query;

        if (!hasFiltersChanged && !queryChanged) {
          return prev;
        }

        return {
          ...prev,
          query,
          filters: hasFiltersChanged ? cloneFilters(filters) : prev.filters,
        };
      });
    },
    [updateState]
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      updateState((prev) => ({
        ...prev,
        status: value,
      }));
    },
    [updateState]
  );

  const handleAssignedChange = useCallback(
    (values: string[]) => {
      updateState((prev) => ({
        ...prev,
        assignedTo: values,
      }));
    },
    [updateState]
  );

  const clearAdditionalFilters = useCallback(() => {
    updateState((prev) => ({
      ...prev,
      status: '',
      assignedTo: [],
    }));
  }, [updateState]);

  const executeSearch = useCallback(
    async ({ query, filters }: { query: string; filters: LocalSearchFilters }) => {
      setIsLoading(true);
      setHasSearched(true);

      try {
        const searchData = await searchDictionary(
          {
            query,
            categories: filters.categories,
            styles: filters.styles,
            origins: filters.origins,
            letters: filters.letters,
          },
          1,
          1000,
          editorMode ? searchState.status : undefined,
          editorMode ? searchState.assignedTo : undefined
        );

        setSearchResults(searchData.results);
        setTotalResults(searchData.pagination.total);

        updateState((prev) => {
          const hasFiltersChanged = filtersChanged(prev.filters, filters);
          const queryChanged = prev.query !== query;

          if (!hasFiltersChanged && !queryChanged) {
            return prev;
          }

          return {
            ...prev,
            query,
            filters: hasFiltersChanged ? cloneFilters(filters) : prev.filters,
          };
        });

        if (editorMode) {
          setTimeout(() => saveFilters(), 0);
        }
      } catch {
        setSearchResults([]);
        setTotalResults(0);
      } finally {
        setIsLoading(false);
      }
    },
    [editorMode, saveFilters, searchState.assignedTo, searchState.status, updateState]
  );

  const handleClearAll = useCallback(() => {
    clearAll();
    setSearchResults([]);
    setHasSearched(false);
    setTotalResults(0);
  }, [clearAll]);

  // Trigger search when URL params match current state in editor mode
  useEffect(() => {
    if (!editorMode) return;

    if (!urlParams.hasUrlCriteria) {
      urlSearchTriggeredRef.current = false;
      return;
    }

    if (!isInitialized) return;

    const matchesUrlState =
      searchState.query === urlParams.trimmedQuery &&
      arraysEqual(searchState.filters.categories, urlParams.categories) &&
      arraysEqual(searchState.filters.styles, urlParams.styles) &&
      arraysEqual(searchState.filters.origins, urlParams.origins) &&
      arraysEqual(searchState.filters.letters, urlParams.letters) &&
      searchState.status === urlParams.status &&
      arraysEqual(searchState.assignedTo, urlParams.assignedTo);

    if (!matchesUrlState) {
      urlSearchTriggeredRef.current = false;
      return;
    }

    if (urlSearchTriggeredRef.current) return;

    urlSearchTriggeredRef.current = true;

    void executeSearch({
      query: searchState.query,
      filters: searchState.filters,
    });
  }, [
    editorMode,
    executeSearch,
    isInitialized,
    urlParams,
    searchState.assignedTo,
    searchState.filters,
    searchState.query,
    searchState.status,
  ]);

  const userOptions = useMemo(
    () =>
      availableUsers
        .filter((user) => user.role === 'lexicographer')
        .map((user) => ({
          value: user.id.toString(),
          label: user.username,
        })),
    [availableUsers]
  );

  const hasEditorFilters = searchState.status.length > 0 || searchState.assignedTo.length > 0;

  const hasSearchCriteria =
    searchState.query.length > 0 ||
    searchState.filters.categories.length > 0 ||
    searchState.filters.styles.length > 0 ||
    searchState.filters.origins.length > 0 ||
    searchState.filters.letters.length > 0 ||
    (editorMode && hasEditorFilters);

  // Memoize filter components for editor mode
  const statusFilter = useMemo(
    () =>
      editorMode ? (
        <SelectDropdown
          key="status-filter"
          label="Estado"
          options={STATUS_OPTIONS}
          selectedValue={searchState.status}
          onChange={handleStatusChange}
          placeholder="Seleccionar estado"
        />
      ) : null,
    [editorMode, searchState.status, handleStatusChange]
  );

  const assignedFilter = useMemo(
    () =>
      editorMode ? (
        <MultiSelectDropdown
          key="assigned-filter"
          label="Asignado a"
          options={userOptions}
          selectedValues={searchState.assignedTo}
          onChange={handleAssignedChange}
          placeholder="Seleccionar usuario"
        />
      ) : null,
    [editorMode, searchState.assignedTo, userOptions, handleAssignedChange]
  );

  const additionalFiltersConfig = useMemo(
    () =>
      editorMode
        ? {
            hasActive: hasEditorFilters,
            onClear: clearAdditionalFilters,
            render: () => (
              <>
                {statusFilter}
                {assignedFilter}
              </>
            ),
          }
        : undefined,
    [editorMode, clearAdditionalFilters, hasEditorFilters, statusFilter, assignedFilter]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div
        className={`mb-${editorMode ? '3' : '10'} ${editorMode ? 'flex items-center justify-between' : ''}`}
      >
        <h1 className={`text-duech-blue ${editorMode ? '' : 'mb-6'} text-4xl font-bold`}>
          {pageTitle}
        </h1>
        {editorMode && <AddWordModal availableUsers={availableUsers} />}
      </div>

      {/* Search Bar */}
      <div className={`mb-8 ${editorMode ? 'rounded-xl bg-white p-6 shadow-lg' : ''}`}>
        <SearchBar
          placeholder={placeholder}
          initialValue={searchState.query}
          initialFilters={searchState.filters}
          onSearch={executeSearch}
          onStateChange={handleSearchStateChange}
          onClearAll={editorMode ? handleClearAll : undefined}
          additionalFilters={additionalFiltersConfig}
          initialAdvancedOpen={
            editorMode &&
            (searchState.filters.categories.length > 0 ||
              searchState.filters.styles.length > 0 ||
              searchState.filters.origins.length > 0 ||
              searchState.filters.letters.length > 0 ||
              hasEditorFilters)
          }
        />
      </div>

      {/* Results Section */}
      <div>
        {isLoading ? (
          <SearchLoadingSkeleton editorMode={editorMode} />
        ) : hasSearched || (!editorMode && hasSearchCriteria) ? (
          searchResults.length > 0 ? (
            <>
              <SearchResultsCount
                editorMode={editorMode}
                resultsCount={searchResults.length}
                totalResults={totalResults}
                query={searchState.query}
              />
              {/* Results list */}
              <div className="space-y-4">
                {searchResults.map((result, index) => (
                  <WordCard
                    key={`${result.word.lemma}-${index}`}
                    lemma={result.word.lemma}
                    letter={result.letter}
                    editorMode={editorMode}
                    root={editorMode ? result.word.root : undefined}
                    status={editorMode ? result.status : undefined}
                    definitionsCount={editorMode ? result.word.values.length : undefined}
                  />
                ))}
              </div>
            </>
          ) : (
            <NoResultsState editorMode={editorMode} />
          )
        ) : (
          <EmptySearchState editorMode={editorMode} />
        )}
      </div>
    </div>
  );
}
