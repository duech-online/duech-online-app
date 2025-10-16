/**
 * UI Components for search results display
 */

import { SadFaceIcon, SearchIcon } from '@/components/icons';

interface SearchLoadingSkeletonProps {
  editorMode: boolean;
  count?: number;
}

/**
 * Loading skeleton displayed while search is in progress
 */
export function SearchLoadingSkeleton({ editorMode, count = 5 }: SearchLoadingSkeletonProps) {
  const itemCount = editorMode ? count : 3;

  return (
    <div className="space-y-4">
      {[...Array(itemCount)].map((_, index) => (
        <div
          key={index}
          className={`animate-pulse rounded-lg bg-white ${editorMode ? 'p-4' : 'p-6'} shadow`}
        >
          <div className="mb-2 h-6 w-1/4 rounded bg-gray-200"></div>
          <div className={`${editorMode ? '' : 'mb-2'} h-4 w-3/4 rounded bg-gray-200`}></div>
          {!editorMode && <div className="h-4 w-1/2 rounded bg-gray-200"></div>}
        </div>
      ))}
    </div>
  );
}

interface EmptySearchStateProps {
  editorMode: boolean;
}

/**
 * Empty state shown when no search has been performed yet
 */
export function EmptySearchState({ editorMode }: EmptySearchStateProps) {
  return (
    <div className="rounded-lg bg-white p-12 text-center shadow">
      <SearchIcon className="mx-auto mb-4 h-16 w-16 text-gray-400" />
      <h3 className="mb-2 text-lg font-medium text-gray-900">
        {editorMode ? 'Busca palabras para editar' : 'Busca palabras en el diccionario'}
      </h3>
      <p className="text-gray-600">
        Usa la búsqueda avanzada arriba para encontrar palabras por categorías, estilos, origen o
        letra.
      </p>
    </div>
  );
}

interface NoResultsStateProps {
  editorMode: boolean;
}

/**
 * Empty state shown when search returns no results
 */
export function NoResultsState({ editorMode }: NoResultsStateProps) {
  return (
    <div className={`rounded-lg bg-white ${editorMode ? 'p-12' : 'p-8'} text-center shadow`}>
      <SadFaceIcon className="mx-auto mb-4 h-16 w-16 text-gray-400" />
      <h3 className="mb-2 text-lg font-medium text-gray-900">No se encontraron resultados</h3>
      <p className="text-gray-600">
        Ajusta tu término de búsqueda o modifica las opciones avanzadas.
      </p>
    </div>
  );
}

interface SearchResultsCountProps {
  editorMode: boolean;
  resultsCount: number;
  totalResults: number;
  query: string;
}

/**
 * Display count of search results
 */
export function SearchResultsCount({
  editorMode,
  resultsCount,
  totalResults,
  query,
}: SearchResultsCountProps) {
  const trimmedQuery = query.trim();

  const getMessage = () => {
    if (editorMode) {
      return `Se encontraron ${resultsCount} palabra${resultsCount !== 1 ? 's' : ''}`;
    }

    if (totalResults > 0) {
      const baseMessage = `Se encontraron ${totalResults} resultado${totalResults !== 1 ? 's' : ''}`;
      return trimmedQuery && totalResults > 0
        ? `${baseMessage} para "${trimmedQuery}"`
        : baseMessage;
    }

    return 'No se encontraron resultados con los criterios seleccionados';
  };

  return (
    <div className="mb-4 flex items-center justify-between">
      <p className="mb-6 text-gray-600">{getMessage()}</p>
    </div>
  );
}
