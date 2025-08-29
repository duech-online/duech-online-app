import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getWordByLemmaServer } from '@/app/lib/dictionary-server';
import { GRAMMATICAL_CATEGORIES, USAGE_STYLES } from '@/app/lib/definitions';
import { Example } from '@/app/lib/definitions';
import MarkdownRenderer from '@/app/ui/markdown-renderer';

export default async function WordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const decodedLemma = decodeURIComponent(id);

  // Use server-side function for better performance in server components
  const wordData = await getWordByLemmaServer(decodedLemma);

  if (!wordData) {
    notFound();
  }

  const { word, letter } = wordData;

  const renderExample = (example: Example | Example[]) => {
    const examples = Array.isArray(example) ? example : [example];

    return examples.map((ex, index) => (
      <div key={index} className="rounded-lg border-l-4 border-blue-400 bg-gray-50 p-4">
        <div className="mb-2 text-gray-700">
          <MarkdownRenderer content={ex.value} />
        </div>
        <div className="text-sm text-gray-600">
          {ex.author && <span className="mr-3">Autor: {ex.author}</span>}
          {ex.source && <span className="mr-3">Fuente: {ex.source}</span>}
          {ex.date && <span className="mr-3">Fecha: {ex.date}</span>}
          {ex.page && <span>Página: {ex.page}</span>}
        </div>
      </div>
    ));
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              Inicio
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li>
            <Link href="/search" className="text-blue-600 hover:text-blue-800">
              Búsqueda
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-600">{word.lemma}</li>
        </ol>
      </nav>

      <div className="border-duech-gold rounded-xl border-t-4 bg-white p-10 shadow-2xl">
        <div className="mb-8">
          <div className="mb-3 flex items-baseline gap-4">
            <h1 className="text-duech-blue text-5xl font-bold">{word.lemma}</h1>
            <span className="text-duech-gold rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold uppercase">
              Letra {letter}
            </span>
          </div>
          {word.root !== word.lemma && (
            <p className="text-lg text-gray-700">
              Raíz: <span className="text-duech-blue font-semibold">{word.root}</span>
            </p>
          )}
        </div>

        <div className="space-y-8">
          {word.values.map((definition, defIndex) => (
            <div key={defIndex} className="border-b border-gray-200 pb-8 last:border-0">
              <div className="mb-4 flex items-start gap-6">
                <span className="bg-duech-blue inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold text-white">
                  {definition.number}
                </span>

                <div className="flex-1">
                  {definition.origin && (
                    <p className="mb-2 text-sm text-gray-600">
                      <span className="font-medium">Origen:</span> {definition.origin}
                    </p>
                  )}

                  {definition.categories.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {definition.categories.map((cat, catIndex) => (
                        <span
                          key={catIndex}
                          className="bg-duech-blue inline-block rounded-full px-4 py-2 text-sm font-semibold text-white"
                        >
                          {GRAMMATICAL_CATEGORIES[cat] || cat}
                        </span>
                      ))}
                    </div>
                  )}

                  {definition.remission ? (
                    <div>
                      <div className="mb-4">
                        <p className="text-lg text-gray-800">
                          Ver:{' '}
                          <Link
                            href={`/palabra/${encodeURIComponent(definition.remission)}`}
                            className="text-duech-blue hover:text-duech-gold font-bold transition-colors"
                          >
                            {definition.remission}
                          </Link>
                        </p>
                      </div>
                      <div className="mb-4 text-xl leading-relaxed text-gray-900">
                        <MarkdownRenderer content={definition.meaning} />
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 text-xl leading-relaxed text-gray-900">
                      <MarkdownRenderer content={definition.meaning} />
                    </div>
                  )}

                  {definition.styles && definition.styles.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {definition.styles.map((style, styleIndex) => (
                        <span
                          key={styleIndex}
                          className="bg-duech-gold inline-block rounded-full px-4 py-2 text-sm font-semibold text-gray-900"
                        >
                          {USAGE_STYLES[style] || style}
                        </span>
                      ))}
                    </div>
                  )}

                  {definition.observation && (
                    <div className="mb-3 rounded-lg bg-blue-50 p-3">
                      <p className="text-sm text-blue-900">
                        <span className="font-medium">Observación:</span> {definition.observation}
                      </p>
                    </div>
                  )}

                  {definition.example && (
                    <div className="mt-4">
                      <h3 className="mb-2 text-sm font-medium text-gray-900">
                        Ejemplo
                        {Array.isArray(definition.example) && definition.example.length > 1
                          ? 's'
                          : ''}
                        :
                      </h3>
                      <div className="space-y-2">{renderExample(definition.example)}</div>
                    </div>
                  )}

                  {definition.variant && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Variante:</span>{' '}
                        <span className="font-bold">{definition.variant}</span>
                      </p>
                    </div>
                  )}

                  {definition.expressions && definition.expressions.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-1 text-sm font-medium text-gray-900">Expresiones:</p>
                      <ul className="list-inside list-disc text-gray-700">
                        {definition.expressions.map((expr, exprIndex) => (
                          <li key={exprIndex} className="font-medium">
                            {expr}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between">
            <Link
              href="/search"
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
              Volver a búsqueda
            </Link>

            <Link
              href="/busqueda-avanzada"
              className="inline-flex items-center font-medium text-blue-600 hover:text-blue-800"
            >
              Búsqueda avanzada
              <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
