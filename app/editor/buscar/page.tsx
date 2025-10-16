'use client';

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Popup from 'reactjs-popup';
import { SelectDropdown, MultiSelectDropdown } from '@/app/ui/dropdown';
import { Button } from '@/app/ui/button';
import SearchBar from '@/app/ui/search-bar';
import { EyeIcon, SadFaceIcon, SearchIcon } from '@/app/ui/icons';
import { searchDictionary } from '@/app/lib/dictionary';
import { SearchResult } from '@/app/lib/definitions';
import { STATUS_OPTIONS } from '@/app/lib/definitions';
import {
  setEditorSearchFilters,
  getEditorSearchFilters,
  clearEditorSearchFilters,
} from '@/app/lib/cookies';

interface User {
  id: number;
  username: string;
  email?: string;
  role: string;
}

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

const LETTER_OPTIONS = 'abcdefghijklmnñopqrstuvwxyz'.split('').map((letter) => ({
  value: letter,
  label: letter.toUpperCase(),
}));

function EditorContent() {
  const router = useRouter();
  const [searchState, setSearchState] = useState<EditorSearchState>(() =>
    createDefaultSearchState()
  );
  const isInitializedRef = useRef(false);

  // For add word modal
  const [newWordRoot, setNewWordRoot] = useState('');
  const [newWordLemma, setNewWordLemma] = useState('');
  const [newWordLetter, setNewWordLetter] = useState('');
  const [newWordAssignedTo, setNewWordAssignedTo] = useState<string[]>([]);

  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Load users and restore filters on mount (only once)
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersResponse = await fetch('/api/users').then((r) => r.json());
        if (usersResponse.success) {
          setAvailableUsers(usersResponse.data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    const restoreFilters = () => {
      const savedFilters = getEditorSearchFilters();
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
      isInitializedRef.current = true;
    };

    loadUsers();
    restoreFilters();
  }, []);

  // Save filters function (called explicitly, not in useEffect)
  const saveFilters = useCallback(() => {
    if (!isInitializedRef.current) return;

    setEditorSearchFilters({
      query: searchState.query,
      selectedCategories: searchState.filters.categories,
      selectedStyles: searchState.filters.styles,
      selectedOrigins: searchState.filters.origins,
      selectedLetters: searchState.filters.letters,
      selectedStatus: searchState.status,
      selectedAssignedTo: searchState.assignedTo,
    });
  }, [searchState]);

  const handleSearchStateChange = useCallback(
    ({ query, filters }: { query: string; filters: EditorSearchState['filters'] }) => {
      setSearchState((prev) => {
        // Only update if values actually changed to prevent unnecessary re-renders
        const filtersChanged =
          prev.filters.categories.length !== filters.categories.length ||
          prev.filters.categories.some((cat, idx) => cat !== filters.categories[idx]) ||
          prev.filters.styles.length !== filters.styles.length ||
          prev.filters.styles.some((style, idx) => style !== filters.styles[idx]) ||
          prev.filters.origins.length !== filters.origins.length ||
          prev.filters.origins.some((origin, idx) => origin !== filters.origins[idx]) ||
          prev.filters.letters.length !== filters.letters.length ||
          prev.filters.letters.some((letter, idx) => letter !== filters.letters[idx]);

        const queryChanged = prev.query !== query;

        if (!filtersChanged && !queryChanged) {
          return prev;
        }

        return {
          ...prev,
          query,
          filters: filtersChanged
            ? {
                categories: [...filters.categories],
                styles: [...filters.styles],
                origins: [...filters.origins],
                letters: [...filters.letters],
              }
            : prev.filters,
        };
      });
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

        // Only update state if values changed
        setSearchState((prev) => {
          const filtersChanged =
            prev.filters.categories.length !== filters.categories.length ||
            prev.filters.categories.some((cat, idx) => cat !== filters.categories[idx]) ||
            prev.filters.styles.length !== filters.styles.length ||
            prev.filters.styles.some((style, idx) => style !== filters.styles[idx]) ||
            prev.filters.origins.length !== filters.origins.length ||
            prev.filters.origins.some((origin, idx) => origin !== filters.origins[idx]) ||
            prev.filters.letters.length !== filters.letters.length ||
            prev.filters.letters.some((letter, idx) => letter !== filters.letters[idx]);

          const queryChanged = prev.query !== query;

          if (!filtersChanged && !queryChanged) {
            return prev;
          }

          return {
            ...prev,
            query,
            filters: filtersChanged
              ? {
                  categories: [...filters.categories],
                  styles: [...filters.styles],
                  origins: [...filters.origins],
                  letters: [...filters.letters],
                }
              : prev.filters,
          };
        });

        // Save filters after successful search
        setTimeout(() => saveFilters(), 0);
      } catch (error) {
        console.error('Error in search:', error);
      } finally {
        setLoading(false);
      }
    },
    [saveFilters, searchState.assignedTo, searchState.status]
  );

  const handleClearAll = useCallback(() => {
    setSearchState(createDefaultSearchState());
    setResults([]);
    setHasSearched(false);
    clearEditorSearchFilters();
  }, []);

  const handleAddWord = useCallback(async () => {
    const trimmedLemma = newWordLemma.trim();
    if (!trimmedLemma) {
      alert('El lema es requerido');
      return false;
    }

    const rawAssignedTo = newWordAssignedTo.length > 0 ? parseInt(newWordAssignedTo[0], 10) : null;
    const assignedToValue =
      typeof rawAssignedTo === 'number' && Number.isInteger(rawAssignedTo) ? rawAssignedTo : null;
    const trimmedRoot = newWordRoot.trim();
    const autoLetter = trimmedLemma ? trimmedLemma[0].toLowerCase() : '';
    const trimmedLetter = newWordLetter.trim().toLowerCase();
    const letterToSend = trimmedLetter || autoLetter;

    try {
      const response = await fetch(`/api/words/${encodeURIComponent(trimmedLemma)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lemma: trimmedLemma,
          root: trimmedRoot,
          letter: letterToSend || undefined,
          assignedTo: assignedToValue,
          values: [],
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          (result && typeof result.error === 'string' && result.error) ||
          'Error al agregar la palabra';
        throw new Error(message);
      }

      const createdLemma =
        (result &&
          result.data &&
          typeof result.data.lemma === 'string' &&
          result.data.lemma.trim()) ||
        trimmedLemma;

      setNewWordRoot('');
      setNewWordLemma('');
      setNewWordLetter('');
      setNewWordAssignedTo([]);

      router.push(`/editor/editar/${encodeURIComponent(createdLemma)}`);
      return true;
    } catch (error) {
      console.error('Error adding word:', error);
      alert(error instanceof Error ? error.message : 'Error al agregar la palabra');
      return false;
    }
  }, [newWordAssignedTo, newWordLemma, newWordLetter, newWordRoot, router]);

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
  const autoLetterForLemma = newWordLemma.trim().charAt(0).toLowerCase();
  const selectedLetter = newWordLetter || autoLetterForLemma;

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

  // Memoize filter components separately to prevent re-renders
  const statusFilter = useMemo(
    () => (
      <SelectDropdown
        key="status-filter"
        label="Estado"
        options={STATUS_OPTIONS}
        selectedValue={searchState.status}
        onChange={handleStatusChange}
        placeholder="Seleccionar estado"
      />
    ),
    [searchState.status, handleStatusChange]
  );

  const assignedFilter = useMemo(
    () => (
      <MultiSelectDropdown
        key="assigned-filter"
        label="Asignado a"
        options={userOptions}
        selectedValues={searchState.assignedTo}
        onChange={handleAssignedChange}
        placeholder="Seleccionar usuario"
      />
    ),
    [searchState.assignedTo, userOptions, handleAssignedChange]
  );

  const additionalFiltersConfig = useMemo(
    () => ({
      hasActive: hasExtraFilters,
      onClear: clearAdditionalFilters,
      render: () => (
        <>
          {statusFilter}
          {assignedFilter}
        </>
      ),
    }),
    [clearAdditionalFilters, hasExtraFilters, statusFilter, assignedFilter]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-duech-blue text-4xl font-bold">Editor de Diccionario</h1>
        <Popup
          trigger={
            <Button className="bg-duech-blue rounded-full px-8 py-3 text-lg font-semibold text-white shadow-lg hover:bg-blue-800">
              Agregar palabra
            </Button>
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
          {
            ((close: () => void) => (
              <div className="relative w-[500px] rounded-lg bg-white p-6 shadow-xl">
                <Button
                  className="absolute top-3 right-3 text-2xl leading-none font-light text-gray-400 hover:text-gray-600"
                  onClick={close}
                >
                  &times;
                </Button>

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
                      className="focus:border-duech-blue focus:ring-duech-blue w-full rounded border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:outline-none"
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
                      className="focus:border-duech-blue focus:ring-duech-blue w-full rounded border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:outline-none"
                    />
                  </div>
                  <div>
                    <SelectDropdown
                      label="Letra"
                      options={[{ value: '', label: 'Seleccionar letra' }, ...LETTER_OPTIONS]}
                      selectedValue={selectedLetter}
                      onChange={(value) => setNewWordLetter(value.toLowerCase())}
                      placeholder="Seleccionar letra"
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
                  <Button
                    className="bg-duech-blue rounded px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-800"
                    onClick={async () => {
                      const created = await handleAddWord();
                      if (created) {
                        close();
                      }
                    }}
                  >
                    Guardar
                  </Button>
                </div>
              </div>
            )) as unknown as React.ReactNode
          }
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
      </div>

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
                        Estado
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
                    {results.map((result, index) => {
                      // Check if word has published status to show preview
                      const isPublished = result.status === 'published';

                      // Get status label and color
                      const statusOption = STATUS_OPTIONS.find(
                        (opt) => opt.value === result.status
                      );
                      const statusLabel = statusOption?.label || result.status || 'Desconocido';

                      // Color coding for status badges
                      const statusColors: Record<string, string> = {
                        draft: 'bg-gray-100 text-gray-800',
                        in_review: 'bg-yellow-100 text-yellow-800',
                        reviewed: 'bg-blue-100 text-blue-800',
                        rejected: 'bg-red-100 text-red-800',
                        published: 'bg-green-100 text-green-800',
                      };
                      const statusColor =
                        statusColors[result.status || ''] || 'bg-gray-100 text-gray-800';

                      return (
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
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}
                            >
                              {statusLabel}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {result.word.values.length} definici
                              {result.word.values.length !== 1 ? 'ones' : 'ón'}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                            <div className="flex items-center justify-end gap-3">
                              {isPublished && (
                                <Link
                                  href={`/ver/${encodeURIComponent(result.word.lemma)}`}
                                  className="text-gray-600 hover:text-gray-900"
                                  title="Ver en diccionario público"
                                >
                                  <EyeIcon className="h-5 w-5" />
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
              <SadFaceIcon className="mx-auto mb-4 h-16 w-16 text-gray-400" />
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
            <SearchIcon className="mx-auto mb-4 h-16 w-16 text-gray-400" />
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
