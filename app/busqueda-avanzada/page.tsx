'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MarkdownRenderer from '@/app/ui/markdown-renderer';
import {
  advancedSearch,
  getAvailableCategories,
  getAvailableStyles,
  getAvailableOrigins,
} from '@/app/lib/dictionary';
import { SearchResult } from '@/app/lib/types';
import { GRAMMATICAL_CATEGORIES, USAGE_STYLES } from '@/app/lib/types';

export default function AdvancedSearchPage() {
  const [query, setQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedOrigin, setSelectedOrigin] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('');

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

  const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

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
    };
    loadFilterOptions();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setHasSearched(true);

    try {
      const searchData = await advancedSearch({
        query: query.trim(),
        categories: selectedCategories,
        styles: selectedStyles,
        origin: selectedOrigin,
        letter: selectedLetter,
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
    setSelectedOrigin('');
    setSelectedLetter('');
    setResults([]);
    setHasSearched(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-duech-blue mb-10 text-4xl font-bold">Búsqueda Avanzada</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="border-duech-gold sticky top-4 rounded-xl border-t-4 bg-white p-8 shadow-lg">
            <h2 className="text-duech-blue mb-6 text-2xl font-bold">Filtros</h2>

            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Término de búsqueda
                </label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar en lemmas y definiciones..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Letra inicial
                </label>
                <select
                  value={selectedLetter}
                  onChange={(e) => setSelectedLetter(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Todas las letras</option>
                  {alphabet.map((letter) => (
                    <option key={letter} value={letter}>
                      {letter.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Categorías gramaticales
                </label>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {availableCategories.map((category) => (
                    <label key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => handleCategoryToggle(category)}
                        className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {GRAMMATICAL_CATEGORIES[category] || category}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Estilos de uso
                </label>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {availableStyles.map((style) => (
                    <label key={style} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedStyles.includes(style)}
                        onChange={() => handleStyleToggle(style)}
                        className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{USAGE_STYLES[style] || style}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Origen</label>
                <select
                  value={selectedOrigin}
                  onChange={(e) => setSelectedOrigin(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Todos los orígenes</option>
                  {availableOrigins.map((origin) => (
                    <option key={origin} value={origin}>
                      {origin}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSearch}
                  className="bg-duech-blue flex-1 rounded-lg px-6 py-3 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:bg-blue-800"
                >
                  Buscar
                </button>
                <button
                  onClick={clearFilters}
                  className="rounded-lg bg-gray-200 px-6 py-3 font-semibold text-gray-800 transition-colors hover:bg-gray-300"
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-lg bg-white p-6 shadow">
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
                        className="block rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="mb-2 text-xl font-bold text-gray-900">
                              {result.word.lemma}
                            </h3>

                            {firstDefinition.categories.length > 0 && (
                              <div className="mb-3 flex flex-wrap gap-1">
                                {firstDefinition.categories.map((cat, catIndex) => (
                                  <span
                                    key={catIndex}
                                    className="inline-block rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700"
                                  >
                                    {cat}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="mb-2 text-gray-700">
                              <MarkdownRenderer content={truncatedMeaning} />
                            </div>

                            {result.word.values.length > 1 && (
                              <p className="text-sm text-gray-500">
                                {result.word.values.length} definiciones
                              </p>
                            )}
                          </div>

                          <svg
                            className="ml-4 h-5 w-5 flex-shrink-0 text-gray-400"
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
              <div className="rounded-lg bg-white p-8 text-center shadow">
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
            <div className="rounded-lg bg-gray-50 p-8 text-center">
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
              <h3 className="mb-2 text-lg font-medium text-gray-900">Búsqueda avanzada</h3>
              <p className="text-gray-600">
                Utiliza los filtros de la izquierda para buscar palabras específicas
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
