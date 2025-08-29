/**
 * Server-side dictionary data loader
 * This file contains functions that only run on the server
 */

import { Dictionary, Word, SearchResult } from '@/app/lib/definitions';
import { dictionaries } from "@/app/lib/placeholder-data";
import { promises as fs } from 'fs';
import path from 'path';

export function loadDictionaryServer(): Promise<Dictionary[]> {
  return Promise.resolve(dictionaries);
}

/**
 * Get word by lemma (server-side)
 */
export async function getWordByLemmaServer(
  lemma: string
): Promise<{ word: Word; letter: string } | null> {

  for (const dict of dictionaries) {
    for (const letterGroup of dict.value) {
      const word = letterGroup.values.find((w) => w.lemma === lemma);
      if (word) {
        return { word, letter: letterGroup.letter };
      }
    }
  }

  return null;
}
