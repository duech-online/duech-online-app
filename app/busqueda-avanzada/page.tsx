'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  advancedSearch, 
  getAvailableCategories, 
  getAvailableStyles,
  getAvailableOrigins 
} from '@/lib/dictionary';
import { SearchResult } from '@/types/dictionary';
import { GRAMMATICAL_CATEGORIES, USAGE_STYLES } from '@/types/dictionary';

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

  const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

  useEffect(() => {
    const loadFilterOptions = async () => {
      const [cats, styles, origins] = await Promise.all([
        getAvailableCategories(),
        getAvailableStyles(),
        getAvailableOrigins()
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
      const searchResults = await advancedSearch({
        query: query.trim(),
        categories: selectedCategories,
        styles: selectedStyles,
        origin: selectedOrigin,
        letter: selectedLetter
      });
      setResults(searchResults);
    } catch (error) {
      console.error('Error in advanced search:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleStyleToggle = (style: string) => {
    setSelectedStyles(prev =>
      prev.includes(style)
        ? prev.filter(s => s !== style)
        : [...prev, style]
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-duech-blue mb-10">Búsqueda Avanzada</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-8 sticky top-4 border-t-4 border-duech-gold">
            <h2 className="text-2xl font-bold text-duech-blue mb-6">Filtros</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Término de búsqueda
                </label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar en lemmas y definiciones..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Letra inicial
                </label>
                <select
                  value={selectedLetter}
                  onChange={(e) => setSelectedLetter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">Todas las letras</option>
                  {alphabet.map(letter => (
                    <option key={letter} value={letter}>
                      {letter.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categorías gramaticales
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableCategories.map(category => (
                    <label key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => handleCategoryToggle(category)}
                        className="mr-2 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {GRAMMATICAL_CATEGORIES[category] || category}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estilos de uso
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableStyles.map(style => (
                    <label key={style} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedStyles.includes(style)}
                        onChange={() => handleStyleToggle(style)}
                        className="mr-2 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {USAGE_STYLES[style] || style}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Origen
                </label>
                <select
                  value={selectedOrigin}
                  onChange={(e) => setSelectedOrigin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">Todos los orígenes</option>
                  {availableOrigins.map(origin => (
                    <option key={origin} value={origin}>
                      {origin}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSearch}
                  className="flex-1 px-6 py-3 bg-duech-blue text-white font-semibold text-lg rounded-lg hover:bg-blue-800 transition-all duration-200 shadow-lg"
                >
                  Buscar
                </button>
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
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
                <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : hasSearched ? (
            results.length > 0 ? (
              <>
                <p className="text-gray-600 mb-4">
                  Se encontraron {results.length} resultado{results.length !== 1 ? 's' : ''}
                </p>
                <div className="space-y-4">
                  {results.map((result, index) => {
                    const firstDefinition = result.word.values[0];
                    const truncatedMeaning = firstDefinition.meaning.length > 200
                      ? firstDefinition.meaning.substring(0, 200) + '...'
                      : firstDefinition.meaning;

                    return (
                      <Link
                        key={`${result.word.lemma}-${index}`}
                        href={`/palabra/${encodeURIComponent(result.word.lemma)}`}
                        className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                              {result.word.lemma}
                            </h3>
                            
                            {firstDefinition.categories.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {firstDefinition.categories.map((cat, catIndex) => (
                                  <span
                                    key={catIndex}
                                    className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded"
                                  >
                                    {cat}
                                  </span>
                                ))}
                              </div>
                            )}

                            <p className="text-gray-700 mb-2">
                              {truncatedMeaning}
                            </p>

                            {result.word.values.length > 1 && (
                              <p className="text-sm text-gray-500">
                                {result.word.values.length} definiciones
                              </p>
                            )}
                          </div>
                          
                          <svg
                            className="w-5 h-5 text-gray-400 ml-4 flex-shrink-0"
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
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <svg
                  className="w-16 h-16 text-gray-400 mx-auto mb-4"
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron resultados
                </h3>
                <p className="text-gray-600">
                  Intenta ajustar los filtros de búsqueda
                </p>
              </div>
            )
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Búsqueda avanzada
              </h3>
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