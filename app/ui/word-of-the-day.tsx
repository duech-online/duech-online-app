'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getRandomWord } from '@/app/lib/dictionary';
import { Word } from '@/app/lib/definitions';
import MarkdownRenderer from '@/app/ui/markdown-renderer';

export default function WordOfTheDay() {
  const [word, setWord] = useState<{ word: Word; letter: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadRandomWord = async () => {
      setLoading(true);
      setError(null);
      try {
        const randomWord = await getRandomWord();
        if (!active) return;
        if (randomWord) {
          setWord(randomWord);
        } else {
          setWord(null);
          setError('No pudimos cargar una palabra aleatoria.');
        }
      } catch (err) {
        console.error('Error loading random word:', err);
        if (!active) return;
        setWord(null);
        setError('No pudimos cargar una palabra aleatoria.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadRandomWord();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse rounded-lg bg-white p-6 shadow-md">
        <div className="mb-4 h-6 w-1/3 rounded bg-gray-200"></div>
        <div className="mb-3 h-8 w-1/2 rounded bg-gray-200"></div>
        <div className="mb-2 h-4 w-full rounded bg-gray-200"></div>
        <div className="h-4 w-3/4 rounded bg-gray-200"></div>
      </div>
    );
  }

  if (!word) {
    return (
      <div className="rounded-lg bg-white p-6 text-center shadow-md">
        <p className="text-gray-700">
          {error ? error : 'Aún no hay una palabra destacada para mostrar.'}
        </p>
      </div>
    );
  }

  const firstDefinition = word.word.values[0];
  const shortMeaning =
    firstDefinition.meaning.length > 150
      ? firstDefinition.meaning.substring(0, 150) + '...'
      : firstDefinition.meaning;

  return (
    <div className="border-duech-gold card-hover rounded-xl border-t-4 bg-white p-8 shadow-lg">
      <h2 className="text-duech-gold mb-6 flex items-center text-2xl font-bold">
        <svg
          className="text-duech-blue mr-3 h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
        Lotería de palabras
      </h2>

      <div className="mb-6">
        <h3 className="text-duech-blue mb-3 text-3xl font-bold">{word.word.lemma}</h3>
        {firstDefinition.categories.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {firstDefinition.categories.map((cat, index) => (
              <span
                key={index}
                className="bg-duech-blue inline-block rounded-full px-3 py-1 text-sm font-semibold text-white"
              >
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6 text-lg leading-relaxed text-gray-800">
        <MarkdownRenderer content={shortMeaning} />
      </div>

      <Link
        href={`/palabra/${encodeURIComponent(word.word.lemma)}`}
        className="bg-duech-gold inline-flex transform items-center rounded-lg px-6 py-3 font-semibold text-gray-900 shadow-md transition-all duration-200 hover:scale-105 hover:bg-yellow-500"
      >
        Ver definición completa
        <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
