'use client';

import { useMemo, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SearchBar from '@/app/ui/search-bar';
import { advancedSearch } from '@/app/lib/dictionary';
import { SearchResult } from '@/app/lib/definitions';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const rawCategories = searchParams.get('categories');
  const rawStyles = searchParams.get('styles');
  const rawOrigins = searchParams.get('origins');
  const rawLetters = searchParams.get('letters');

  const categories = useMemo(() => parseListParam(rawCategories), [rawCategories]);
  const styles = useMemo(() => parseListParam(rawStyles), [rawStyles]);
  const origins = useMemo(() => parseListParam(rawOrigins), [rawOrigins]);
  const letters = useMemo(() => parseListParam(rawLetters), [rawLetters]);

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    const performSearch = async () => {
      const hasCriteria =
        Boolean(query.trim()) ||
        categories.length > 0 ||
        styles.length > 0 ||
        origins.length > 0 ||
        letters.length > 0;

      if (!hasCriteria) {
        if (!isCancelled) {
          setResults([]);
          setTotalResults(0);
          setLoading(false);
        }
        return;
      }

      if (!isCancelled) {
        setLoading(true);
      }

      try {
        const searchData = await advancedSearch(
          {
            query: query.trim(),
            categories,
            styles,
            origins,
            letters,
          },
          1,
          1000
        );

        if (!isCancelled) {
          setResults(searchData.results);
          setTotalResults(searchData.pagination.total);
        }
      } catch (error) {
        console.error('Error searching:', error);
        if (!isCancelled) {
          setResults([]);
          setTotalResults(0);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    performSearch();

    return () => {
      isCancelled = true;
    };
  }, [query, categories, styles, origins, letters]);

  const initialFilters = useMemo(
    () => ({ categories, styles, origins, letters }),
    [categories, styles, origins, letters]
  );

  const hasAnyCriteria =
    Boolean(query.trim()) ||
    categories.length > 0 ||
    styles.length > 0 ||
    origins.length > 0 ||
    letters.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="text-duech-blue mb-6 text-4xl font-bold">Resultados de búsqueda</h1>
        <SearchBar initialValue={query} initialFilters={initialFilters} className="max-w-3xl" />
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
          {hasAnyCriteria && (
            <p className="mb-6 text-gray-600">
              {totalResults > 0
                ? `Se encontraron ${totalResults} resultado${totalResults !== 1 ? 's' : ''}`
                : 'No se encontraron resultados con los criterios seleccionados'}
              {query && totalResults > 0 ? ` para "${query}"` : ''}
            </p>
          )}

          {results.length > 0 ? (
            <div className="space-y-4">
              {results.map((result, index) => {
                const firstDefinition = result.word.values[0];

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
          ) : hasAnyCriteria ? (
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
              <p className="text-gray-600">
                Ajusta tu término de búsqueda o modifica las opciones avanzadas
              </p>
            </div>
          ) : (
            <div className="rounded-lg bg-white p-8 text-center shadow">
              <p className="text-gray-600">
                Ingresa un término o abre las opciones avanzadas para comenzar la búsqueda
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

function parseListParam(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}
