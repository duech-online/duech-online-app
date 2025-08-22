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
  initialValue = ''
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
          className="w-full px-6 py-4 pr-16 text-gray-900 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:border-duech-blue focus:ring-4 focus:ring-blue-200 transition-all duration-200 text-lg shadow-lg"
        />
        <button
          type="submit"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-3 text-gray-600 hover:text-duech-blue transition-colors bg-gray-100 hover:bg-blue-50 rounded-lg"
          aria-label="Buscar"
        >
          <svg
            className="w-6 h-6"
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