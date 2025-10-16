'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { SelectDropdown, MultiSelectDropdown } from '@/app/ui/dropdown';
import SearchBar from '@/app/ui/search-bar';
import { SadFaceIcon, SearchIcon } from '@/app/ui/icons';
import { searchDictionary } from '@/app/lib/dictionary';
import { SearchResult } from '@/app/lib/definitions';
import { STATUS_OPTIONS } from '@/app/lib/definitions';
import { WordCard } from '@/app/ui/word-card';
import { AddWordModal } from '@/app/ui/add-word-modal';
import {
  setEditorSearchFilters,
  getEditorSearchFilters,
  clearEditorSearchFilters,
} from '@/app/lib/cookies';

interface User {
  id: number;
  username: string;
  email?: string | null;
  role: string;
}

type SearchFilters = {
  categories: string[];
  styles: string[];
  origins: string[];
  letters: string[];
};

type SearchState = {
  query: string;
  filters: SearchFilters;
  status: string;
  assignedTo: string[];
};

interface SearchPageProps {
  editorMode?: boolean;
  title: string;
  placeholder: string;
  initialUsers?: User[];
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

function parseListParam(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function SearchPage({
  editorMode = false,
  title,
  placeholder,
  initialUsers = [],
}: SearchPageProps) {
  // Parse URL search params (for public mode)
  const searchParams = useSearchParams();

  const urlQuery = useMemo(() => searchParams.get('q') || '', [searchParams]);
  const urlCategories = useMemo(
    () => parseListParam(searchParams.get('categories')),
    [searchParams]
  );
  const urlStyles = useMemo(() => parseListParam(searchParams.get('styles')), [searchParams]);
  const urlOrigins = useMemo(() => parseListParam(searchParams.get('origins')), [searchParams]);
  const urlLetters = useMemo(() => parseListParam(searchParams.get('letters')), [searchParams]);

  const initialFilters = useMemo(
    () => ({
      categories: urlCategories,
      styles: urlStyles,
      origins: urlOrigins,
      letters: urlLetters,
    }),
    [urlCategories, urlStyles, urlOrigins, urlLetters]
  );

  const [searchState, setSearchState] = useState<SearchState>(() => {
    if (editorMode) {
      return createDefaultSearchState();
    }
    // Public mode: use URL params
    return {
      query: urlQuery,
      filters: initialFilters,
      status: '',
      assignedTo: [],
    };
  });
  const isInitializedRef = useRef(false);

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(!editorMode);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  // Editor mode: Use users passed from server
  const availableUsers = initialUsers;

  // Restore filters on mount for editor mode
  useEffect(() => {
    if (!editorMode) return;

    const restoreFilters = () => {
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
    };

    restoreFilters();
  }, [editorMode]);

  // Auto-search on mount for public mode
  useEffect(() => {
    if (editorMode || hasSearched) return;

    let cancelled = false;

    const hasSearchCriteria =
      Boolean(urlQuery.trim()) ||
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
            query: urlQuery.trim(),
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
      } catch (error) {
        console.error('Error searching:', error);
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
  }, [editorMode, hasSearched, urlQuery, initialFilters]);

  // Save filters function for editor mode
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

  const handleSearchStateChange = useCallback(
    ({ query, filters }: { query: string; filters: SearchFilters }) => {
      setSearchState((prev) => {
        const filtersChanged =
          prev.filters.categories.length !== filters.categories.length ||
          prev.filters.categories.some((cat, idx) => cat !== filters.categories[idx]) ||
          prev.filters.styles.length !== filters.styles.length ||
          prev.filters.styles.some((style, idx) => style !== filters.styles[idx]) ||
          prev.filters.origins.length !== filters.origins.length ||
          prev.filters.origins.some((origin, idx) => origin !== filters.origins[idx]) ||
          prev.filters.letters.length !== filters.letters.length ||
          prev.filters.letters.some((letter, idx) => letter !== filters.letters[idx]);

        const queryChanged = prev.query !== query;

        if (!filtersChanged && !queryChanged) {
          return prev;
        }

        return {
          ...prev,
          query,
          filters: filtersChanged
            ? {
                categories: [...filters.categories],
                styles: [...filters.styles],
                origins: [...filters.origins],
                letters: [...filters.letters],
              }
            : prev.filters,
        };
      });
    },
    []
  );

  const handleStatusChange = useCallback((value: string) => {
    setSearchState((prev) => ({
      ...prev,
      status: value,
    }));
  }, []);

  const handleAssignedChange = useCallback((values: string[]) => {
    setSearchState((prev) => ({
      ...prev,
      assignedTo: values,
    }));
  }, []);

  const clearAdditionalFilters = useCallback(() => {
    setSearchState((prev) => ({
      ...prev,
      status: '',
      assignedTo: [],
    }));
  }, []);

  const executeSearch = useCallback(
    async ({ query, filters }: { query: string; filters: SearchFilters }) => {
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

        setSearchState((prev) => {
          const filtersChanged =
            prev.filters.categories.length !== filters.categories.length ||
            prev.filters.categories.some((cat, idx) => cat !== filters.categories[idx]) ||
            prev.filters.styles.length !== filters.styles.length ||
            prev.filters.styles.some((style, idx) => style !== filters.styles[idx]) ||
            prev.filters.origins.length !== filters.origins.length ||
            prev.filters.origins.some((origin, idx) => origin !== filters.origins[idx]) ||
            prev.filters.letters.length !== filters.letters.length ||
            prev.filters.letters.some((letter, idx) => letter !== filters.letters[idx]);

          const queryChanged = prev.query !== query;

          if (!filtersChanged && !queryChanged) {
            return prev;
          }

          return {
            ...prev,
            query,
            filters: filtersChanged
              ? {
                  categories: [...filters.categories],
                  styles: [...filters.styles],
                  origins: [...filters.origins],
                  letters: [...filters.letters],
                }
              : prev.filters,
          };
        });

        if (editorMode) {
          setTimeout(() => saveFilters(), 0);
        }
      } catch (error) {
        console.error('Error in search:', error);
        setSearchResults([]);
        setTotalResults(0);
      } finally {
        setIsLoading(false);
      }
    },
    [editorMode, saveFilters, searchState.assignedTo, searchState.status]
  );

  const handleClearAll = useCallback(() => {
    setSearchState(createDefaultSearchState());
    setSearchResults([]);
    setHasSearched(false);
    setTotalResults(0);
    if (editorMode) {
      clearEditorSearchFilters();
    }
  }, [editorMode]);

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
          {title}
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
          <div className="space-y-4">
            {[...Array(editorMode ? 5 : 3)].map((_, index) => (
              <div
                key={index}
                className={`animate-pulse rounded-lg bg-white ${editorMode ? 'p-4' : 'p-6'} shadow`}
              >
                <div className="mb-2 h-6 w-1/4 rounded bg-gray-200"></div>
                <div className={`${editorMode ? '' : 'mb-2'} h-4 w-3/4 rounded bg-gray-200`}></div>
                {!editorMode && <div className="h-4 w-1/2 rounded bg-gray-200"></div>}
              </div>
            ))}
          </div>
        ) : hasSearched || (!editorMode && hasSearchCriteria) ? (
          searchResults.length > 0 ? (
            <>
              {/* Results count */}
              <div className="mb-4 flex items-center justify-between">
                <p className="mb-6 text-gray-600">
                  {editorMode
                    ? `Se encontraron ${searchResults.length} palabra${searchResults.length !== 1 ? 's' : ''}`
                    : totalResults > 0
                      ? `Se encontraron ${totalResults} resultado${totalResults !== 1 ? 's' : ''}${searchState.query.trim() && totalResults > 0 ? ` para "${searchState.query.trim()}"` : ''}`
                      : 'No se encontraron resultados con los criterios seleccionados'}
                </p>
              </div>
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
            // No results found
            <div
              className={`rounded-lg bg-white ${editorMode ? 'p-12' : 'p-8'} text-center shadow`}
            >
              <SadFaceIcon className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                No se encontraron resultados
              </h3>
              <p className="text-gray-600">
                Ajusta tu término de búsqueda o modifica las opciones avanzadas.
              </p>
            </div>
          )
        ) : (
          // No search yet
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <SearchIcon className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              {editorMode ? 'Busca palabras para editar' : 'Busca palabras en el diccionario'}
            </h3>
            <p className="text-gray-600">
              'Usa la búsqueda avanzada arriba para encontrar palabras por categorías, estilos,
              origen o letra.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
