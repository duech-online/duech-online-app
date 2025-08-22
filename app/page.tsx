import SearchBar from '@/components/SearchBar';
import WordOfTheDay from '@/components/WordOfTheDay';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          <span className="text-duech-blue">Diccionario del uso del</span>
          <br />
          <span className="text-duech-gold">español de Chile</span>
        </h1>
        <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
          Explora la riqueza del español chileno a través de este diccionario digital. 
          Descubre chilenismos, modismos y expresiones únicas de nuestro país.
        </p>
      </div>

      <div className="max-w-2xl mx-auto mb-16">
        <SearchBar 
          placeholder="Buscar palabra en el diccionario..." 
          className="shadow-xl"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-10 mb-16">
        <WordOfTheDay />
        
        <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-duech-blue card-hover">
          <h2 className="text-2xl font-bold text-duech-blue mb-6 flex items-center">
            <svg className="w-8 h-8 mr-3 text-duech-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Acerca del DUECh
          </h2>
          <p className="text-gray-800 mb-6 leading-relaxed text-lg">
            El Diccionario del uso del español de Chile (DUECh) es una obra lexicográfica que documenta 
            el uso del español en Chile, incluyendo chilenismos, modismos y expresiones propias del país.
          </p>
          <div className="space-y-4">
            <div className="flex items-center text-gray-700">
              <svg className="w-6 h-6 mr-3 text-duech-gold flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Definiciones completas y contextualizadas</span>
            </div>
            <div className="flex items-center text-gray-700">
              <svg className="w-6 h-6 mr-3 text-duech-gold flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Ejemplos de uso real y contextual</span>
            </div>
            <div className="flex items-center text-gray-700">
              <svg className="w-6 h-6 mr-3 text-duech-gold flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Categorías gramaticales y estilos de uso</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-12 text-center border border-blue-200">
        <h2 className="text-3xl font-bold text-duech-blue mb-6">
          Explora el diccionario
        </h2>
        <p className="text-gray-700 mb-8 text-xl max-w-2xl mx-auto leading-relaxed">
          Utiliza nuestra búsqueda avanzada para encontrar palabras específicas por categoría, estilo de uso o origen etimológico
        </p>
        <a 
          href="/busqueda-avanzada" 
          className="inline-flex items-center px-8 py-4 bg-duech-blue text-white font-semibold text-lg rounded-lg hover:bg-blue-800 transition-all duration-200 transform hover:scale-105 shadow-lg"
        >
          Ir a Búsqueda Avanzada
          <svg className="w-6 h-6 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
      </div>
    </div>
  );
}