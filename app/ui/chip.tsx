'use client';

import React from 'react';
import { Button } from '@/app/ui/button';
import { PlusIcon, DeleteIcon } from '@/app/ui/icons';

interface ChipProps {
  code: string;
  label: string;
  onRemove?: (code: string) => void;
  className?: string;
  variant?: 'category' | 'style';
  editorMode?: boolean;
}

function Chip({
  code,
  label,
  onRemove,
  className = '',
  variant = 'category',
  editorMode = false,
}: ChipProps) {
  const variantStyles = {
    category: {
      chip: 'bg-duech-blue text-white hover:bg-[var(--color-primary-700)] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-primary-400)]',
      chipReadOnly: 'bg-duech-blue text-white',
      removeBtn: 'bg-white/20 hover:bg-white/30',
    },
    style: {
      chip: 'bg-yellow-300/80 text-gray-900 cursor-default',
      chipReadOnly: 'bg-yellow-300/80 text-gray-900',
      removeBtn: 'bg-black/5 hover:bg-black/10',
    },
  };

  const styles = variantStyles[variant];
  const chipClass = editorMode ? styles.chip : styles.chipReadOnly;

  return (
    <div
      role={editorMode ? 'button' : undefined}
      tabIndex={editorMode ? 0 : undefined}
      className={`${editorMode ? 'group' : ''} inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold transition-colors ${chipClass} ${className}`}
      onKeyDown={
        editorMode
          ? (e) => {
              // solo para que no haga scroll si alguien presiona Space, no borra nada
              if (e.key === ' ') e.preventDefault();
            }
          : undefined
      }
      title={label}
    >
      <span className="select-none">{label}</span>
      {editorMode && onRemove && (
        <Button
          type="button"
          onClick={() => onRemove(code)}
          className={`ml-2 grid h-0 w-0 place-items-center overflow-hidden rounded-full opacity-0 transition-all duration-200 group-hover:h-6 group-hover:w-6 group-hover:opacity-100 ${styles.removeBtn}`}
          aria-label={`Quitar ${label}`}
          title={`Quitar ${label}`}
        >
          <DeleteIcon className="h-3 w-3 text-white" />
        </Button>
      )}
    </div>
  );
}

interface ChipListProps {
  items: string[];
  labels: Record<string, string>;
  variant: 'category' | 'style';
  editorMode: boolean;
  addLabel?: string;
  onAdd?: () => void;
  onRemove?: (index: number) => void;
}

export function ChipList({
  items,
  labels,
  variant,
  editorMode,
  addLabel,
  onAdd,
  onRemove,
}: ChipListProps) {
  if (!items || items.length === 0) {
    return editorMode && onAdd ? (
      <Button onClick={onAdd} className="hover:text-duech-blue text-sm text-gray-500 underline">
        {addLabel}
      </Button>
    ) : null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <Chip
          key={index}
          code={item}
          label={labels[item] || item}
          variant={variant}
          editorMode={editorMode}
          onRemove={editorMode && onRemove ? () => onRemove(index) : undefined}
        />
      ))}
      {editorMode && onAdd && (
        <Button
          onClick={onAdd}
          className="inline-flex items-center justify-center rounded-md border-2 border-dashed border-blue-400 bg-white px-2 py-1 text-blue-600 shadow hover:bg-blue-50 focus:ring-2 focus:ring-blue-300 focus:outline-none"
        >
          <PlusIcon className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
