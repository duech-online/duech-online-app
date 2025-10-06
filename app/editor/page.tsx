'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import MultiSelectDropdown from '@/app/ui/multi-select-dropdown';
import SelectDropdown from '@/app/ui/select-dropdown';
import FilterPill from '@/app/ui/filter-pill';
import {
  getAvailableCategories,
  getAvailableStyles,
  getAvailableOrigins,
  searchDictionary,
} from '@/app/lib/dictionary';
import { SearchResult } from '@/app/lib/definitions';
import { GRAMMATICAL_CATEGORIES, USAGE_STYLES } from '@/app/lib/definitions';
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

function EditorContent() {
  const [query, setQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedOrigins, setSelectedOrigins] = useState<string[]>([]);
  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedAssignedTo, setSelectedAssignedTo] = useState<string[]>([]);

  const [isInitialized, setIsInitialized] = useState(false);

  // For add word modal
  const [newWordRoot, setNewWordRoot] = useState('');
  const [newWordLemma, setNewWordLemma] = useState('');
  const [newWordLetter, setNewWordLetter] = useState('');
  const [newWordAssignedTo, setNewWordAssignedTo] = useState<string[]>([]);

  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableStyles, setAvailableStyles] = useState<string[]>([]);
  const [availableOrigins, setAvailableOrigins] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const alphabet = 'abcdefghijklmnñopqrstuvwxyz'.split('');

  // Save current filter state to cookies
  const saveFiltersToCache = () => {
    const filters = {
      query,
      selectedCategories,
      selectedStyles,
      selectedOrigins,
      selectedLetters,
      selectedStatus,
      selectedAssignedTo,
    };
    setCocinaSearchFilters(filters);
  };

  // Restore state from cookies
  const restoreFromCache = () => {
    const savedFilters = getCocinaSearchFilters();
    setQuery(savedFilters.query);
    setSelectedCategories(savedFilters.selectedCategories);
    setSelectedStyles(savedFilters.selectedStyles);
    setSelectedOrigins(savedFilters.selectedOrigins);
    setSelectedLetters(savedFilters.selectedLetters);
    setSelectedStatus(savedFilters.selectedStatus);
    setSelectedAssignedTo(savedFilters.selectedAssignedTo);
    setIsInitialized(true);
  };

  useEffect(() => {
    const loadData = async () => {
      const [cats, styles, origins, usersResponse] = await Promise.all([
        getAvailableCategories(),
        getAvailableStyles(),
        getAvailableOrigins(),
        fetch('/api/users').then((r) => r.json()),
      ]);

      setAvailableCategories(cats);
      setAvailableStyles(styles);
      setAvailableOrigins(origins);
      if (usersResponse.success) {
        setAvailableUsers(usersResponse.data);
      }

      // Restore state from cookies after options are loaded
      restoreFromCache();
    };
    loadData();
  }, []);

  // Save filters to cookies whenever filter state changes (after initialization)
  useEffect(() => {
    if (isInitialized) {
      saveFiltersToCache();
    }
  }, [
    query,
    selectedCategories,
    selectedStyles,
    selectedOrigins,
    selectedLetters,
    selectedStatus,
    selectedAssignedTo,
    isInitialized,
  ]);

  const handleSearch = async () => {
    setLoading(true);
    setHasSearched(true);

    try {
      const searchData = await searchDictionary(
        {
          query: query.trim(),
          categories: selectedCategories,
          styles: selectedStyles,
          origins: selectedOrigins,
          letters: selectedLetters,
        },
        1,
        1000,
        selectedStatus,
        selectedAssignedTo
      );

      setResults(searchData.results);
    } catch (error) {
      console.error('Error in search:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setQuery('');
    setSelectedCategories([]);
    setSelectedStyles([]);
    setSelectedOrigins([]);
    setSelectedLetters([]);
    setSelectedStatus('');
    setSelectedAssignedTo([]);
    setResults([]);
    setHasSearched(false);
    clearCocinaSearchFilters();
  };

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

  const categoryOptions = availableCategories.map((cat) => ({
    value: cat,
    label: GRAMMATICAL_CATEGORIES[cat] || cat,
  }));

  const styleOptions = availableStyles.map((style) => ({
    value: style,
    label: USAGE_STYLES[style] || style,
  }));

  const originOptions = availableOrigins.map((origin) => ({
    value: origin,
    label: origin,
  }));

  const letterOptions = alphabet.map((letter) => ({
    value: letter,
    label: letter.toUpperCase(),
  }));

  const userOptions = availableUsers
    .filter((user) => user.role === 'lexicographer')
    .map((user) => ({
      value: user.id.toString(),
      label: user.username,
    }));

  const removeCategoryFilter = (category: string) => {
    setSelectedCategories((prev) => prev.filter((c) => c !== category));
  };

  const removeStyleFilter = (style: string) => {
    setSelectedStyles((prev) => prev.filter((s) => s !== style));
  };

  const removeOriginFilter = (origin: string) => {
    setSelectedOrigins((prev) => prev.filter((o) => o !== origin));
  };

  const removeLetterFilter = (letter: string) => {
    setSelectedLetters((prev) => prev.filter((l) => l !== letter));
  };

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedStyles.length > 0 ||
    selectedOrigins.length > 0 ||
    selectedLetters.length > 0 ||
    selectedStatus.length > 0 ||
    selectedAssignedTo.length > 0 ||
    query;

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
          {...({} as any)}
        >
          {(close: () => void) => (
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
          )}
        </Popup>
      </div>

      {/* Main Search Section */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow-lg">
        {/* Primary Search Input */}
        <div className="mb-6">
          <label className="mb-3 block text-lg font-semibold text-gray-900">
            Término de búsqueda
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en lemmas y definiciones..."
            className="focus:border-duech-blue w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-lg transition-colors focus:outline-none"
          />
        </div>

        {/* Quick Filters Row */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

          <SelectDropdown
            label="Estado"
            options={STATUS_OPTIONS}
            selectedValue={selectedStatus}
            onChange={setSelectedStatus}
            placeholder="Seleccionar estado"
          />

          <MultiSelectDropdown
            label="Asignado a"
            options={userOptions}
            selectedValues={selectedAssignedTo}
            onChange={setSelectedAssignedTo}
            placeholder="Seleccionar usuario"
          />
        </div>

        {/* Active Filters Pills */}
        {hasActiveFilters && (
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Filtros activos:</span>
              <button onClick={clearFilters} className="text-duech-blue text-sm hover:underline">
                Limpiar todos
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedLetters.map((letter) => (
                <FilterPill
                  key={letter}
                  label={letter.toUpperCase()}
                  value={letter}
                  onRemove={removeLetterFilter}
                  variant="letter"
                />
              ))}
              {selectedOrigins.map((origin) => (
                <FilterPill
                  key={origin}
                  label={origin}
                  value={origin}
                  onRemove={removeOriginFilter}
                  variant="origin"
                />
              ))}
              {selectedCategories.map((category) => (
                <FilterPill
                  key={category}
                  label={GRAMMATICAL_CATEGORIES[category] || category}
                  value={category}
                  onRemove={removeCategoryFilter}
                  variant="category"
                />
              ))}
              {selectedStyles.map((style) => (
                <FilterPill
                  key={style}
                  label={USAGE_STYLES[style] || style}
                  value={style}
                  onRemove={removeStyleFilter}
                  variant="style"
                />
              ))}
              {selectedStatus && (
                <FilterPill
                  key={selectedStatus}
                  label={
                    STATUS_OPTIONS.find((opt) => opt.value === selectedStatus)?.label ||
                    selectedStatus
                  }
                  value={selectedStatus}
                  onRemove={() => setSelectedStatus('')}
                  variant="category"
                />
              )}
              {selectedAssignedTo.map((userId) => (
                <FilterPill
                  key={userId}
                  label={userOptions.find((opt) => opt.value === userId)?.label || userId}
                  value={userId}
                  onRemove={(value) =>
                    setSelectedAssignedTo((prev) => prev.filter((id) => id !== value))
                  }
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
            className="bg-duech-blue flex-1 rounded-lg py-3 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 md:flex-none md:px-8"
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
                              )}
                              <Link
                                href={`/editor/${encodeURIComponent(result.word.lemma)}`}
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
