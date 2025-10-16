'use client';

import React from 'react';
import Link from 'next/link';
import MarkdownRenderer from '@/app/components/common/markdown-renderer';
import InlineEditable from '@/app/components/common/inline-editable';
import { ChipList } from '@/app/components/common/chip';
import { Button } from '@/app/components/common/button';
import { PlusIcon, TrashIcon } from '@/app/components/common/icons';
import {
  GRAMMATICAL_CATEGORIES,
  USAGE_STYLES,
  type Example,
  type WordDefinition,
} from '@/app/lib/definitions';

interface DefinitionSectionProps {
  definition: WordDefinition;
  defIndex: number;
  editorMode: boolean;
  editingKey: string | null;
  onToggleEdit: (key: string) => void;
  onPatchDefinition: (patch: Partial<WordDefinition>) => void;
  onSetEditingCategories: () => void;
  onSetEditingStyles: () => void;
  onAddDefinition: () => void;
  onDeleteDefinition: () => void;
  renderExample: (
    example: Example | Example[],
    defIndex?: number,
    isEditable?: boolean
  ) => React.ReactNode;
}

export function DefinitionSection({
  definition: def,
  defIndex,
  editorMode,
  editingKey,
  onToggleEdit,
  onPatchDefinition,
  onSetEditingCategories,
  onSetEditingStyles,
  onAddDefinition,
  onDeleteDefinition,
  renderExample,
}: DefinitionSectionProps) {
  const isEditing = (k: string) => editingKey === k;

  return (
    <section
      className={`definition-hover relative rounded-2xl border-2 ${editorMode ? 'border-blue-300/70' : 'border-gray-200'} bg-white p-6 ${editorMode ? 'pb-16' : ''} shadow-sm`}
    >
      {/* Layout: number on left, content on right */}
      <div className="flex gap-4">
        {/* Definition number */}
        <div className="flex-shrink-0">
          <span className="bg-duech-blue inline-flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white">
            {def.number}
          </span>
        </div>

        {/* Content wrapper */}
        <div className="flex-1">
          {/* Origin */}
          <div className="mb-2">
            <InlineEditable
              value={def.origin}
              onChange={(v) => onPatchDefinition({ origin: v })}
              editorMode={editorMode}
              editing={isEditing(`def:${defIndex}:origin`)}
              onStart={() => onToggleEdit(`def:${defIndex}:origin`)}
              onCancel={() => onToggleEdit(`def:${defIndex}:origin`)}
              saveStrategy="manual"
              placeholder="Origen de la palabra"
              addLabel="+ Añadir origen"
              renderDisplay={(value: string) => (
                <span className="text-sm text-gray-600">
                  <span className="font-medium">Origen:</span> {value}
                </span>
              )}
            />
          </div>
          {/* Categories */}
          <div className="mb-3">
            <ChipList
              items={def.categories}
              labels={GRAMMATICAL_CATEGORIES}
              variant="category"
              editorMode={editorMode}
              addLabel="+ Añadir categorías gramaticales"
              onAdd={onSetEditingCategories}
              onRemove={(index) => {
                const updated = def.categories.filter((_, i) => i !== index);
                onPatchDefinition({ categories: updated });
              }}
            />
          </div>{' '}
          {/* Remission */}
          <div className="mb-2 flex items-center gap-2">
            <InlineEditable
              value={def.remission}
              onChange={(v) => onPatchDefinition({ remission: v })}
              editorMode={editorMode}
              editing={isEditing(`def:${defIndex}:remission`)}
              onStart={() => onToggleEdit(`def:${defIndex}:remission`)}
              onCancel={() => onToggleEdit(`def:${defIndex}:remission`)}
              saveStrategy="manual"
              placeholder="Artículo de remisión"
              addLabel="+ Añadir remisión"
              renderDisplay={(value: string) => (
                <p className="text-lg text-gray-800">
                  Ver:{' '}
                  <Link
                    href={`/palabra/${encodeURIComponent(value)}`}
                    className="text-duech-blue hover:text-duech-gold font-bold transition-colors"
                  >
                    {value}
                  </Link>
                </p>
              )}
            />
          </div>
          {/* Meaning */}
          <div className="mb-4">
            <InlineEditable
              as="textarea"
              value={def.meaning}
              onChange={(v) => onPatchDefinition({ meaning: v ?? '' })}
              editorMode={editorMode}
              editing={isEditing(`def:${defIndex}:meaning`)}
              onStart={() => onToggleEdit(`def:${defIndex}:meaning`)}
              onCancel={() => onToggleEdit(`def:${defIndex}:meaning`)}
              saveStrategy="manual"
              placeholder="Significado de la definición"
              renderDisplay={(value: string) => (
                <div className="text-xl leading-relaxed text-gray-900">
                  <MarkdownRenderer content={value} />
                </div>
              )}
            />
          </div>
          {/* Styles */}
          <div className="mb-3">
            <ChipList
              items={def.styles || []}
              labels={USAGE_STYLES}
              variant="style"
              editorMode={editorMode}
              addLabel="+ Añadir estilos de uso"
              onAdd={onSetEditingStyles}
              onRemove={(index) => {
                const updated = def.styles!.filter((_, i) => i !== index);
                onPatchDefinition({
                  styles: updated.length ? updated : null,
                });
              }}
            />
          </div>{' '}
          {/* Observation */}
          {(def.observation || editorMode) && (
            <div className="mb-3">
              <InlineEditable
                value={def.observation}
                onChange={(v) => onPatchDefinition({ observation: v })}
                editorMode={editorMode}
                editing={isEditing(`def:${defIndex}:observation`)}
                onStart={() => onToggleEdit(`def:${defIndex}:observation`)}
                onCancel={() => onToggleEdit(`def:${defIndex}:observation`)}
                saveStrategy="manual"
                placeholder="Observación sobre la definición"
                addLabel="+ Añadir observación"
                as="textarea"
                renderDisplay={(value: string) => (
                  <p className="flex-1 text-sm text-blue-900">
                    <span className="font-medium">Observación:</span> {value}
                  </p>
                )}
                renderWrapper={(children: React.ReactNode) => (
                  <div className="rounded-lg bg-blue-50 p-3">{children}</div>
                )}
              />
            </div>
          )}
          {/* Examples */}
          {def.example && (
            <div className="mt-4">
              <div className="mb-2 flex items-center gap-3">
                <h3 className="text-sm font-medium text-gray-900">
                  Ejemplo{Array.isArray(def.example) && def.example.length > 1 ? 's' : ''}:
                </h3>
              </div>
              <div className="space-y-8">{renderExample(def.example, defIndex, editorMode)}</div>
            </div>
          )}
          {/* Variant */}
          {(def.variant || editorMode) && (
            <div className="mt-4">
              <span className="text-sm font-medium text-gray-900">Variante: </span>
              <InlineEditable
                value={def.variant}
                onChange={(v) => onPatchDefinition({ variant: v })}
                editorMode={editorMode}
                editing={isEditing(`def:${defIndex}:variant`)}
                onStart={() => onToggleEdit(`def:${defIndex}:variant`)}
                onCancel={() => onToggleEdit(`def:${defIndex}:variant`)}
                saveStrategy="manual"
                placeholder="Variante de la palabra"
                addLabel="+ Añadir variante"
                renderDisplay={(value: string) => <span className="font-bold">{value}</span>}
              />
            </div>
          )}
          {/* Expressions - Public mode only */}
          {!editorMode && def.expressions && def.expressions.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 text-sm font-medium text-gray-900">Expresiones:</p>
              <ul className="list-inside list-disc text-gray-700">
                {def.expressions.map((expr, exprIndex) => (
                  <li key={exprIndex} className="font-medium">
                    {expr}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Add/Delete definition buttons (editor mode) */}
      {editorMode && (
        <div className="definition-buttons absolute bottom-0 left-1/2 flex -translate-x-1/2 translate-y-1/2 items-center gap-4 opacity-0 transition-opacity duration-200">
          <Button
            onClick={onAddDefinition}
            aria-label="Agregar definición"
            title="Agregar definición"
            className="inline-flex size-14 items-center justify-center rounded-full border-2 border-dashed border-blue-400 bg-white text-blue-600 shadow hover:bg-blue-50 focus:ring-2 focus:ring-blue-300 focus:outline-none"
          >
            <PlusIcon className="h-7 w-7" />
          </Button>

          <Button
            onClick={onDeleteDefinition}
            aria-label="Eliminar definición"
            title="Eliminar definición"
            className="inline-flex size-14 items-center justify-center rounded-full border-2 border-dashed border-red-300 bg-white text-red-600 shadow hover:bg-red-50 focus:ring-2 focus:ring-red-300 focus:outline-none"
          >
            <TrashIcon className="h-7 w-7" />
          </Button>
        </div>
      )}
    </section>
  );
}
