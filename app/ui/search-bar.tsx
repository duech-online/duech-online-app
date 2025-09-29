'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import MultiSelectDropdown from '@/app/ui/multi-select-dropdown';
import FilterPill from '@/app/ui/filter-pill';
import { getSearchMetadata, SearchFilters } from '@/app/lib/dictionary';
import { GRAMMATICAL_CATEGORIES, USAGE_STYLES } from '@/app/lib/definitions';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  initialValue?: string;
  initialFilters?: Partial<SearchFilters>;
}

type InternalFilters = Required<Omit<SearchFilters, 'query'>>;

type FilterVariant = 'category' | 'style' | 'origin' | 'letter';

const LETTER_OPTIONS = 'abcdefghijklmnñopqrstuvwxyz'.split('').map((letter) => ({
  value: letter,
  label: letter.toUpperCase(),
}));

const EMPTY_FILTERS: InternalFilters = {
  categories: [],
  styles: [],
  origins: [],
  letters: [],
};

export default function SearchBar({
  placeholder = 'Buscar palabra...',
  className = '',
  initialValue = '',
  initialFilters,
}: SearchBarProps) {
  const router = useRouter();

  const [query, setQuery] = useState(initialValue);
  const [filters, setFilters] = useState<InternalFilters>({
    categories: initialFilters?.categories ?? [],
    styles: initialFilters?.styles ?? [],
    origins: initialFilters?.origins ?? [],
    letters: initialFilters?.letters ?? [],
  });
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableStyles, setAvailableStyles] = useState<string[]>([]);
  const [availableOrigins, setAvailableOrigins] = useState<string[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(false);
  const [metadataLoaded, setMetadataLoaded] = useState(false);

  const hasActiveFilters = useMemo(
    () =>
      filters.categories.length > 0 ||
      filters.styles.length > 0 ||
      filters.origins.length > 0 ||
      filters.letters.length > 0,
    [filters]
  );

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  useEffect(() => {
    setFilters({
      categories: initialFilters?.categories ?? [],
      styles: initialFilters?.styles ?? [],
      origins: initialFilters?.origins ?? [],
      letters: initialFilters?.letters ?? [],
    });
    if (
      initialFilters &&
      ((initialFilters.categories && initialFilters.categories.length > 0) ||
        (initialFilters.styles && initialFilters.styles.length > 0) ||
        (initialFilters.origins && initialFilters.origins.length > 0) ||
        (initialFilters.letters && initialFilters.letters.length > 0))
    ) {
      setAdvancedOpen(true);
    }
  }, [initialFilters]);

  useEffect(() => {
    let isMounted = true;

    const loadMetadata = async () => {
      try {
        const metadata = await getSearchMetadata();

        if (!isMounted) return;

        setAvailableCategories(metadata.categories);
        setAvailableStyles(metadata.styles);
        setAvailableOrigins(metadata.origins);
        setMetadataLoaded(true);
      } catch (error) {
        console.error('Error loading metadata for search filters:', error);
        if (isMounted) {
          setMetadataLoaded(true);
        }
      }
    };

    loadMetadata();

    return () => {
      isMounted = false;
    };
  }, []);

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
    if (filters.categories.length) params.set('categories', filters.categories.join(','));
    if (filters.styles.length) params.set('styles', filters.styles.join(','));
    if (filters.origins.length) params.set('origins', filters.origins.join(','));
    if (filters.letters.length) params.set('letters', filters.letters.join(','));

    router.push(`/search${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const updateFilters = useCallback(<K extends keyof InternalFilters>(key: K, values: string[]) => {
    setFilters((prev) => ({ ...prev, [key]: values }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ ...EMPTY_FILTERS });
  }, []);

  const removeFilterValue = useCallback((key: keyof InternalFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].filter((item) => item !== value),
    }));
  }, []);

  const renderFilterPills = () => {
    const pills: Array<{ key: keyof InternalFilters; value: string; label: string; variant: FilterVariant }> = [];

    filters.categories.forEach((category) => {
      pills.push({
        key: 'categories',
        value: category,
        label: GRAMMATICAL_CATEGORIES[category] || category,
        variant: 'category',
      });
    });

    filters.styles.forEach((style) => {
      pills.push({
        key: 'styles',
        value: style,
        label: USAGE_STYLES[style] || style,
        variant: 'style',
      });
    });

    filters.origins.forEach((origin) => {
      pills.push({
        key: 'origins',
        value: origin,
        label: origin,
        variant: 'origin',
      });
    });

    filters.letters.forEach((letter) => {
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
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className="focus:border-duech-blue w-full rounded-xl border-2 border-gray-300 bg-white px-6 py-4 pr-28 text-lg text-gray-900 shadow-lg transition-all duration-200 focus:ring-4 focus:ring-blue-200 focus:outline-none"
        />
        <div className="absolute inset-y-0 right-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAdvancedOpen((prev) => !prev)}
            className="hover:text-duech-blue rounded-lg bg-gray-100 p-3 text-gray-600 transition-colors hover:bg-blue-50"
            aria-label={advancedOpen ? 'Ocultar opciones avanzadas' : 'Mostrar opciones avanzadas'}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.89 3.31.877 2.42 2.42a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.89 1.543-.877 3.31-2.42 2.42a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.89-3.31-.877-2.42-2.42a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.89-1.543.877-3.31 2.42-2.42.996.575 2.275.126 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            type="submit"
            className="hover:text-duech-blue rounded-lg bg-gray-100 p-3 text-gray-600 transition-colors hover:bg-blue-50"
            aria-label="Buscar"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>

      {advancedOpen && (
        <div className="border-duech-blue/20 mt-4 rounded-xl border bg-white p-6 shadow-sm">
          {!metadataLoaded ? (
            <div className="h-24 animate-pulse rounded bg-gray-100" />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MultiSelectDropdown
                label="Letras"
                options={LETTER_OPTIONS}
                selectedValues={filters.letters}
                onChange={(values) => updateFilters('letters', values)}
                placeholder="Seleccionar letras"
              />

              <MultiSelectDropdown
                label="Orígenes"
                options={originOptions}
                selectedValues={filters.origins}
                onChange={(values) => updateFilters('origins', values)}
                placeholder="Seleccionar orígenes"
              />

              <MultiSelectDropdown
                label="Categorías gramaticales"
                options={categoryOptions}
                selectedValues={filters.categories}
                onChange={(values) => updateFilters('categories', values)}
                placeholder="Seleccionar categorías"
              />

              <MultiSelectDropdown
                label="Estilos de uso"
                options={styleOptions}
                selectedValues={filters.styles}
                onChange={(values) => updateFilters('styles', values)}
                placeholder="Seleccionar estilos"
              />
            </div>
          )}

          {renderFilterPills()}

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              disabled={!hasActiveFilters}
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
