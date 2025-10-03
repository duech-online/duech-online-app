# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DUECh Online is a Next.js 15 web application for the Dictionary of Chilean Spanish Usage (Diccionario del Uso del Español de Chile). The app allows users to search, browse, and explore Chilean Spanish words, chileanisms, idioms, and expressions. The project is designed with a modular architecture to facilitate future integration with PostgreSQL.

## Technology Stack

- **Next.js 15** with App Router and Turbopack
- **React 19** for UI components
- **TypeScript** for static typing
- **TailwindCSS v4** for styling
- **PostgreSQL** (backend in development - see FRONTEND_INTEGRATION.md)
- **Custom cookie-based authentication** (JWT with HMAC SHA-256)

## Essential Commands

```bash
# Development
npm run dev              # Start dev server with Turbopack on http://localhost:3000

# Production
npm run build           # Build for production with Turbopack
npm start              # Start production server

# Code Quality
npm run lint           # Run ESLint
npm run format         # Format code with Prettier
```

## Architecture Overview

### Authentication System

The app uses a **custom cookie-based authentication** (not NextAuth v5):

- **JWT Implementation**: Custom JWT signing/verification using HMAC SHA-256 (`app/lib/auth.ts`)
- **Session Cookie**: `duech_session` cookie (httpOnly, 7-day expiration)
- **Protected Routes**: Middleware (`middleware.ts`) protects `/palabra/*`, `/search`, `/busqueda-avanzada` and their API endpoints
- **User Storage**: File-based JSON storage (`data/users.json`) with scrypt password hashing (`app/lib/users.ts`)
- **Server Actions**: `app/lib/actions.ts` contains `authenticate()` and `register()` actions
- **Demo User**: Fallback to `admin@example.com` / `admin123` (configurable via env vars)

**Key Files**:
- `app/lib/auth.ts` - JWT creation, verification, session management
- `app/lib/users.ts` - User CRUD, password hashing with scrypt
- `app/lib/actions.ts` - Server actions for login/register
- `middleware.ts` - Route protection logic

### Path Alias

Use `@/*` to reference root-level imports:
```typescript
import { getWordByLemmaServer } from '@/app/lib/dictionary-server'
import { Word } from '@/app/lib/definitions'
```

### Data Layer

**Current (MVP)**: Uses placeholder data from `app/lib/placeholder-data.ts` (example.json content)

**Future**: PostgreSQL backend documented in `FRONTEND_INTEGRATION.md`

**Server-side data functions**: Located in `app/lib/dictionary-server.ts`
- `loadDictionaryServer()` - Load all dictionaries
- `getWordByLemmaServer(lemma)` - Get word by lemma with letter group

**Client-side data functions**: Use client components and API routes

### Type Definitions

Core types are in `app/lib/definitions.ts`:

```typescript
interface Word {
  lemma: string;      // The headword
  root: string;       // Root form
  values: WordDefinition[];
}

interface WordDefinition {
  number: number;
  origin: string | null;
  categories: string[];        // ['m', 'f', 'adj', 'tr', 'intr', etc.]
  remission: string | null;    // Cross-reference
  meaning: string;
  styles: string[] | null;     // ['espon', 'vulgar', 'fest', 'hist', etc.]
  observation: string | null;
  example: Example | Example[];
  variant: string | null;
  expressions: string[] | null;
}

interface Example {
  value: string;
  author: string | null;
  title: string | null;
  source: string | null;
  date: string | null;
  page: number | string | null;
}
```

**Constants**:
- `GRAMMATICAL_CATEGORIES` - Maps category codes to Spanish labels
- `USAGE_STYLES` - Maps style codes to Spanish labels
- `REGIONAL_MARKERS` - Regional dialect markers

### API Routes Structure

```
app/api/
├── logout/          # POST - Clear session cookie
├── me/              # GET - Get current user session
├── metadata/        # GET - Dictionary metadata
├── search/          # GET - Basic text search
│   └── advanced/    # GET - Advanced search with filters
└── words/
    ├── [lemma]/     # GET - Get word by lemma
    └── random/      # GET - Random word
```

### Page Routes

```
app/
├── page.tsx                    # Home page with random word lottery
├── search/                     # Search results page
├── palabra/[id]/               # Word detail page (dynamic route)
├── busqueda-avanzada/          # Advanced search page
├── login/                      # Login page
├── register/                   # Registration page
├── recursos/                   # Resources page
└── acerca/                     # About page
```

### Components

Reusable components are in `/components`:
- `SearchBar.tsx` - Main search input component
- `WordOfTheDay.tsx` - Random word display
- `MarkdownRenderer.tsx` - Renders markdown content with react-markdown

UI-specific components are in `/app/ui`:
- Form components, buttons, navigation elements

## Important Development Notes

### Search Implementation

**Basic Search**: Searches in lemmas and definitions
- Case-insensitive
- Matches partial words
- Returns results with match type: 'exact', 'partial', or 'definition'

**Advanced Search**: Supports filtering by:
- Grammatical categories (`categories` array)
- Usage styles (`styles` array)
- Origin/etymology (`origin` field)
- Initial letter (`letter` field)
- Free text in lemma or definition

### Working with Examples

Examples can be a single object or an array:
```typescript
// Always normalize to array
const examples = Array.isArray(definition.example)
  ? definition.example
  : [definition.example];
```

### Markdown Rendering

Definitions and examples support markdown formatting:
- Use `MarkdownRenderer` component from `/components`
- Uses `react-markdown` with `remark-gfm` plugin
- Asterisks (\*word\*) indicate emphasized terms

### Session Management

**Getting current user**:
```typescript
import { getSessionUser } from '@/app/lib/auth';

// In Server Component or API route
const user = await getSessionUser();
if (!user) {
  // Not authenticated
}
```

**Setting session**:
```typescript
import { setSessionCookie } from '@/app/lib/auth';

await setSessionCookie({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role // optional
});
```

**Clearing session**:
```typescript
import { clearSessionCookie } from '@/app/lib/auth';

await clearSessionCookie();
```

### Environment Variables

Required for authentication:
```env
AUTH_SECRET=your-long-random-secret
DEMO_USER_EMAIL=admin@example.com
DEMO_USER_PASSWORD=admin123
```

Optional (alternative to AUTH_SECRET):
```env
NEXTAUTH_SECRET=your-secret
```

## PostgreSQL Integration (Future)

See `FRONTEND_INTEGRATION.md` for complete database schema and integration guide.

**Key differences from placeholder data**:
- Examples stored as JSONB (not separate table)
- Expressions stored as TEXT[] array
- Categories/Styles as TEXT[] arrays
- Full-text search with Spanish language config
- Editorial workflow with status field (draft → in_review → reviewed → published)

**Recommended approach**:
1. Create `app/lib/db.ts` with pg Pool connection
2. Create `app/lib/queries.ts` with typed query functions
3. Replace calls to `placeholder-data.ts` with database queries
4. Keep same TypeScript interfaces in `definitions.ts`

## Code Style

- ESLint with Next.js config and Prettier integration
- Format code before committing: `npm run format`
- TypeScript strict mode enabled
- Use Server Components by default, 'use client' only when needed
- Prefer server-side data fetching in page components
