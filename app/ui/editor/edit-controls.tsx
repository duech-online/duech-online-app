'use client';

import { useState } from 'react';
import type { Example } from '@/app/lib/definitions';
import { GRAMMATICAL_CATEGORIES, USAGE_STYLES } from '@/app/lib/definitions';

/**
 * Botón de edición genérico con ícono de lápiz
 */
export function EditButton({
  onClick,
  className = '',
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`ml-2 rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50 ${className}`}
      aria-label="Editar"
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
        />
      </svg>
    </button>
  );
}

/**
 * Botón para agregar elementos (definiciones, ejemplos, etc.)
 */
export function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      {label}
    </button>
  );
}

/**
 * Botón para eliminar elementos
 */
export function DeleteButton({
  onClick,
  label = 'Eliminar',
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
      {label}
    </button>
  );
}

/**
 * Modal simple para editar texto
 */
interface TextEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: string) => void;
  title: string;
  initialValue: string;
  multiline?: boolean;
}

export function TextEditModal({
  isOpen,
  onClose,
  onSave,
  title,
  initialValue,
  multiline = false,
}: TextEditModalProps) {
  const [value, setValue] = useState(initialValue);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(value);
    onClose();
  };

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-xl font-bold text-gray-900">{title}</h3>
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            rows={6}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        )}
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Selector múltiple para categorías gramaticales
 */
interface CategorySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (categories: string[]) => void;
  selectedCategories: string[];
}

export function CategorySelector({
  isOpen,
  onClose,
  onSave,
  selectedCategories,
}: CategorySelectorProps) {
  const [selected, setSelected] = useState<string[]>(selectedCategories);

  if (!isOpen) return null;

  const toggleCategory = (category: string) => {
    if (selected.includes(category)) {
      setSelected(selected.filter((c) => c !== category));
    } else {
      setSelected([...selected, category]);
    }
  };

  const handleSave = () => {
    onSave(selected);
    onClose();
  };

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-xl font-bold text-gray-900">
          Seleccionar categorías gramaticales
        </h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {Object.entries(GRAMMATICAL_CATEGORIES).map(([key, label]) => (
            <label key={key} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={selected.includes(key)}
                onChange={() => toggleCategory(key)}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Selector múltiple para estilos de uso
 */
interface StyleSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (styles: string[]) => void;
  selectedStyles: string[];
}

export function StyleSelector({ isOpen, onClose, onSave, selectedStyles }: StyleSelectorProps) {
  const [selected, setSelected] = useState<string[]>(selectedStyles);

  if (!isOpen) return null;

  const toggleStyle = (style: string) => {
    if (selected.includes(style)) {
      setSelected(selected.filter((s) => s !== style));
    } else {
      setSelected([...selected, style]);
    }
  };

  const handleSave = () => {
    onSave(selected);
    onClose();
  };

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-xl font-bold text-gray-900">Seleccionar estilos de uso</h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(USAGE_STYLES).map(([key, label]) => (
            <label key={key} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={selected.includes(key)}
                onChange={() => toggleStyle(key)}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export function CategoryChip({
  code,
  label,
  onRemove,
  className = '',
}: {
  code: string;
  label: string;
  onRemove: (c: string) => void;
  className?: string;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      className={`group bg-duech-blue inline-flex h-9 cursor-pointer items-center rounded-full px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-700)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-primary-400)] ${className}`}
      onKeyDown={(e) => {
        // solo para que no haga scroll si alguien presiona Space, no borra nada
        if (e.key === ' ') e.preventDefault();
      }}
      title="Editar categoría"
    >
      <span className="select-none">{label}</span>
      <button
        type="button"
        onClick={() => onRemove(code)}
        className="ml-2 grid h-0 w-0 place-items-center overflow-hidden rounded-full bg-white/20 opacity-0 transition-all duration-200 group-hover:h-6 group-hover:w-6 group-hover:opacity-100 hover:bg-white/30"
        aria-label={`Quitar ${label}`}
        title={`Quitar ${label}`}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862A2 2 0 015.867 19.142L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  );
}

export function ExampleEditor({
  isOpen,
  initial,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  initial: Example;
  onClose: () => void;
  onSave: (e: Example) => void;
}) {
  const [ex, setEx] = useState<Example>(initial);
  if (!isOpen) return null;
  const set = (k: keyof Example, v: string | null) =>
    setEx((prev) => ({ ...prev, [k]: v && v.length ? v : null }));

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-xl font-bold text-gray-900">Editar ejemplo</h3>

        <label className="mb-2 block text-sm font-medium">Texto</label>
        <textarea
          rows={5}
          value={ex.value || ''}
          onChange={(e) => set('value', e.target.value)}
          className="mb-4 w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            placeholder="Autor"
            value={ex.author ?? ''}
            onChange={(e) => set('author', e.target.value)}
            className="rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          <input
            placeholder="Título"
            value={ex.title ?? ''}
            onChange={(e) => set('title', e.target.value)}
            className="rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          <input
            placeholder="Fuente"
            value={ex.source ?? ''}
            onChange={(e) => set('source', e.target.value)}
            className="rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          <input
            placeholder="Fecha"
            value={ex.date ?? ''}
            onChange={(e) => set('date', e.target.value)}
            className="rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          <input
            placeholder="Página"
            value={ex.page ?? ''}
            onChange={(e) => set('page', e.target.value)}
            className="rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onSave(ex);
              onClose();
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export function StyleChip({
  code,
  label,
  onRemove,
  className = '',
}: {
  code: string;
  label: string;
  onRemove: (c: string) => void;
  className?: string;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      className={`group inline-flex h-9 cursor-default items-center rounded-full bg-yellow-300/80 px-4 text-sm font-semibold text-gray-900 transition-colors ${className}`}
      title={label}
      onKeyDown={(e) => {
        if (e.key === ' ') e.preventDefault();
      }}
    >
      <span className="select-none">{label}</span>
      <button
        type="button"
        onClick={() => onRemove(code)}
        className="ml-2 grid h-0 w-0 place-items-center overflow-hidden rounded-full bg-black/5 opacity-0 transition-all duration-200 group-hover:h-6 group-hover:w-6 group-hover:opacity-100 hover:bg-black/10"
        aria-label={`Quitar ${label}`}
        title={`Quitar ${label}`}
      >
        {/* ícono basurero */}
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862A2 2 0 015.867 19.142L5 7m3 0V4a1 1 0 011-1h6a1 1 0 011 1v3m-9 0h12M10 11v6m4-6v6"
          />
        </svg>
      </button>
    </div>
  );
}
