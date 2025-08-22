'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getRandomWord } from '@/lib/dictionary';
import { Word } from '@/types/dictionary';
import MarkdownRenderer from './MarkdownRenderer';

export default function WordOfTheDay() {
  const [word, setWord] = useState<{ word: Word; letter: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRandomWord = async () => {
      try {
        const randomWord = await getRandomWord();
        setWord(randomWord);
      } catch (error) {
        console.error('Error loading random word:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRandomWord();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  if (!word) {
    return null;
  }

  const firstDefinition = word.word.values[0];
  const shortMeaning = firstDefinition.meaning.length > 150 
    ? firstDefinition.meaning.substring(0, 150) + '...' 
    : firstDefinition.meaning;

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-duech-gold card-hover">
      <h2 className="text-2xl font-bold text-duech-gold mb-6 flex items-center">
        <svg className="w-8 h-8 mr-3 text-duech-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        Lotería de palabras
      </h2>
      
      <div className="mb-6">
        <h3 className="text-3xl font-bold text-duech-blue mb-3">
          {word.word.lemma}
        </h3>
        {firstDefinition.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {firstDefinition.categories.map((cat, index) => (
              <span 
                key={index} 
                className="inline-block px-3 py-1 text-sm font-semibold bg-duech-blue text-white rounded-full"
              >
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="text-gray-800 mb-6 leading-relaxed text-lg">
        <MarkdownRenderer content={shortMeaning} />
      </div>

      <Link 
        href={`/palabra/${encodeURIComponent(word.word.lemma)}`}
        className="inline-flex items-center bg-duech-gold text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500 transition-all duration-200 transform hover:scale-105 shadow-md"
      >
        Ver definición completa
        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}