'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import SearchBar from '@/app/ui/search-bar';
import { searchDictionary } from '@/app/lib/dictionary';
import { SearchResult } from '@/app/lib/definitions';

function EditorSearchResults() {
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
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const hasCriteria =
      Boolean(query.trim()) ||
      categories.length > 0 ||
      styles.length > 0 ||
      origins.length > 0 ||
      letters.length > 0;

    if (!hasCriteria) {
      setResults([]);
      setTotalResults(0);
      setLoading(false);
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      try {
        const data = await searchDictionary(
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

        if (!cancelled) {
          setResults(data.results);
          setTotalResults(data.pagination.total);
        }
      } catch (error) {
        console.error('Error searching:', error);
        if (!cancelled) {
          setResults([]);
          setTotalResults(0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    performSearch();

    return () => {
      cancelled = true;
    };
  }, [query, categories, styles, origins, letters]);

  const trimmedQuery = query.trim();
  const hasAnyCriteria =
    Boolean(trimmedQuery) ||
    categories.length > 0 ||
    styles.length > 0 ||
    origins.length > 0 ||
    letters.length > 0;

  const initialFilters = useMemo(
    () => ({ categories, styles, origins, letters }),
    [categories, styles, origins, letters]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-duech-blue mb-2 text-4xl font-bold">Editor de Diccionario</h1>
            <p className="text-lg text-gray-700">Busca y edita palabras del diccionario</p>
          </div>
          <Link
            href="/editor/nuevo"
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-white transition-colors hover:bg-green-700"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nueva Palabra
          </Link>
        </div>

        <SearchBar
          placeholder="Buscar palabra para editar..."
          initialValue={trimmedQuery}
          initialFilters={initialFilters}
          searchPath="/editor"
          initialAdvancedOpen={true}
          className="max-w-3xl"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="animate-pulse rounded-lg bg-white p-4 shadow">
              <div className="mb-2 h-6 w-1/4 rounded bg-gray-200"></div>
              <div className="h-4 w-3/4 rounded bg-gray-200"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {hasAnyCriteria && (
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-600">
                {totalResults > 0
                  ? `Se encontraron ${totalResults} palabra${totalResults !== 1 ? 's' : ''}`
                  : 'No se encontraron resultados'}
                {trimmedQuery && totalResults > 0 ? ` para "${trimmedQuery}"` : ''}
              </p>
            </div>
          )}

          {results.length > 0 ? (
            <div className="overflow-hidden rounded-xl bg-white shadow-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Lema
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Raíz
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Letra
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Definiciones
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {results.map((result, index) => (
                    <tr key={`${result.word.lemma}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-duech-blue text-sm font-semibold">
                          {result.word.lemma}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{result.word.root || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          {result.letter.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {result.word.values.length} definición
                          {result.word.values.length !== 1 ? 'es' : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/palabra/${encodeURIComponent(result.word.lemma)}`}
                            className="text-gray-600 hover:text-gray-900"
                            title="Ver en diccionario público"
                          >
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </Link>
                          <Link
                            href={`/editor/${encodeURIComponent(result.word.lemma)}`}
                            className="font-medium text-blue-600 hover:text-blue-900"
                          >
                            Editar
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : hasAnyCriteria ? (
            <div className="rounded-lg bg-white p-12 text-center shadow">
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
                Ajusta tu término de búsqueda o modifica las opciones avanzadas.
              </p>
            </div>
          ) : (
            <div className="rounded-lg bg-white p-12 text-center shadow">
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
              <h3 className="mb-2 text-lg font-medium text-gray-900">Busca palabras para editar</h3>
              <p className="text-gray-600">
                Usa la búsqueda avanzada arriba para encontrar palabras por categorías, estilos,
                origen o letra.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function parseListParam(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="mb-4 h-10 w-1/3 rounded bg-gray-200"></div>
            <div className="mb-8 h-12 rounded bg-gray-200"></div>
          </div>
        </div>
      }
    >
      <EditorSearchResults />
    </Suspense>
  );
}
