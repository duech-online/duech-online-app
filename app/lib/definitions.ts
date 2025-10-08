/**
 * Type definitions for the Chilean Spanish Dictionary (DUECh)
 */

/**
 * Data structures
 */

export interface Example {
  value: string;
  author?: string;
  title?: string;
  source?: string;
  date?: string;
  page?: string;
}

// Database schema types (match Drizzle's camelCase output)
export interface User {
  id: number;
  username: string;
  email?: string;
  passwordHash: string;
  role: 'lexicographer' | 'editor' | 'admin' | 'superadmin';
  createdAt: Date;
  updatedAt: Date;
}

export interface DBWord {
  id: number;
  lemma: string;
  root: string | null;
  letter: string;
  variant?: string | null;
  status: string; // Drizzle returns string, not literal union
  createdBy?: number | null;
  assignedTo?: number | null;
  createdAt: Date;
  updatedAt: Date;
  meanings?: Meaning[]; // When joined with meanings
}

export interface Meaning {
  id: number;
  wordId: number;
  number: number;
  origin?: string | null;
  meaning: string;
  observation?: string | null;
  remission?: string | null;
  categories: string[] | null;
  styles: string[] | null;
  examples: Example[] | null; // JSONB field
  expressions: string[] | null; // Array field
  createdAt: Date;
  updatedAt: Date;
}

export interface Note {
  id: number;
  wordId: number;
  userId?: number | null;
  note: string;
  resolved: boolean;
  createdAt: Date;
}

// Legacy types for backward compatibility (will be deprecated)
export interface WordDefinition {
  number: number;
  origin: string | null;
  categories: string[];
  remission: string | null;
  meaning: string;
  styles: string[] | null;
  observation: string | null;
  example: Example | Example[];
  variant: string | null;
  expressions: string[] | null;
}

export interface Word {
  lemma: string;
  root: string;
  values: WordDefinition[];
}

export interface LetterGroup {
  letter: string;
  values: Word[];
}

export interface Dictionary {
  name: string;
  description: string;
  value: LetterGroup[];
}

/**
 * Advanced search with filters
 */
export interface SearchResult {
  word: Word;
  letter: string;
  matchType: 'exact' | 'partial' | 'filter';
  status?: string;
}

export interface SearchFilters {
  query?: string;
  categories?: string[];
  styles?: string[];
  origins?: string[];
  letters?: string[];
}

export interface SearchMetadata {
  categories: string[];
  styles: string[];
  origins: string[];
}

export interface SearchResponse {
  results: SearchResult[];
  metadata: SearchMetadata;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Categories mapping for advanced search
export const GRAMMATICAL_CATEGORIES: Record<string, string> = {
  m: 'Masculino',
  f: 'Femenino',
  adj: 'Adjetivo',
  adv: 'Adverbio',
  'adj/sust': 'Adjetivo/Sustantivo',
  'adj/adv': 'Adjetivo/Adverbio',
  sust: 'Sustantivo',
  tr: 'Transitivo',
  intr: 'Intransitivo',
  interj: 'Interjección',
  loc: 'Locución',
  'loc sust': 'Locución sustantiva',
  'loc adv': 'Locución adverbial',
  'loc adj': 'Locución adjetiva',
  fórm: 'Fórmula',
  marc: 'Marcador',
  disc: 'Discursivo',
  'm-f': 'Masculino-Femenino',
  pron: 'Pronombre',
  'm o f': 'Masculino o Femenino',
};

// Style mappings
export const USAGE_STYLES: Record<string, string> = {
  espon: 'Espontáneo',
  fest: 'Festivo',
  vulgar: 'Vulgar',
  hist: 'Histórico',
  esm: 'Esmerado',
  'p. us.': 'Poco usado',
  p: 'Poco usado',
  us: 'Usado',
};

// Regional markers
export const REGIONAL_MARKERS: Record<string, string> = {
  '(Norte)': 'Norte de Chile',
};

// Lexicographers (for editor)
export const LEXICOGRAPHERS = ['Soledad', 'Sofía'];

// Word states (for editorial workflow)
export const STATES = [
  'Importada',
  'Incorporada',
  'Prerredactada',
  'Redactado',
  'Revisado por comisión',
  'Publicado',
  'Arcaico',
  'Cuarentena',
];
