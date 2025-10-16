import {
  ArrowRightIcon,
  InformationCircleIcon,
  CheckCircleIcon,
} from '@/components/icons';
import { Button } from '@/components/common/button';
import SearchBar from '@/components/search/search-bar';
import WordOfTheDay from '@/components/word/word-of-the-day';
import { isEditorMode } from '@/lib/editor-mode-server';

export default async function Home() {
  const editorMode = await isEditorMode();

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
        <WordOfTheDay editorMode={editorMode} />

        <div className="border-duech-blue card-hover rounded-xl border-t-4 bg-white p-8 shadow-lg">
          <h2 className="text-duech-blue mb-6 flex items-center text-2xl font-bold">
            <InformationCircleIcon className="mr-3 h-6 w-6 flex-shrink-0" />
            Acerca del DUECh
          </h2>
          <p className="mb-6 text-lg leading-relaxed text-gray-800">
            El Diccionario del uso del español de Chile (DUECh) es una obra lexicográfica que
            documenta el uso del español en Chile, incluyendo chilenismos, modismos y expresiones
            propias del país.
          </p>
          <div className="space-y-4">
            <div className="flex items-center text-gray-700">
              <CheckCircleIcon className="text-duech-gold mr-3 h-6 w-6 flex-shrink-0" />
              <span className="font-medium">Definiciones completas y contextualizadas</span>
            </div>
            <div className="flex items-center text-gray-700">
              <CheckCircleIcon className="text-duech-gold mr-3 h-6 w-6 flex-shrink-0" />
              <span className="font-medium">Ejemplos de uso real y contextual</span>
            </div>
            <div className="flex items-center text-gray-700">
              <CheckCircleIcon className="text-duech-gold mr-3 h-6 w-6 flex-shrink-0" />
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

        <Button
          href={editorMode ? '/editor/buscar' : '/buscar'}
          className="bg-duech-blue px-8 py-4 font-semibold text-white hover:bg-blue-800"
        >
          Abrir buscador <ArrowRightIcon className="ml-3 h-6 w-6 text-gray-50" />
        </Button>
      </div>
    </div>
  );
}
