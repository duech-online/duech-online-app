import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getWordByLemma } from '@/app/lib/queries';
import EditorClient from './editor-client';

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const decodedLemma = decodeURIComponent(id);

  // Get word from database
  const wordData = await getWordByLemma(decodedLemma);

  if (!wordData) {
    notFound();
  }

  const { word, letter } = wordData;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              Inicio
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li>
            <Link href="/search" className="text-blue-600 hover:text-blue-800">
              Búsqueda
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-600">Editor: {word.lemma}</li>
        </ol>
      </nav>
      <EditorClient initialWord={word} initialLetter={letter} />
    </div>
  );
}
