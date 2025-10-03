/**
 * Type definitions for the Chilean Spanish Dictionary (DUECh)
 */

// Database schema types
export interface User {
  id: number;
  username: string;
  email?: string;
  password_hash: string;
  role: 'lexicographer' | 'editor' | 'admin' | 'superadmin';
  created_at: string;
  updated_at: string;
}

export interface DBWord {
  id: number;
  lemma: string;
  root: string;
  letter: string;
  variant?: string;
  status: 'draft' | 'in_review' | 'reviewed' | 'rejected' | 'published';
  created_by?: number;
  assigned_to?: number;
  created_at: string;
  updated_at: string;
  meanings?: Meaning[]; // When joined with meanings
}

export interface Meaning {
  id: number;
  word_id: number;
  number: number;
  origin?: string;
  meaning: string;
  observation?: string;
  remission?: string;
  categories: string[];
  styles: string[];
  examples: Example[]; // JSONB field
  expressions: string[]; // Array field
  created_at: string;
  updated_at: string;
}

export interface Example {
  value: string;
  author?: string;
  title?: string;
  source?: string;
  date?: string;
  page?: string;
}

export interface Note {
  id: number;
  word_id: number;
  user_id?: number;
  note: string;
  resolved: boolean;
  created_at: string;
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

// Helper type for search results
export interface SearchResult {
  word: Word;
  letter: string;
  matchType: 'exact' | 'partial' | 'definition';
}

// Categories mapping for advanced search
export const GRAMMATICAL_CATEGORIES: Record<string, string> = {
  m: 'Masculino',
  f: 'Femenino',
  adj: 'Adjetivo',
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
