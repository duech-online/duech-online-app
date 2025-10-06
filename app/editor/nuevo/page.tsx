import Link from 'next/link';

export default function NewWordPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link href="/editor" className="text-blue-600 hover:text-blue-800">
              Editor
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-600">Nueva Palabra</li>
        </ol>
      </nav>

      <div className="rounded-xl bg-white p-10 shadow-lg">
        <div className="mb-8">
          <h1 className="text-duech-blue mb-4 text-4xl font-bold">Crear Nueva Palabra</h1>
          <p className="text-lg text-gray-700">Agrega una nueva palabra al diccionario</p>
        </div>

        {/* Placeholder content */}
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            Formulario de creación en desarrollo
          </h3>
          <p className="mb-6 text-gray-600">
            Esta funcionalidad estará disponible próximamente. Permitirá crear palabras con:
          </p>
          <div className="mx-auto max-w-md text-left">
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <svg
                  className="mt-0.5 h-5 w-5 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Lema y raíz de la palabra</span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="mt-0.5 h-5 w-5 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Una o más definiciones</span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="mt-0.5 h-5 w-5 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Categorías gramaticales</span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="mt-0.5 h-5 w-5 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Estilos de uso y origen</span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="mt-0.5 h-5 w-5 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Ejemplos de uso con metadatos</span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="mt-0.5 h-5 w-5 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Expresiones y variantes</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8">
          <Link
            href="/editor"
            className="inline-flex items-center font-medium text-blue-600 hover:text-blue-800"
          >
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Volver al editor
          </Link>
        </div>
      </div>
    </div>
  );
}
