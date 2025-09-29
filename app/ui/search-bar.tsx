'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import MultiSelectDropdown from '@/app/ui/multi-select-dropdown';
import FilterPill from '@/app/ui/filter-pill';
import {
  getAvailableCategories,
  getAvailableStyles,
  getAvailableOrigins,
} from '@/app/lib/dictionary';
import { GRAMMATICAL_CATEGORIES, USAGE_STYLES } from '@/app/lib/definitions';
import {
  getAdvancedSearchFilters,
  setAdvancedSearchFilters,
  clearAdvancedSearchFilters,
} from '@/app/lib/cookies';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  initialValue?: string;
  initialFilters?: Partial<SearchFiltersState>;
}

interface SearchFiltersState {
  categories: string[];
  styles: string[];
  origins: string[];
  letters: string[];
}

type FilterVariant = 'default' | 'category' | 'style' | 'origin' | 'letter';

const LETTER_OPTIONS = 'abcdefghijklmnñopqrstuvwxyz'.split('').map((letter) => ({
  value: letter,
  label: letter.toUpperCase(),
}));

const createEmptyFilters = (): SearchFiltersState => ({
  categories: [],
  styles: [],
  origins: [],
  letters: [],
});

export default function SearchBar({
  placeholder = 'Buscar palabra...',
  className = '',
  initialValue,
  initialFilters,
}: SearchBarProps) {
  const router = useRouter();

  const [query, setQuery] = useState(initialValue ?? '');
  const [selectedFilters, setSelectedFilters] = useState<SearchFiltersState>({
    categories: initialFilters?.categories ?? [],
    styles: initialFilters?.styles ?? [],
    origins: initialFilters?.origins ?? [],
    letters: initialFilters?.letters ?? [],
  });
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableStyles, setAvailableStyles] = useState<string[]>([]);
  const [availableOrigins, setAvailableOrigins] = useState<string[]>([]);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const toggleAdvanced = useCallback(() => {
    setIsAdvancedOpen((prev) => !prev);
  }, []);

  const hasActiveFilters = useMemo(
    () =>
      selectedFilters.categories.length > 0 ||
      selectedFilters.styles.length > 0 ||
      selectedFilters.origins.length > 0 ||
      selectedFilters.letters.length > 0,
    [selectedFilters]
  );

  // Keep query in sync with external updates (e.g. navigating to a new search)
  useEffect(() => {
    if (initialValue !== undefined) {
      setQuery(initialValue);
    }
  }, [initialValue]);

  // Sync filters when parent updates them (search page navigation)
  useEffect(() => {
    if (!initialFilters) {
      return;
    }

    setSelectedFilters({
      categories: initialFilters.categories ?? [],
      styles: initialFilters.styles ?? [],
      origins: initialFilters.origins ?? [],
      letters: initialFilters.letters ?? [],
    });

    const shouldOpen = Boolean(
      (initialFilters.categories && initialFilters.categories.length > 0) ||
        (initialFilters.styles && initialFilters.styles.length > 0) ||
        (initialFilters.origins && initialFilters.origins.length > 0) ||
        (initialFilters.letters && initialFilters.letters.length > 0)
    );
    setIsAdvancedOpen(shouldOpen);
    setIsInitialized(true);
  }, [initialFilters]);

  // Restore filters from cookies when the component is used without explicit initial filters (landing page)
  useEffect(() => {
    if (initialFilters) {
      return;
    }

    const saved = getAdvancedSearchFilters();

    setQuery((prev) => (prev !== '' ? prev : saved.query));
    setSelectedFilters({
      categories: saved.selectedCategories,
      styles: saved.selectedStyles,
      origins: saved.selectedOrigins,
      letters: saved.selectedLetters,
    });

    const shouldOpen =
      saved.selectedCategories.length > 0 ||
      saved.selectedStyles.length > 0 ||
      saved.selectedOrigins.length > 0 ||
      saved.selectedLetters.length > 0;

    if (shouldOpen) {
      setIsAdvancedOpen(true);
    }

    setIsInitialized(true);
  }, [initialFilters]);

  // Load available metadata for dropdowns
  useEffect(() => {
    let isMounted = true;

    const loadMetadata = async () => {
      try {
        const [cats, styles, origins] = await Promise.all([
          getAvailableCategories(),
          getAvailableStyles(),
          getAvailableOrigins(),
        ]);

        if (!isMounted) return;

        setAvailableCategories(cats);
        setAvailableStyles(styles);
        setAvailableOrigins(origins);
      } catch (error) {
        console.error('Error loading search metadata:', error);
      }
    };

    loadMetadata();

    return () => {
      isMounted = false;
    };
  }, []);

  // Persist filters to cookies after initialization
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    setAdvancedSearchFilters({
      query,
      selectedCategories: selectedFilters.categories,
      selectedStyles: selectedFilters.styles,
      selectedOrigins: selectedFilters.origins,
      selectedLetters: selectedFilters.letters,
    });
  }, [query, selectedFilters, isInitialized]);

  const categoryOptions = useMemo(
    () =>
      availableCategories.map((category) => ({
        value: category,
        label: GRAMMATICAL_CATEGORIES[category] || category,
      })),
    [availableCategories]
  );

  const styleOptions = useMemo(
    () =>
      availableStyles.map((style) => ({
        value: style,
        label: USAGE_STYLES[style] || style,
      })),
    [availableStyles]
  );

  const originOptions = useMemo(
    () => availableOrigins.map((origin) => ({ value: origin, label: origin })),
    [availableOrigins]
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuery = query.trim();

    if (!trimmedQuery && !hasActiveFilters) {
      return;
    }

    const params = new URLSearchParams();
    if (trimmedQuery) params.set('q', trimmedQuery);
    if (selectedFilters.categories.length)
      params.set('categories', selectedFilters.categories.join(','));
    if (selectedFilters.styles.length) params.set('styles', selectedFilters.styles.join(','));
    if (selectedFilters.origins.length) params.set('origins', selectedFilters.origins.join(','));
    if (selectedFilters.letters.length) params.set('letters', selectedFilters.letters.join(','));

    const searchPath = params.toString();
    router.push(`/search${searchPath ? `?${searchPath}` : ''}`);
  };

  const updateFilters = useCallback(
    <K extends keyof SearchFiltersState>(key: K, values: string[]) => {
      setSelectedFilters((prev) => ({ ...prev, [key]: values }));
    },
    []
  );

  const handleClearFilters = useCallback(() => {
    setSelectedFilters(createEmptyFilters());
    clearAdvancedSearchFilters();
  }, []);

  const removeFilterValue = useCallback((key: keyof SearchFiltersState, value: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [key]: prev[key].filter((item) => item !== value),
    }));
  }, []);

  const renderFilterPills = () => {
    const pills: Array<{
      key: keyof SearchFiltersState;
      value: string;
      label: string;
      variant: FilterVariant;
    }> = [];

    selectedFilters.categories.forEach((category) => {
      pills.push({
        key: 'categories',
        value: category,
        label: GRAMMATICAL_CATEGORIES[category] || category,
        variant: 'category',
      });
    });

    selectedFilters.styles.forEach((style) => {
      pills.push({
        key: 'styles',
        value: style,
        label: USAGE_STYLES[style] || style,
        variant: 'style',
      });
    });

    selectedFilters.origins.forEach((origin) => {
      pills.push({
        key: 'origins',
        value: origin,
        label: origin,
        variant: 'origin',
      });
    });

    selectedFilters.letters.forEach((letter) => {
      pills.push({
        key: 'letters',
        value: letter,
        label: letter.toUpperCase(),
        variant: 'letter',
      });
    });

    if (pills.length === 0) {
      return null;
    }

    return (
      <div className="mt-4 flex flex-wrap gap-2">
        {pills.map((pill) => (
          <FilterPill
            key={`${pill.key}-${pill.value}`}
            label={pill.label}
            value={pill.value}
            onRemove={(value) => removeFilterValue(pill.key, value)}
            variant={pill.variant}
          />
        ))}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className={`w-full ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="focus:border-duech-blue w-full rounded-xl border-2 border-gray-300 bg-white px-6 py-4 pr-28 text-lg text-gray-900 shadow-lg transition-all duration-200 focus:ring-4 focus:ring-blue-200 focus:outline-none"
        />
        <div className="absolute inset-y-0 right-3 flex items-center gap-2">
          <button
            type="button"
            onClick={toggleAdvanced}
            className="hover:text-duech-blue rounded-lg bg-gray-100 p-3 text-gray-600 transition-colors hover:bg-blue-50"
            aria-label={
              isAdvancedOpen ? 'Ocultar opciones avanzadas' : 'Mostrar opciones avanzadas'
            }
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.89 3.31.877 2.42 2.42a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.89 1.543-.877 3.31-2.42 2.42a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.89-3.31-.877-2.42-2.42a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.89-1.543.877-3.31 2.42-2.42.996.575 2.275.126 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
          <button
            type="submit"
            className="hover:text-duech-blue rounded-lg bg-gray-100 p-3 text-gray-600 transition-colors hover:bg-blue-50"
            aria-label="Buscar"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {isAdvancedOpen && (
        <div className="border-duech-blue/20 mt-4 rounded-xl border bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MultiSelectDropdown
              label="Letras"
              options={LETTER_OPTIONS}
              selectedValues={selectedFilters.letters}
              onChange={(values) => updateFilters('letters', values)}
              placeholder="Seleccionar letras"
            />

            <MultiSelectDropdown
              label="Orígenes"
              options={originOptions}
              selectedValues={selectedFilters.origins}
              onChange={(values) => updateFilters('origins', values)}
              placeholder="Seleccionar orígenes"
            />

            <MultiSelectDropdown
              label="Categorías gramaticales"
              options={categoryOptions}
              selectedValues={selectedFilters.categories}
              onChange={(values) => updateFilters('categories', values)}
              placeholder="Seleccionar categorías"
            />

            <MultiSelectDropdown
              label="Estilos de uso"
              options={styleOptions}
              selectedValues={selectedFilters.styles}
              onChange={(values) => updateFilters('styles', values)}
              placeholder="Seleccionar estilos"
            />
          </div>

          {renderFilterPills()}

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={handleClearFilters}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              Limpiar filtros
            </button>
            <button
              type="submit"
              className="bg-duech-blue rounded-lg px-5 py-2 text-sm font-semibold text-white shadow transition-colors hover:bg-blue-900"
            >
              Buscar con filtros
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
