# DUECh Online - Diccionario del Español de Chile

MVP de aplicación web para el Diccionario del uso del español de Chile (DUECh).

## Descripción

Esta aplicación web permite explorar y buscar palabras del español chileno, incluyendo chilenismos, modismos y expresiones propias del país. El proyecto está diseñado con una arquitectura modular para facilitar la futura integración con Neo4j.

## Características

- **Búsqueda rápida**: Busca palabras por lemma o contenido en las definiciones
- **Lotería de palabras**: Descubre una palabra aleatoria cada vez que visitas la página principal
- **Búsqueda avanzada**: Filtra por categorías gramaticales, estilos de uso, origen y letra inicial
- **Visualización detallada**: Explora definiciones completas con ejemplos, variantes y expresiones relacionadas
- **Diseño responsivo**: Interfaz optimizada para dispositivos móviles y escritorio

## Tecnologías

- **Next.js 14** con App Router
- **TypeScript** para tipado estático
- **TailwindCSS** para estilos
- **ESLint y Prettier** para calidad de código

## Instalación

1. Asegúrate de tener Node.js 18+ instalado

2. Instala las dependencias:
```bash
npm install
```

## Ejecución

### Modo desarrollo
```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

### Modo producción
```bash
npm run build
npm run start
```

## Estructura del proyecto

```
duech-online-app/
├── app/                    # Páginas y rutas (App Router)
│   ├── page.tsx           # Página principal
│   ├── search/            # Página de resultados de búsqueda
│   ├── palabra/[id]/      # Página de detalle de palabra
│   ├── busqueda-avanzada/ # Página de búsqueda avanzada
│   ├── recursos/          # Página de recursos
│   └── acerca/            # Página acerca del proyecto
├── components/            # Componentes reutilizables
│   ├── SearchBar.tsx     # Barra de búsqueda
│   └── WordOfTheDay.tsx  # Componente de palabra aleatoria
├── lib/                   # Utilidades y lógica de negocio
│   └── dictionary.ts     # Funciones para manejo de datos
├── types/                 # Definiciones de TypeScript
│   └── dictionary.ts     # Tipos para el diccionario
└── public/               
    └── data/             
        └── example.json  # Datos del diccionario (mock)
```

## Datos

Actualmente la aplicación utiliza el archivo `example.json` del repositorio `duech-online-parsing` como fuente de datos. Este archivo contiene una muestra de entradas del diccionario con su estructura completa.

## Desarrollo futuro

- Integración con base de datos Neo4j para relaciones semánticas
- API REST para acceso programático
- Sistema de contribuciones de usuarios
- Visualizaciones de relaciones entre palabras
- Exportación de datos en diferentes formatos

## Scripts disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter
- `npm run format` - Formatea el código con Prettier

## Contribuir

Este es un MVP en desarrollo activo. Para contribuir:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está en desarrollo como parte de un esfuerzo de digitalización del patrimonio lingüístico chileno.