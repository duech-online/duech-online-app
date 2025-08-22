export default function RecursosPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold text-duech-blue mb-12">Recursos</h1>
      
      <div className="prose prose-lg max-w-none">
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Sobre el Diccionario</h2>
          <p className="text-gray-700 mb-4">
            El Diccionario del uso del español de Chile (DUECh) es una obra lexicográfica 
            fundamental para comprender la riqueza y diversidad del español hablado en Chile.
          </p>
          <p className="text-gray-700">
            Este proyecto de digitalización busca hacer accesible esta invaluable herramienta 
            lingüística a todos los hablantes, estudiantes e investigadores del español chileno.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Características del DUECh</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Documentación exhaustiva de chilenismos y modismos</li>
            <li>Ejemplos de uso real extraídos de fuentes diversas</li>
            <li>Información sobre el origen etimológico de las palabras</li>
            <li>Categorización gramatical detallada</li>
            <li>Indicación de estilos de uso (formal, coloquial, vulgar, etc.)</li>
            <li>Variantes gráficas y expresiones relacionadas</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Enlaces de interés</h2>
          <p className="text-gray-700 mb-4">
            Próximamente agregaremos enlaces a recursos adicionales sobre lexicografía chilena 
            y estudios del español de Chile.
          </p>
        </div>
      </div>
    </div>
  );
}