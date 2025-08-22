export default function AcercaPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold text-duech-blue mb-12">Acerca del Proyecto</h1>
      
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Digitalización del DUECh</h2>
          <p className="text-gray-700 mb-4">
            Este proyecto representa un esfuerzo por digitalizar y hacer accesible el 
            Diccionario del uso del español de Chile (DUECh), una obra fundamental para 
            la comprensión y estudio del español chileno.
          </p>
          <p className="text-gray-700">
            La plataforma web permite realizar búsquedas rápidas y avanzadas, explorar 
            definiciones completas, y descubrir la riqueza del léxico chileno de manera 
            interactiva y accesible.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Objetivos</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Preservar y difundir el patrimonio lingüístico de Chile</li>
            <li>Facilitar el acceso a información lexicográfica especializada</li>
            <li>Apoyar la investigación y enseñanza del español chileno</li>
            <li>Documentar la evolución del lenguaje y sus usos</li>
            <li>Promover el conocimiento y valoración de la diversidad lingüística</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Tecnología</h2>
          <p className="text-gray-700 mb-4">
            Esta aplicación web ha sido desarrollada utilizando tecnologías modernas para 
            garantizar una experiencia de usuario óptima:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Next.js 14 con App Router para un rendimiento óptimo</li>
            <li>TypeScript para mayor robustez del código</li>
            <li>TailwindCSS para un diseño responsivo y moderno</li>
            <li>Arquitectura modular preparada para integración con Neo4j</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Desarrollo Futuro</h2>
          <p className="text-gray-700 mb-4">
            Este MVP es el primer paso hacia una plataforma más completa que incluirá:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Integración con base de datos Neo4j para relaciones semánticas</li>
            <li>Sistema de contribuciones y sugerencias de usuarios</li>
            <li>API pública para investigadores y desarrolladores</li>
            <li>Visualizaciones interactivas de relaciones entre palabras</li>
            <li>Herramientas de análisis lingüístico avanzado</li>
          </ul>
        </div>

        <div className="bg-blue-50 rounded-lg p-8 border border-blue-200">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Créditos</h2>
          <p className="text-gray-700">
            Este proyecto es un MVP (Producto Mínimo Viable) desarrollado como parte de un 
            esfuerzo de digitalización del patrimonio lingüístico chileno.
          </p>
          <p className="text-gray-700 mt-4">
            El contenido lexicográfico proviene del Diccionario del uso del español de Chile (DUECh).
          </p>
        </div>
      </div>
    </div>
  );
}