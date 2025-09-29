'use client';

import { useEffect, useRef, useState } from 'react';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  label: string;
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  maxDisplay?: number;
}

export default function MultiSelectDropdown({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = 'Seleccionar...',
  maxDisplay = 3,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOptions = options.filter((option) => selectedValues.includes(option.value));

  const displayText =
    selectedOptions.length === 0
      ? placeholder
      : selectedOptions.length <= maxDisplay
        ? selectedOptions.map((option) => option.label).join(', ')
        : `${selectedOptions
            .slice(0, maxDisplay)
            .map((option) => option.label)
            .join(', ')} +${selectedOptions.length - maxDisplay} más`;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleValue = (value: string) => {
    const values = selectedValues.includes(value)
      ? selectedValues.filter((item) => item !== value)
      : [...selectedValues, value];
    onChange(values);
  };

  const handleSelectAll = () => {
    if (selectedValues.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map((option) => option.value));
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="focus:border-duech-blue w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-left transition-colors focus:outline-none"
      >
        <div className="flex items-center justify-between">
          <span
            className={`truncate ${selectedValues.length === 0 ? 'text-gray-500' : 'text-gray-900'}`}
          >
            {displayText}
          </span>
          <div className="flex items-center gap-2">
            {selectedValues.length > 0 && (
              <span className="bg-duech-blue rounded-full px-2 py-1 text-xs text-white">
                {selectedValues.length}
              </span>
            )}
            <svg
              className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 max-h-64 w-full overflow-hidden rounded-lg border border-gray-300 bg-white shadow-lg">
          <div className="border-b border-gray-200 p-2">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="focus:border-duech-blue w-full rounded border border-gray-300 px-3 py-1 text-sm focus:outline-none"
            />
          </div>

          <div className="border-b border-gray-200 p-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-duech-blue text-sm hover:underline"
            >
              {selectedValues.length === options.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </button>
          </div>

          <div className="max-h-40 overflow-y-auto">
            {filteredOptions.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center px-3 py-2 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={() => toggleValue(option.value)}
                  className="text-duech-blue focus:ring-duech-blue mr-3 rounded"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
            {filteredOptions.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">No se encontraron opciones</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
