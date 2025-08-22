import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getWordByLemmaServer } from '@/lib/dictionary-server';
import { GRAMMATICAL_CATEGORIES, USAGE_STYLES } from '@/types/dictionary';
import { Example } from '@/types/dictionary';

export default async function WordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decodedLemma = decodeURIComponent(id);
  const wordData = await getWordByLemmaServer(decodedLemma);

  if (!wordData) {
    notFound();
  }

  const { word, letter } = wordData;

  const renderExample = (example: Example | Example[]) => {
    const examples = Array.isArray(example) ? example : [example];
    
    return examples.map((ex, index) => (
      <div key={index} className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-400">
        <p className="text-gray-700 italic mb-2">{ex.value}</p>
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      <div className="bg-white rounded-xl shadow-2xl p-10 border-t-4 border-duech-gold">
        <div className="mb-8">
          <div className="flex items-baseline gap-4 mb-3">
            <h1 className="text-5xl font-bold text-duech-blue">{word.lemma}</h1>
            <span className="text-sm text-duech-gold font-semibold uppercase bg-yellow-100 px-3 py-1 rounded-full">Letra {letter}</span>
          </div>
          {word.root !== word.lemma && (
            <p className="text-gray-700 text-lg">
              Raíz: <span className="font-semibold text-duech-blue">{word.root}</span>
            </p>
          )}
        </div>

        <div className="space-y-8">
          {word.values.map((definition, defIndex) => (
            <div key={defIndex} className="border-b border-gray-200 pb-8 last:border-0">
              <div className="flex items-start gap-6 mb-4">
                <span className="inline-flex items-center justify-center w-10 h-10 bg-duech-blue text-white font-bold text-lg rounded-full flex-shrink-0">
                  {definition.number}
                </span>
                
                <div className="flex-1">
                  {definition.origin && (
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Origen:</span> {definition.origin}
                    </p>
                  )}

                  {definition.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {definition.categories.map((cat, catIndex) => (
                        <span
                          key={catIndex}
                          className="inline-block px-4 py-2 text-sm font-semibold bg-duech-blue text-white rounded-full"
                        >
                          {GRAMMATICAL_CATEGORIES[cat] || cat}
                        </span>
                      ))}
                    </div>
                  )}

                  {definition.remission ? (
                    <div className="mb-4">
                      <p className="text-gray-800 text-lg">
                        Ver: <Link 
                          href={`/palabra/${encodeURIComponent(definition.remission)}`}
                          className="font-bold text-duech-blue hover:text-duech-gold transition-colors"
                        >
                          {definition.remission}
                        </Link>
                      </p>
                    </div>
                  ) : (
                    <p className="text-xl text-gray-900 mb-4 leading-relaxed">
                      {definition.meaning}
                    </p>
                  )}

                  {definition.styles && definition.styles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {definition.styles.map((style, styleIndex) => (
                        <span
                          key={styleIndex}
                          className="inline-block px-4 py-2 text-sm font-semibold bg-duech-gold text-gray-900 rounded-full"
                        >
                          {USAGE_STYLES[style] || style}
                        </span>
                      ))}
                    </div>
                  )}

                  {definition.observation && (
                    <div className="bg-blue-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-blue-900">
                        <span className="font-medium">Observación:</span> {definition.observation}
                      </p>
                    </div>
                  )}

                  {definition.example && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">
                        Ejemplo{Array.isArray(definition.example) && definition.example.length > 1 ? 's' : ''}:
                      </h3>
                      <div className="space-y-2">
                        {renderExample(definition.example)}
                      </div>
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
                      <p className="text-sm font-medium text-gray-900 mb-1">Expresiones:</p>
                      <ul className="list-disc list-inside text-gray-700">
                        {definition.expressions.map((expr, exprIndex) => (
                          <li key={exprIndex} className="font-medium">{expr}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <Link
              href="/search"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver a búsqueda
            </Link>
            
            <Link
              href="/busqueda-avanzada"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              Búsqueda avanzada
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}