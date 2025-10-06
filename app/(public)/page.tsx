import Link from 'next/link';
import SearchBar from '@/app/ui/search-bar';
import WordOfTheDay from '@/app/ui/word-of-the-day';

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-16 text-center">
        <h1 className="mb-6 text-5xl font-bold text-gray-900">
          <span className="text-duech-blue">Diccionario del uso del</span>
          <br />
          <span className="text-duech-gold">español de Chile</span>
        </h1>
        <p className="mx-auto max-w-3xl text-xl leading-relaxed text-gray-700">
          Explora la riqueza del español chileno a través de este diccionario digital. Descubre
          chilenismos, modismos y expresiones únicas de nuestro país.
        </p>
      </div>

      <div className="mx-auto mb-16 max-w-2xl">
        <SearchBar placeholder="Buscar palabra en el diccionario..." className="shadow-xl" />
      </div>

      <div className="mb-16 grid gap-10 md:grid-cols-2">
        <WordOfTheDay />

        <div className="border-duech-blue card-hover rounded-xl border-t-4 bg-white p-8 shadow-lg">
          <h2 className="text-duech-blue mb-6 flex items-center text-2xl font-bold">
            <svg
              className="text-duech-gold mr-3 h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Acerca del DUECh
          </h2>
          <p className="mb-6 text-lg leading-relaxed text-gray-800">
            El Diccionario del uso del español de Chile (DUECh) es una obra lexicográfica que
            documenta el uso del español en Chile, incluyendo chilenismos, modismos y expresiones
            propias del país.
          </p>
          <div className="space-y-4">
            <div className="flex items-center text-gray-700">
              <svg
                className="text-duech-gold mr-3 h-6 w-6 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">Definiciones completas y contextualizadas</span>
            </div>
            <div className="flex items-center text-gray-700">
              <svg
                className="text-duech-gold mr-3 h-6 w-6 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">Ejemplos de uso real y contextual</span>
            </div>
            <div className="flex items-center text-gray-700">
              <svg
                className="text-duech-gold mr-3 h-6 w-6 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">Categorías gramaticales y estilos de uso</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-12 text-center">
        <h2 className="text-duech-blue mb-6 text-3xl font-bold">Explora el diccionario</h2>
        <p className="mx-auto mb-8 max-w-2xl text-xl leading-relaxed text-gray-700">
          Personaliza tus búsquedas con filtros por categoría, estilo de uso, origen o letra inicial
          directamente desde la barra de búsqueda.
        </p>
        <Link
          href="/search"
          className="bg-duech-blue inline-flex transform items-center rounded-lg px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-blue-800"
        >
          Abrir buscador
          <svg className="ml-3 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}
