/**
 * Server-side dictionary data loader
 * This file contains functions that only run on the server
 */

import { Dictionary, Word, SearchResult } from '@/types/dictionary';
import { promises as fs } from 'fs';
import path from 'path';

let cachedData: Dictionary[] | null = null;

/**
 * Load dictionary data from JSON file (server-side only)
 */
export async function loadDictionaryServer(): Promise<Dictionary[]> {
  if (cachedData) return cachedData;

  try {
    const filePath = path.join(process.cwd(), 'data', 'example.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    cachedData = JSON.parse(fileContent);
    return cachedData || [];
  } catch (error) {
    console.error('Error loading dictionary:', error);
    return [];
  }
}

/**
 * Get word by lemma (server-side)
 */
export async function getWordByLemmaServer(lemma: string): Promise<{ word: Word; letter: string } | null> {
  const dictionaries = await loadDictionaryServer();
  
  for (const dict of dictionaries) {
    for (const letterGroup of dict.value) {
      const word = letterGroup.values.find(w => w.lemma === lemma);
      if (word) {
        return { word, letter: letterGroup.letter };
      }
    }
  }
  
  return null;
}