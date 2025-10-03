# DUECh Online - Dictionary of Chilean Spanish

MVP web application for the Dictionary of Chilean Spanish Usage (DUECh).

## Description

This web application allows exploring and searching words from Chilean Spanish, including chileanisms, idioms, and expressions typical of the country. The project is designed with a modular architecture to facilitate future integration with Neo4j.

## Features

- **Quick search**: Search words by lemma or content in definitions
- **Word lottery**: Discover a random word every time you visit the main page
- **Advanced search**: Filter by grammatical categories, usage styles, origin, and initial letter
- **Detailed visualization**: Explore complete definitions with examples, variants, and related expressions
- **Responsive design**: Interface optimized for mobile and desktop devices

## Technologies

- **Next.js 15** with App Router and Turbopack
- **React 19** for UI components
- **TypeScript** for static typing
- **TailwindCSS v4** for styling
- **ESLint and Prettier** for code quality
- **React Markdown** for content rendering

## Installation

1. Make sure you have Node.js 18+ installed

2. Install dependencies:

```bash
npm install
```

## Running the Application

### Development mode

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Production mode

```bash
npm run build
npm run start
```

## Project Structure

```
duech-online-app/
├── app/                     # Pages and routes (App Router)
│   ├── page.tsx            # Main page
│   ├── api/                # API routes
│   │   ├── metadata/       # Metadata API endpoint
│   │   ├── search/         # Search API endpoints
│   │   └── words/          # Words API endpoints
│   ├── search/             # Search results page
│   ├── palabra/[id]/       # Word detail page
│   ├── busqueda-avanzada/  # Advanced search page
│   ├── recursos/           # Resources page
│   └── acerca/             # About page
├── components/             # Reusable components
│   ├── SearchBar.tsx      # Search bar component
│   ├── WordOfTheDay.tsx   # Random word component
│   └── MarkdownRenderer.tsx # Markdown rendering component
├── lib/                    # Utilities and business logic
│   ├── db.ts              # Database connection (Drizzle ORM)
│   ├── schema.ts          # Database schema definitions
│   ├── queries.ts         # Database query functions
│   ├── transformers.ts    # DB to frontend format transformers
│   └── definitions.ts     # TypeScript type definitions
└── public/                 # Static assets
    └── [various SVG icons and images]
```

## Data

The application currently uses the `example.json` file from the `duech-online-parsing` repository as its data source. This file contains a sample of dictionary entries with their complete structure.

## API Endpoints

The application includes several API endpoints:

- `/api/search` - Basic text search
- `/api/search/advanced` - Advanced search with filters
- `/api/words/[lemma]` - Get specific word by lemma
- `/api/metadata` - Get dictionary metadata

## Future Development

- Integration with Neo4j database for semantic relationships
- REST API for programmatic access
- User contribution system
- Word relationship visualizations
- Data export in different formats

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build application for production with Turbopack
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Authentication

All dictionary features are available without authentication. The previous cookie-based login flow has been removed so the application can be explored freely.

## Contributing

This is an MVP in active development. To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is in development as part of an effort to digitize Chilean linguistic heritage.
