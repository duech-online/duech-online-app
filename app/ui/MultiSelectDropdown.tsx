'use client';

import { useState, useRef, useEffect } from 'react';

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
  placeholder = "Seleccionar...",
  maxDisplay = 3,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOptions = options.filter(option => 
    selectedValues.includes(option.value)
  );

  const displayText = selectedOptions.length === 0 
    ? placeholder
    : selectedOptions.length <= maxDisplay
      ? selectedOptions.map(opt => opt.label).join(', ')
      : `${selectedOptions.slice(0, maxDisplay).map(opt => opt.label).join(', ')} +${selectedOptions.length - maxDisplay} más`;

  const handleToggle = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  const handleSelectAll = () => {
    if (selectedValues.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map(opt => opt.value));
    }
  };

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

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-left focus:border-duech-blue focus:outline-none transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className={`truncate ${selectedValues.length === 0 ? 'text-gray-500' : 'text-gray-900'}`}>
            {displayText}
          </span>
          <div className="flex items-center gap-2">
            {selectedValues.length > 0 && (
              <span className="bg-duech-blue text-white text-xs px-2 py-1 rounded-full">
                {selectedValues.length}
              </span>
            )}
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1 border border-gray-300 rounded focus:border-duech-blue focus:outline-none text-sm"
            />
          </div>
          
          <div className="p-2 border-b border-gray-200">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sm text-duech-blue hover:underline"
            >
              {selectedValues.length === options.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </button>
          </div>

          <div className="max-h-40 overflow-y-auto">
            {filteredOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={() => handleToggle(option.value)}
                  className="mr-3 rounded text-duech-blue focus:ring-duech-blue"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
            {filteredOptions.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">
                No se encontraron opciones
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}