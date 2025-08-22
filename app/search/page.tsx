'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { searchWords } from '@/lib/dictionary';
import { SearchResult } from '@/types/dictionary';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  useEffect(() => {
    const performSearch = async () => {
      if (query) {
        setLoading(true);
        try {
          const searchData = await searchWords(query);
          setResults(searchData.results);
          setPagination(searchData.pagination);
        } catch (error) {
          console.error('Error searching:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setLoading(false);
      }
    };

    performSearch();
  }, [query]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-duech-blue mb-6">
          Resultados de búsqueda
        </h1>
        <SearchBar initialValue={query} className="max-w-3xl" />
      </div>

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
      ) : (
        <>
          {query && (
            <p className="text-gray-600 mb-6">
              {results.length > 0
                ? `Se encontraron ${results.length} resultado${results.length !== 1 ? 's' : ''} para "${query}"`
                : `No se encontraron resultados para "${query}"`}
            </p>
          )}

          {results.length > 0 ? (
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
                    className="block bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 p-8 border-l-4 border-duech-gold card-hover"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <h2 className="text-2xl font-bold text-duech-blue">
                            {result.word.lemma}
                          </h2>
                          {result.matchType === 'exact' && (
                            <span className="inline-flex items-center px-3 py-1 text-sm font-semibold bg-green-100 text-green-800 rounded-full">
                              Coincidencia exacta
                            </span>
                          )}
                        </div>
                        
                        {firstDefinition.categories.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {firstDefinition.categories.map((cat, catIndex) => (
                              <span
                                key={catIndex}
                                className="inline-block px-3 py-1 text-sm font-semibold bg-duech-blue text-white rounded-full"
                              >
                                {cat}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="text-gray-800 mb-3 text-lg leading-relaxed">
                          <MarkdownRenderer content={truncatedMeaning} />
                        </div>

                        {result.word.values.length > 1 && (
                          <p className="text-sm text-duech-blue font-medium">
                            {result.word.values.length} definicion{result.word.values.length > 1 ? 'es' : ''}
                          </p>
                        )}
                      </div>
                      
                      <svg
                        className="w-6 h-6 text-duech-gold ml-6 flex-shrink-0"
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
          ) : query ? (
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
              <p className="text-gray-600 mb-4">
                Intenta con otra palabra o utiliza la búsqueda avanzada
              </p>
              <Link
                href="/busqueda-avanzada"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                Ir a búsqueda avanzada
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600">
                Ingresa un término para comenzar la búsqueda
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-12 bg-gray-200 rounded mb-8"></div>
        </div>
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}