'use client';

import React from 'react';
import Link from 'next/link';
import InlineEditable from '@/app/components/common/inline-editable';
import { SelectDropdown } from '@/app/components/common/dropdown';

interface WordHeaderProps {
  lemma: string;
  onLemmaChange: (value: string | null) => void;
  editorMode: boolean;
  editingLemma: boolean;
  onStartEditLemma: () => void;
  onCancelEditLemma: () => void;
  // Root field
  root: string;
  onRootChange: (value: string | null) => void;
  editingRoot: boolean;
  onStartEditRoot: () => void;
  onCancelEditRoot: () => void;
  // Editor controls
  letter: string;
  onLetterChange: (value: string) => void;
  letterOptions: Array<{ value: string; label: string }>;
  assignedTo: number | null;
  onAssignedToChange: (value: number | null) => void;
  users: Array<{ id: number; username: string; role: string }>;
  status: string;
  onStatusChange: (value: string) => void;
  statusOptions: Array<{ value: string; label: string }>;
  searchPath: string;
  searchLabel: string;
}

export function WordHeader({
  lemma,
  onLemmaChange,
  editorMode,
  editingLemma,
  onStartEditLemma,
  onCancelEditLemma,
  root,
  onRootChange,
  editingRoot,
  onStartEditRoot,
  onCancelEditRoot,
  letter,
  onLetterChange,
  letterOptions,
  assignedTo,
  onAssignedToChange,
  users,
  status,
  onStatusChange,
  statusOptions,
  searchPath,
  searchLabel,
}: WordHeaderProps) {
  return (
    <>
      {/* Breadcrumb Navigation */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link href={searchPath} className="text-blue-600 hover:text-blue-800">
              {searchLabel}
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-600">{lemma}</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-duech-blue text-5xl font-bold">
            <InlineEditable
              value={lemma}
              onChange={onLemmaChange}
              editorMode={editorMode}
              editing={editingLemma}
              onStart={onStartEditLemma}
              onCancel={onCancelEditLemma}
              saveStrategy="manual"
              placeholder="(lema)"
            />
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-lg text-gray-700">Raíz:</span>
            <span className="text-duech-blue font-semibold">
              <InlineEditable
                value={root}
                onChange={onRootChange}
                editorMode={editorMode}
                editing={editingRoot}
                onStart={onStartEditRoot}
                onCancel={onCancelEditRoot}
                saveStrategy="manual"
                placeholder="Raíz de la palabra"
                addLabel="+ Añadir raíz"
              />
            </span>
          </div>
        </div>

        {/* Editor controls */}
        {editorMode && (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="w-24">
              <SelectDropdown
                label="Letra"
                options={letterOptions}
                selectedValue={letter}
                onChange={(value) => onLetterChange(value.toLowerCase())}
                placeholder="Letra"
              />
            </div>

            <div className="w-36">
              <SelectDropdown
                label="Asignado a"
                options={[
                  { value: '', label: 'Sin asignar' },
                  ...users
                    .filter(
                      (u) => u.role === 'lexicographer' || u.role === 'editor' || u.role === 'admin'
                    )
                    .map((u) => ({
                      value: u.id.toString(),
                      label: u.username,
                    })),
                ]}
                selectedValue={assignedTo?.toString() ?? ''}
                onChange={(value) => onAssignedToChange(value ? Number(value) : null)}
                placeholder="Sin asignar"
              />
            </div>

            <div className="w-32">
              <SelectDropdown
                label="Estado"
                options={statusOptions}
                selectedValue={status}
                onChange={onStatusChange}
                placeholder="Seleccionar estado"
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
