'use client';

import { useState } from 'react';
import { Button } from '@/app/ui/button';

/**
 * Selector múltiple genérico para opciones (categorías, estilos, etc.)
 */
interface MultiSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (items: string[]) => void;
  selectedItems: string[];
  title: string;
  options: Record<string, string>;
  maxWidth?: 'lg' | '2xl';
  columns?: 2 | 3;
}

export function MultiSelector({
  isOpen,
  onClose,
  onSave,
  selectedItems,
  title,
  options,
  maxWidth = '2xl',
  columns = 2,
}: MultiSelectorProps) {
  const [selected, setSelected] = useState<string[]>(selectedItems);

  if (!isOpen) return null;

  const toggleItem = (item: string) => {
    if (selected.includes(item)) {
      setSelected(selected.filter((i) => i !== item));
    } else {
      setSelected([...selected, item]);
    }
  };

  const handleSave = () => {
    onSave(selected);
    onClose();
  };

  const maxWidthClass = maxWidth === '2xl' ? 'max-w-2xl' : 'max-w-lg';
  const columnsClass = columns === 3 ? 'md:grid-cols-3' : '';

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div
        className={`max-h-[80vh] w-full ${maxWidthClass} overflow-y-auto rounded-lg bg-white p-6 shadow-xl`}
      >
        <h3 className="mb-4 text-xl font-bold text-gray-900">{title}</h3>
        <div className={`grid grid-cols-2 gap-3 ${columnsClass}`}>
          {Object.entries(options).map(([key, label]) => (
            <label key={key} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={selected.includes(key)}
                onChange={() => toggleItem(key)}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            onClick={onClose}
            className="rounded-lg bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}
