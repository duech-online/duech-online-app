'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import MultiSelectDropdown from '@/components/MultiSelectDropdown';
import FilterPill from '@/components/FilterPill';
import CollapsibleSection from '@/components/CollapsibleSection';
import {
  advancedSearch,
  getAvailableCategories,
  getAvailableStyles,
  getAvailableOrigins,
} from '@/lib/dictionary';
import { SearchResult } from '@/types/dictionary';
import { GRAMMATICAL_CATEGORIES, USAGE_STYLES } from '@/types/dictionary';

export default function AdvancedSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Auth is enforced by middleware; no server-only imports here.

  const [query, setQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedOrigins, setSelectedOrigins] = useState<string[]>([]);
  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableStyles, setAvailableStyles] = useState<string[]>([]);
  const [availableOrigins, setAvailableOrigins] = useState<string[]>([]);

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 1000,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const alphabet = 'abcdefghijklmnñopqrstuvwxyz'.split('');

  // Function to update URL with current filter state
  const updateURL = () => {
    const params = new URLSearchParams();
    
    if (query) params.set('q', query);
    if (selectedCategories.length) params.set('categories', selectedCategories.join(','));
    if (selectedStyles.length) params.set('styles', selectedStyles.join(','));
    if (selectedOrigins.length) params.set('origins', selectedOrigins.join(','));
    if (selectedLetters.length) params.set('letters', selectedLetters.join(','));
    
    const newUrl = params.toString() ? `?${params.toString()}` : '/busqueda-avanzada';
    window.history.replaceState({}, '', newUrl);
  };

  // Function to restore state from URL parameters
  const restoreFromURL = () => {
    const q = searchParams.get('q') || '';
    const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
    const styles = searchParams.get('styles')?.split(',').filter(Boolean) || [];
    const origins = searchParams.get('origins')?.split(',').filter(Boolean) || [];
    const letters = searchParams.get('letters')?.split(',').filter(Boolean) || [];
    
    setQuery(q);
    setSelectedCategories(categories);
    setSelectedStyles(styles);
    setSelectedOrigins(origins);
    setSelectedLetters(letters);
    setIsInitialized(true);
  };

  useEffect(() => {
    const loadFilterOptions = async () => {
      const [cats, styles, origins] = await Promise.all([
        getAvailableCategories(),
        getAvailableStyles(),
        getAvailableOrigins(),
      ]);
      setAvailableCategories(cats);
      setAvailableStyles(styles);
      setAvailableOrigins(origins);
      
      // Restore state from URL after options are loaded
      restoreFromURL();
    };
    loadFilterOptions();
  }, []);

  // Update URL whenever filter state changes (after initialization)
  useEffect(() => {
    if (isInitialized) {
      updateURL();
    }
  }, [query, selectedCategories, selectedStyles, selectedOrigins, selectedLetters, isInitialized]);

  const handleSearch = async () => {
    setLoading(true);
    setHasSearched(true);

    try {
      const searchData = await advancedSearch({
        query: query.trim(),
        categories: selectedCategories,
        styles: selectedStyles,
        origins: selectedOrigins,
        letters: selectedLetters,
      });
      setResults(searchData.results);
      setPagination(searchData.pagination);
    } catch (error) {
      console.error('Error in advanced search:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const handleStyleToggle = (style: string) => {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const clearFilters = () => {
    setQuery('');
    setSelectedCategories([]);
    setSelectedStyles([]);
    setSelectedOrigins([]);
    setSelectedLetters([]);
    setResults([]);
    setHasSearched(false);
    // Clear URL parameters
    window.history.replaceState({}, '', '/busqueda-avanzada');
  };

  const categoryOptions = availableCategories.map(cat => ({
    value: cat,
    label: GRAMMATICAL_CATEGORIES[cat] || cat
  }));

  const styleOptions = availableStyles.map(style => ({
    value: style,
    label: USAGE_STYLES[style] || style
  }));

  const originOptions = availableOrigins.map(origin => ({
    value: origin,
    label: origin
  }));

  const letterOptions = alphabet.map(letter => ({
    value: letter,
    label: letter.toUpperCase()
  }));

  const removeCategoryFilter = (category: string) => {
    setSelectedCategories(prev => prev.filter(c => c !== category));
  };

  const removeStyleFilter = (style: string) => {
    setSelectedStyles(prev => prev.filter(s => s !== style));
  };

  const removeOriginFilter = (origin: string) => {
    setSelectedOrigins(prev => prev.filter(o => o !== origin));
  };

  const removeLetterFilter = (letter: string) => {
    setSelectedLetters(prev => prev.filter(l => l !== letter));
  };

  const hasActiveFilters = selectedCategories.length > 0 || selectedStyles.length > 0 || selectedOrigins.length > 0 || selectedLetters.length > 0 || query;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-duech-blue mb-8 text-4xl font-bold">Búsqueda Avanzada</h1>

      {/* Main Search Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        {/* Primary Search Input */}
        <div className="mb-6">
          <label className="block text-lg font-semibold text-gray-900 mb-3">
            Término de búsqueda
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en lemmas y definiciones..."
            className="w-full text-lg rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-duech-blue focus:outline-none transition-colors"
          />
        </div>

        {/* Quick Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MultiSelectDropdown
            label="Letras"
            options={letterOptions}
            selectedValues={selectedLetters}
            onChange={setSelectedLetters}
            placeholder="Seleccionar letras"
          />

          <MultiSelectDropdown
            label="Orígenes"
            options={originOptions}
            selectedValues={selectedOrigins}
            onChange={setSelectedOrigins}
            placeholder="Seleccionar orígenes"
          />

          <MultiSelectDropdown
            label="Categorías"
            options={categoryOptions}
            selectedValues={selectedCategories}
            onChange={setSelectedCategories}
            placeholder="Seleccionar categorías"
          />

          <MultiSelectDropdown
            label="Estilos"
            options={styleOptions}
            selectedValues={selectedStyles}
            onChange={setSelectedStyles}
            placeholder="Seleccionar estilos"
          />
        </div>

        {/* Active Filters Pills */}
        {hasActiveFilters && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-700">Filtros activos:</span>
              <button
                onClick={clearFilters}
                className="text-sm text-duech-blue hover:underline"
              >
                Limpiar todos
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedLetters.map(letter => (
                <FilterPill
                  key={letter}
                  label={letter.toUpperCase()}
                  value={letter}
                  onRemove={removeLetterFilter}
                  variant="letter"
                />
              ))}
              {selectedOrigins.map(origin => (
                <FilterPill
                  key={origin}
                  label={origin}
                  value={origin}
                  onRemove={removeOriginFilter}
                  variant="origin"
                />
              ))}
              {selectedCategories.map(category => (
                <FilterPill
                  key={category}
                  label={GRAMMATICAL_CATEGORIES[category] || category}
                  value={category}
                  onRemove={removeCategoryFilter}
                  variant="category"
                />
              ))}
              {selectedStyles.map(style => (
                <FilterPill
                  key={style}
                  label={USAGE_STYLES[style] || style}
                  value={style}
                  onRemove={removeStyleFilter}
                  variant="style"
                />
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-duech-blue flex-1 md:flex-none md:px-8 rounded-lg py-3 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
          <button
            onClick={clearFilters}
            className="rounded-lg bg-gray-200 px-6 py-3 font-semibold text-gray-800 transition-colors hover:bg-gray-300"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Results Section */}
      <div>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl bg-white p-8 shadow-lg">
                  <div className="mb-2 h-6 w-1/4 rounded bg-gray-200"></div>
                  <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
                  <div className="h-4 w-1/2 rounded bg-gray-200"></div>
                </div>
              ))}
            </div>
          ) : hasSearched ? (
            results.length > 0 ? (
              <>
                <p className="mb-4 text-gray-600">
                  Se encontraron {results.length} resultado{results.length !== 1 ? 's' : ''}
                </p>
                <div className="space-y-4">
                  {results.map((result, index) => {
                    const firstDefinition = result.word.values[0];
                    const truncatedMeaning =
                      firstDefinition.meaning.length > 200
                        ? firstDefinition.meaning.substring(0, 200) + '...'
                        : firstDefinition.meaning;

                    return (
                      <Link
                        key={`${result.word.lemma}-${index}`}
                        href={`/palabra/${encodeURIComponent(result.word.lemma)}`}
                        className="card-hover block rounded-xl border-l-4 border-duech-gold bg-white p-6 shadow-lg transition-all duration-200 hover:shadow-xl"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="mb-2 text-2xl font-bold text-duech-blue">
                              {result.word.lemma}
                            </h3>

                            {firstDefinition.categories.length > 0 && (
                              <div className="mb-3 flex flex-wrap gap-1">
                                {firstDefinition.categories.map((cat, catIndex) => (
                                  <span
                                    key={catIndex}
                                    className="inline-block rounded-full bg-duech-blue px-3 py-1 text-sm font-semibold text-white"
                                  >
                                    {cat}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="mb-3 text-lg leading-relaxed text-gray-800">
                              <MarkdownRenderer content={truncatedMeaning} />
                            </div>

                            {result.word.values.length > 1 && (
                              <p className="text-duech-blue text-sm font-medium">
                                {result.word.values.length} definicion{result.word.values.length > 1 ? 'es' : ''}
                              </p>
                            )}
                          </div>

                          <svg
                            className="text-duech-gold ml-6 h-6 w-6 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="rounded-xl bg-white p-8 text-center shadow-lg">
                <svg
                  className="mx-auto mb-4 h-16 w-16 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  No se encontraron resultados
                </h3>
                <p className="text-gray-600">Intenta ajustar los filtros de búsqueda</p>
              </div>
            )
          ) : (
            <div className="rounded-xl bg-white p-8 text-center shadow-lg">
              <svg
                className="mx-auto mb-4 h-16 w-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h3 className="mb-2 text-xl font-semibold text-duech-blue">Búsqueda avanzada</h3>
              <p className="text-gray-600">
                Configura los filtros arriba y haz clic en "Buscar" para encontrar palabras específicas
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
