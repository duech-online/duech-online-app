'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Popup from 'reactjs-popup';
import MultiSelectDropdown from '@/app/ui/multi-select-dropdown';
import SelectDropdown from '@/app/ui/select-dropdown';
import SearchBar from '@/app/ui/search-bar';
import { searchDictionary } from '@/app/lib/dictionary';
import { SearchResult } from '@/app/lib/definitions';
import {
  setCocinaSearchFilters,
  getCocinaSearchFilters,
  clearCocinaSearchFilters,
} from '@/app/lib/cookies';

interface User {
  id: number;
  username: string;
  email?: string;
  role: string;
}

interface Option {
  value: string;
  label: string;
}

const STATUS_OPTIONS: Option[] = [
  { value: 'draft', label: 'Borrador' },
  { value: 'in_review', label: 'En revisión' },
  { value: 'reviewed', label: 'Revisado' },
  { value: 'rejected', label: 'Rechazado' },
  { value: 'published', label: 'Publicado' },
];

type EditorSearchState = {
  query: string;
  filters: {
    categories: string[];
    styles: string[];
    origins: string[];
    letters: string[];
  };
  status: string;
  assignedTo: string[];
};

const createDefaultSearchState = (): EditorSearchState => ({
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

function EditorContent() {
  const [searchState, setSearchState] = useState<EditorSearchState>(() => createDefaultSearchState());
  const [isInitialized, setIsInitialized] = useState(false);

  // For add word modal
  const [newWordRoot, setNewWordRoot] = useState('');
  const [newWordLemma, setNewWordLemma] = useState('');
  const [newWordLetter, setNewWordLetter] = useState('');
  const [newWordAssignedTo, setNewWordAssignedTo] = useState<string[]>([]);

  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const restoreFromCache = useCallback(() => {
    const savedFilters = getCocinaSearchFilters();

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
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersResponse = await fetch('/api/users').then((r) => r.json());
        if (usersResponse.success) {
          setAvailableUsers(usersResponse.data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        restoreFromCache();
      }
    };

    loadUsers();
  }, [restoreFromCache]);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    setCocinaSearchFilters({
      query: searchState.query,
      selectedCategories: searchState.filters.categories,
      selectedStyles: searchState.filters.styles,
      selectedOrigins: searchState.filters.origins,
      selectedLetters: searchState.filters.letters,
      selectedStatus: searchState.status,
      selectedAssignedTo: searchState.assignedTo,
    });
  }, [isInitialized, searchState]);

  const handleSearchStateChange = useCallback(
    ({ query, filters }: { query: string; filters: EditorSearchState['filters'] }) => {
      setSearchState((prev) => ({
        ...prev,
        query,
        filters: {
          categories: [...filters.categories],
          styles: [...filters.styles],
          origins: [...filters.origins],
          letters: [...filters.letters],
        },
      }));
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
    async ({ query, filters }: { query: string; filters: EditorSearchState['filters'] }) => {
      setLoading(true);
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
          searchState.status,
          searchState.assignedTo
        );

        setResults(searchData.results);
        setSearchState((prev) => ({
          ...prev,
          query,
          filters: {
            categories: [...filters.categories],
            styles: [...filters.styles],
            origins: [...filters.origins],
            letters: [...filters.letters],
          },
        }));
      } catch (error) {
        console.error('Error in search:', error);
      } finally {
        setLoading(false);
      }
    },
    [searchState.assignedTo, searchState.status]
  );

  const handleClearAll = useCallback(() => {
    setSearchState(createDefaultSearchState());
    setResults([]);
    setHasSearched(false);
    clearCocinaSearchFilters();
  }, []);

  const handleAddWord = async () => {
    if (!newWordLemma.trim()) {
      alert('El lema es requerido');
      return;
    }

    try {
      // TODO: Call API to create word
      console.log('Add word:', {
        root: newWordRoot,
        lemma: newWordLemma,
        letter: newWordLetter,
        assignedTo: newWordAssignedTo,
      });

      // Clear form
      setNewWordRoot('');
      setNewWordLemma('');
      setNewWordLetter('');
      setNewWordAssignedTo([]);
    } catch (error) {
      console.error('Error adding word:', error);
      alert('Error al agregar la palabra');
    }
  };

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

  const hasExtraFilters = searchState.status.length > 0 || searchState.assignedTo.length > 0;
  const trimmedQuery = searchState.query.trim();

  const canExecuteSearch =
    trimmedQuery.length > 0 ||
    searchState.filters.categories.length > 0 ||
    searchState.filters.styles.length > 0 ||
    searchState.filters.origins.length > 0 ||
    searchState.filters.letters.length > 0 ||
    hasExtraFilters;

  const hasAnyState =
    searchState.query.length > 0 ||
    searchState.filters.categories.length > 0 ||
    searchState.filters.styles.length > 0 ||
    searchState.filters.origins.length > 0 ||
    searchState.filters.letters.length > 0 ||
    hasExtraFilters;

  const additionalFiltersConfig = useMemo(
    () => ({
      hasActive: hasExtraFilters,
      onClear: clearAdditionalFilters,
      render: () => (
        <>
          <SelectDropdown
            label="Estado"
            options={STATUS_OPTIONS}
            selectedValue={searchState.status}
            onChange={handleStatusChange}
            placeholder="Seleccionar estado"
          />
          <MultiSelectDropdown
            label="Asignado a"
            options={userOptions}
            selectedValues={searchState.assignedTo}
            onChange={handleAssignedChange}
            placeholder="Seleccionar usuario"
          />
        </>
      ),
    }),
    [
      clearAdditionalFilters,
      handleAssignedChange,
      handleStatusChange,
      hasExtraFilters,
      searchState.assignedTo,
      searchState.status,
      userOptions,
    ]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-duech-blue text-4xl font-bold">Editor de Diccionario</h1>
        <Popup
          trigger={
            <button className="bg-duech-blue rounded-full px-8 py-3 text-lg font-semibold text-white shadow-lg hover:bg-blue-800">
              Agregar palabra
            </button>
          }
          position="center center"
          modal
          overlayStyle={{ background: 'rgba(0, 0, 0, 0.8)' }}
          contentStyle={{
            background: 'transparent',
            border: 'none',
            width: 'auto',
          }}
          nested
        >
          {((close: () => void) => (
            <div className="relative w-[500px] rounded-lg bg-white p-6 shadow-xl">
              <button
                className="absolute right-3 top-3 text-2xl font-light leading-none text-gray-400 hover:text-gray-600"
                onClick={close}
              >
                &times;
              </button>

              <h3 className="text-duech-blue mb-4 text-xl font-semibold">Agregar palabra</h3>

              <div className="mb-4 flex flex-col gap-3">
                <div>
                  <label htmlFor="raiz" className="mb-1 block text-sm font-medium text-gray-900">
                    Raíz
                  </label>
                  <input
                    type="text"
                    id="raiz"
                    placeholder=""
                    value={newWordRoot}
                    onChange={(e) => setNewWordRoot(e.target.value)}
                    className="focus:border-duech-blue w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-duech-blue focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="lema" className="mb-1 block text-sm font-medium text-gray-900">
                    Lema
                  </label>
                  <input
                    type="text"
                    id="lema"
                    placeholder=""
                    value={newWordLemma}
                    onChange={(e) => setNewWordLemma(e.target.value)}
                    className="focus:border-duech-blue w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-duech-blue focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="letra" className="mb-1 block text-sm font-medium text-gray-900">
                    Letra
                  </label>
                  <input
                    type="text"
                    id="letra"
                    placeholder=""
                    value={newWordLetter}
                    onChange={(e) => setNewWordLetter(e.target.value)}
                    className="focus:border-duech-blue w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-duech-blue focus:border-transparent"
                  />
                </div>
              </div>
              <MultiSelectDropdown
                label="Asignado a"
                options={userOptions}
                selectedValues={newWordAssignedTo}
                onChange={setNewWordAssignedTo}
              />

              <div className="mt-5 flex justify-end">
                <button
                  className="bg-duech-blue rounded px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-800"
                  onClick={() => {
                    handleAddWord();
                    close();
                  }}
                >
                  Guardar
                </button>
              </div>
            </div>
          )) as unknown as React.ReactNode}
        </Popup>
      </div>

      {/* Main Search Section */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow-lg">
        <SearchBar
          placeholder="Buscar en lemmas y definiciones..."
          initialValue={searchState.query}
          initialFilters={searchState.filters}
          onSearch={executeSearch}
          onStateChange={handleSearchStateChange}
          onClearAll={handleClearAll}
          additionalFilters={additionalFiltersConfig}
          initialAdvancedOpen={
            searchState.filters.categories.length > 0 ||
            searchState.filters.styles.length > 0 ||
            searchState.filters.origins.length > 0 ||
            searchState.filters.letters.length > 0 ||
            hasExtraFilters
          }
        />

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => {
              if (!canExecuteSearch) return;
              executeSearch({ query: trimmedQuery, filters: searchState.filters });
            }}
            disabled={!canExecuteSearch || loading}
            className="bg-duech-blue rounded-lg px-6 py-2 text-sm font-semibold text-white shadow transition-colors hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Buscando…' : 'Buscar'}
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={!hasAnyState}
            className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Limpiar búsqueda
          </button>
        </div>
      </div>

      {/* Results Section */}
      <div>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="animate-pulse rounded-lg bg-white p-4 shadow">
                <div className="mb-2 h-6 w-1/4 rounded bg-gray-200"></div>
                <div className="h-4 w-3/4 rounded bg-gray-200"></div>
              </div>
            ))}
          </div>
        ) : hasSearched ? (
          results.length > 0 ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-gray-600">
                  Se encontraron {results.length} palabra{results.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="overflow-hidden rounded-xl bg-white shadow-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Lema
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Raíz
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Letra
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Definiciones
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {results.map((result, index) => {
                      // Check if word has published status to show preview
                      const isPublished = result.status === 'published';

                      // Get status label and color
                      const statusOption = STATUS_OPTIONS.find((opt) => opt.value === result.status);
                      const statusLabel = statusOption?.label || result.status || 'Desconocido';

                      // Color coding for status badges
                      const statusColors: Record<string, string> = {
                        draft: 'bg-gray-100 text-gray-800',
                        in_review: 'bg-yellow-100 text-yellow-800',
                        reviewed: 'bg-blue-100 text-blue-800',
                        rejected: 'bg-red-100 text-red-800',
                        published: 'bg-green-100 text-green-800',
                      };
                      const statusColor = statusColors[result.status || ''] || 'bg-gray-100 text-gray-800';

                      return (
                        <tr key={`${result.word.lemma}-${index}`} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="text-duech-blue text-sm font-semibold">
                              {result.word.lemma}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="text-sm text-gray-500">{result.word.root || '-'}</div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                              {result.letter.toUpperCase()}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}>
                              {statusLabel}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="text-sm text-gray-500">
                              {result.word.values.length} definición
                              {result.word.values.length !== 1 ? 'es' : ''}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-3">
                              {isPublished && (
                                <Link
                                href={`/ver/${encodeURIComponent(result.word.lemma)}`}
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
                              )}
                              <Link
                                href={`/editor/editar/${encodeURIComponent(result.word.lemma)}`}
                                className="font-medium text-blue-600 hover:text-blue-900"
                              >
                                Editar
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
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
          )
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
              origen, letra, estado o asignación.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br p-6">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-8">
              <h1 className="text-duech-blue mb-4 text-3xl font-bold">Editor de Diccionario</h1>
              <p className="text-gray-600">Cargando...</p>
            </div>
          </div>
        </div>
      }
    >
      <EditorContent />
    </Suspense>
  );
}
