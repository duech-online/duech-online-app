/**
 * Type definitions for the Chilean Spanish Dictionary (DUECh)
 */

export interface Example {
  value: string;
  author: string | null;
  title: string | null;
  source: string | null;
  date: string | null;
  page: number | string | null;
}

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
  'adj': 'Adjetivo',
  'adj/sust': 'Adjetivo/Sustantivo',
  'adj/adv': 'Adjetivo/Adverbio',
  'sust': 'Sustantivo',
  'tr': 'Transitivo',
  'intr': 'Intransitivo',
  'interj': 'Interjección',
  'loc': 'Locución',
  'loc sust': 'Locución sustantiva',
  'loc adv': 'Locución adverbial',
  'loc adj': 'Locución adjetiva',
  'fórm': 'Fórmula',
  'marc': 'Marcador',
  'disc': 'Discursivo',
  'm-f': 'Masculino-Femenino',
  'pron': 'Pronombre',
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
  'p': 'Poco usado',
  'us': 'Usado',
};

// Regional markers
export const REGIONAL_MARKERS: Record<string, string> = {
  '(Norte)': 'Norte de Chile',
};