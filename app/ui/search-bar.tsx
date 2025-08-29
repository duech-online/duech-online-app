'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  initialValue?: string;
}

export default function SearchBar({
  placeholder = 'Buscar palabra...',
  className = '',
  initialValue = '',
}: SearchBarProps) {
  const [query, setQuery] = useState(initialValue);
  const router = useRouter();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`w-full ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="focus:border-duech-blue w-full rounded-xl border-2 border-gray-300 bg-white px-6 py-4 pr-16 text-lg text-gray-900 shadow-lg transition-all duration-200 focus:ring-4 focus:ring-blue-200 focus:outline-none"
        />
        <button
          type="submit"
          className="hover:text-duech-blue absolute top-1/2 right-3 -translate-y-1/2 transform rounded-lg bg-gray-100 p-3 text-gray-600 transition-colors hover:bg-blue-50"
          aria-label="Buscar"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>
    </form>
  );
}
