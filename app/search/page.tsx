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
    hasPrev: false,
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
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="text-duech-blue mb-6 text-4xl font-bold">Resultados de búsqueda</h1>
        <SearchBar initialValue={query} className="max-w-3xl" />
      </div>

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
      ) : (
        <>
          {query && (
            <p className="mb-6 text-gray-600">
              {results.length > 0
                ? `Se encontraron ${results.length} resultado${results.length !== 1 ? 's' : ''} para "${query}"`
                : `No se encontraron resultados para "${query}"`}
            </p>
          )}

          {results.length > 0 ? (
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
                    className="border-duech-gold card-hover block rounded-xl border-l-4 bg-white p-8 shadow-lg transition-all duration-200 hover:shadow-xl"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-3 flex items-center gap-4">
                          <h2 className="text-duech-blue text-2xl font-bold">
                            {result.word.lemma}
                          </h2>
                          {result.matchType === 'exact' && (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                              Coincidencia exacta
                            </span>
                          )}
                        </div>

                        {firstDefinition.categories.length > 0 && (
                          <div className="mb-4 flex flex-wrap gap-2">
                            {firstDefinition.categories.map((cat, catIndex) => (
                              <span
                                key={catIndex}
                                className="bg-duech-blue inline-block rounded-full px-3 py-1 text-sm font-semibold text-white"
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
                            {result.word.values.length} definicion
                            {result.word.values.length > 1 ? 'es' : ''}
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
          ) : query ? (
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
              <p className="mb-4 text-gray-600">
                Intenta con otra palabra o utiliza la búsqueda avanzada
              </p>
              <Link
                href="/busqueda-avanzada"
                className="inline-flex items-center font-medium text-blue-600 hover:text-blue-800"
              >
                Ir a búsqueda avanzada
                <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="rounded-lg bg-white p-8 text-center shadow">
              <p className="text-gray-600">Ingresa un término para comenzar la búsqueda</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="mb-4 h-8 w-1/4 rounded bg-gray-200"></div>
            <div className="mb-8 h-12 rounded bg-gray-200"></div>
          </div>
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
