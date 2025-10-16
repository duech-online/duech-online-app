'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import MarkdownRenderer from '@/app/ui/markdown-renderer';
import InlineEditable from '@/app/ui/inline-editable';
import { MultiSelector } from '@/app/ui/multi-selector';
import { Chip } from '@/app/ui/chip';
import { SelectDropdown } from '@/app/ui/dropdown';
import { Button } from '@/app/ui/button';
import {
    PencilIcon,
    TrashIcon,
    PlusIcon,
    SpinnerIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    BackIcon,
} from '@/app/ui/icons';
import {
    GRAMMATICAL_CATEGORIES,
    USAGE_STYLES,
    STATUS_OPTIONS,
    type Example,
    type Word,
    type WordDefinition,
} from '@/app/lib/definitions';

interface WordDisplayProps {
    initialWord: Word;
    initialLetter: string;
    initialStatus?: string;
    initialAssignedTo?: number;
    editorMode?: boolean;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type ActiveExample = { defIndex: number; exIndex: number; isNew?: boolean };
type ExampleDraft = {
    value: string;
    author: string;
    title: string;
    source: string;
    date: string;
    page: string;
};

export function WordDisplay({
    initialWord,
    initialLetter,
    initialStatus,
    initialAssignedTo,
    editorMode = false,
}: WordDisplayProps) {
    const [word, setWord] = useState<Word>(initialWord);
    const [letter] = useState(initialLetter);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [lastSavedLemma, setLastSavedLemma] = useState(initialWord.lemma);
    const [status, setStatus] = useState<string>(initialStatus || 'draft');
    const [assignedTo, setAssignedTo] = useState<number | null>(initialAssignedTo || null);
    const [users, setUsers] = useState<Array<{ id: number; username: string; role: string }>>([]);

    const [editingKey, setEditingKey] = useState<string | null>(null);
    const isEditing = (k: string) => editingKey === k;
    const toggle = (k: string) => setEditingKey((prev) => (prev === k ? null : k));

    const [editingCategories, setEditingCategories] = useState<number | null>(null);
    const [editingStyles, setEditingStyles] = useState<number | null>(null);
    const [activeExample, setActiveExample] = useState<ActiveExample | null>(null);
    const [exampleDraft, setExampleDraft] = useState<ExampleDraft | null>(null);

    // Fetch users for assignedTo dropdown (editor mode only)
    useEffect(() => {
        if (!editorMode) return;

        fetch('/api/users')
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setUsers(data.data);
                }
            })
            .catch((err) => console.error('Error fetching users:', err));
    }, [editorMode]);

    // Debounced auto-save (editor mode only)
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const wordRef = useRef(word);
    const statusRef = useRef(status);
    const assignedToRef = useRef(assignedTo);

    useEffect(() => {
        statusRef.current = status;
        assignedToRef.current = assignedTo;
    }, [status, assignedTo]);

    useEffect(() => {
        wordRef.current = word;
    }, [word]);

    const autoSave = useCallback(async () => {
        if (!editorMode) return;

        setSaveStatus('saving');
        try {
            const response = await fetch(`/api/words/${encodeURIComponent(lastSavedLemma)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    word: wordRef.current,
                    status: statusRef.current,
                    assignedTo: assignedToRef.current,
                }),
            });
            if (!response.ok) throw new Error('Error al guardar');

            setSaveStatus('saved');
            setLastSavedLemma(wordRef.current.lemma);

            setTimeout(() => {
                setSaveStatus('idle');
            }, 2000);
        } catch (error) {
            console.error('Error saving:', error);
            setSaveStatus('error');

            setTimeout(() => {
                setSaveStatus('idle');
            }, 3000);
        }
    }, [editorMode, lastSavedLemma]);

    useEffect(() => {
        if (!editorMode) return;

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            autoSave();
        }, 2000);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [word, status, assignedTo, autoSave, editorMode]);

    // Helper functions
    const patchWordLocal = (patch: Partial<Word>) => {
        setWord((prev) => ({ ...prev, ...patch }));
    };

    const patchDefLocal = (idx: number, patch: Partial<WordDefinition>) => {
        setWord((prev) => ({
            ...prev,
            values: prev.values.map((d, i) => (i === idx ? { ...d, ...patch } : d)),
        }));
    };

    const emptyExample = (): Example => ({
        value: '',
        author: undefined,
        title: undefined,
        source: undefined,
        date: undefined,
        page: undefined,
    });

    const getExamples = (def: WordDefinition): Example[] => {
        const ex = def.example as Example | Example[] | undefined;
        if (!ex) return [];
        return Array.isArray(ex) ? ex : [ex];
    };

    const setExamples = (defIndex: number, arr: Example[]) => {
        setWord((prev) => {
            const values = [...prev.values];
            const normalized = arr.length === 0 ? [emptyExample()] : arr;
            values[defIndex] = {
                ...values[defIndex],
                example: normalized.length === 1 ? normalized[0] : normalized,
            };
            return { ...prev, values };
        });
    };

    const toExampleDraft = (example: Example): ExampleDraft => ({
        value: example.value ?? '',
        author: example.author ?? '',
        title: example.title ?? '',
        source: example.source ?? '',
        date: example.date ?? '',
        page: example.page ?? '',
    });

    const fromExampleDraft = (draft: ExampleDraft): Example => {
        const sanitize = (value: string) => value.trim();
        const base: Example = {
            value: sanitize(draft.value),
        };

        const author = sanitize(draft.author);
        const title = sanitize(draft.title);
        const source = sanitize(draft.source);
        const date = sanitize(draft.date);
        const page = sanitize(draft.page);

        if (author) base.author = author;
        if (title) base.title = title;
        if (source) base.source = source;
        if (date) base.date = date;
        if (page) base.page = page;

        return base;
    };

    const openExampleEditor = (defIndex: number, exIndex: number, isNew = false) => {
        const arr = getExamples(word.values[defIndex]);
        const current = arr[exIndex] ?? emptyExample();
        setActiveExample({ defIndex, exIndex, isNew });
        setExampleDraft(toExampleDraft(current));
    };

    const closeExampleEditor = (shouldDiscardNew = false) => {
        if (shouldDiscardNew && activeExample?.isNew) {
            const arr = getExamples(word.values[activeExample.defIndex]);
            setExamples(
                activeExample.defIndex,
                arr.filter((_, index) => index !== activeExample.exIndex)
            );
        }
        setActiveExample(null);
        setExampleDraft(null);
    };

    const saveExampleDraft = () => {
        if (!activeExample || !exampleDraft) {
            closeExampleEditor();
            return;
        }

        const arr = getExamples(word.values[activeExample.defIndex]);
        const updated = [...arr];
        updated[activeExample.exIndex] = fromExampleDraft(exampleDraft);
        setExamples(activeExample.defIndex, updated);
        closeExampleEditor();
    };

    const handleAddExample = (defIndex: number) => {
        const arr = getExamples(word.values[defIndex]);
        const newExample = emptyExample();
        setExamples(defIndex, [...arr, newExample]);
        openExampleEditor(defIndex, arr.length, true);
    };

    const handleDeleteExample = (defIndex: number, exIndex: number) => {
        const arr = getExamples(word.values[defIndex]);
        if (arr.length <= 1) {
            alert('La definición debe tener al menos un ejemplo.');
            return;
        }
        setExamples(
            defIndex,
            arr.filter((_, i) => i !== exIndex)
        );

        if (activeExample && activeExample.defIndex === defIndex) {
            if (activeExample.exIndex === exIndex) {
                closeExampleEditor();
            } else if (activeExample.exIndex > exIndex) {
                setActiveExample({ ...activeExample, exIndex: activeExample.exIndex - 1 });
            }
        }
    };

    const handleAddDefinition = (insertIndex?: number) => {
        const baseNumber = insertIndex !== undefined ? insertIndex + 1 : word.values.length + 1;
        const newDef: WordDefinition = {
            number: baseNumber,
            origin: null,
            categories: [],
            remission: null,
            meaning: 'Nueva definición',
            styles: null,
            observation: null,
            example: emptyExample(),
            variant: null,
            expressions: null,
        };

        setWord((prev) => {
            const values = [...prev.values];
            const insertAt = insertIndex !== undefined ? insertIndex + 1 : values.length;
            values.splice(insertAt, 0, newDef);

            const renumbered = values.map((def, idx) => ({
                ...def,
                number: idx + 1,
            }));

            return { ...prev, values: renumbered };
        });
    };

    const handleDeleteDefinition = (defIndex: number) => {
        setWord((prev) => ({ ...prev, values: prev.values.filter((_, i) => i !== defIndex) }));
    };

    // Render example helper
    const renderExample = (example: Example | Example[], defIndex?: number, isEditable = false) => {
        const examples = Array.isArray(example) ? example : [example];

        return examples.map((ex, exIndex) => (
            <div
                key={exIndex}
                className={`rounded-lg border-l-4 ${editorMode ? 'border-blue-600' : 'border-blue-400'} bg-gray-50 p-4 ${editorMode ? 'relative' : ''}`}
            >
                <div className="mb-2 text-gray-700">
                    <MarkdownRenderer content={ex.value} />
                </div>
                <div className="text-sm text-gray-600">
                    {ex.author && <span className="mr-3">Autor: {ex.author}</span>}
                    {ex.title && <span className="mr-3">Título: {ex.title}</span>}
                    {ex.source && <span className="mr-3">Fuente: {ex.source}</span>}
                    {ex.date && <span className="mr-3">Fecha: {ex.date}</span>}
                    {ex.page && <span>Página: {ex.page}</span>}
                </div>
                {editorMode && isEditable && defIndex !== undefined && (
                    <div className="mt-2 flex gap-2">
                        <Button
                            onClick={() => openExampleEditor(defIndex, exIndex)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                            <PencilIcon className="mr-1 inline h-4 w-4" />
                            Editar
                        </Button>
                        <Button
                            onClick={() => handleDeleteExample(defIndex, exIndex)}
                            className="text-red-600 hover:text-red-800 text-sm"
                        >
                            <TrashIcon className="mr-1 inline h-4 w-4" />
                            Eliminar
                        </Button>
                    </div>
                )}
            </div>
        ));
    };

    // Save status indicator
    const SaveStatusIndicator = () => {
        if (!editorMode || saveStatus === 'idle') return null;

        const statusConfig = {
            saving: {
                bg: 'bg-blue-50',
                text: 'text-blue-700',
                icon: <SpinnerIcon className="h-4 w-4" />,
                label: 'Guardando...',
            },
            saved: {
                bg: 'bg-green-50',
                text: 'text-green-700',
                icon: <CheckCircleIcon className="h-4 w-4" />,
                label: 'Guardado',
            },
            error: {
                bg: 'bg-red-50',
                text: 'text-red-700',
                icon: <ExclamationCircleIcon className="h-4 w-4" />,
                label: 'Error al guardar',
            },
        } as const;

        const config = statusConfig[saveStatus];

        return (
            <div
                className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg ${config.bg} px-4 py-2 shadow-lg ${config.text}`}
            >
                {config.icon}
                <span className="text-sm font-medium">{config.label}</span>
            </div>
        );
    };

    const hasDefinitions = word.values.length > 0;
    const searchPath = editorMode ? '/editor/buscar' : '/buscar';
    const searchLabel = editorMode ? 'Buscar' : 'Buscar';

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <SaveStatusIndicator />

            {/* Breadcrumb Navigation */}
            <nav className="mb-6">
                <ol className="flex items-center space-x-2 text-sm">
                    <li>
                        <Link href={searchPath} className="text-blue-600 hover:text-blue-800">
                            {searchLabel}
                        </Link>
                    </li>
                    <li className="text-gray-400">/</li>
                    <li className="text-gray-600">{word.lemma}</li>
                </ol>
            </nav>

            <div className="border-duech-gold rounded-xl border-t-4 bg-white p-10 shadow-2xl">
                {/* Header */}
                <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-baseline gap-3">
                        <h1 className="text-duech-blue text-5xl font-bold">
                            {editorMode ? (
                                <InlineEditable
                                    value={word.lemma}
                                    editing={isEditing('lemma')}
                                    saveStrategy="manual"
                                    onChange={(v) => {
                                        patchWordLocal({ lemma: v });
                                        setEditingKey(null);
                                    }}
                                    onCancel={() => setEditingKey(null)}
                                    placeholder="(lema)"
                                />
                            ) : (
                                word.lemma
                            )}
                        </h1>

                        <span className="text-duech-gold rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold uppercase">
                            LETRA {letter.toUpperCase()}
                        </span>

                        {editorMode && (
                            <Button
                                onClick={() => toggle('lemma')}
                                className="text-duech-blue ml-1 inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-blue-100"
                                aria-label="Editar lema"
                                title="Editar lema"
                            >
                                <PencilIcon className="h-6 w-6" />
                            </Button>
                        )}
                    </div>

                    {/* Editor controls */}
                    {editorMode && (
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                            <div className="w-48">
                                <SelectDropdown
                                    label="Asignado a"
                                    options={[
                                        { value: '', label: 'Sin asignar' },
                                        ...users
                                            .filter(
                                                (u) =>
                                                    u.role === 'lexicographer' ||
                                                    u.role === 'editor' ||
                                                    u.role === 'admin'
                                            )
                                            .map((u) => ({
                                                value: u.id.toString(),
                                                label: u.username,
                                            })),
                                    ]}
                                    selectedValue={assignedTo?.toString() ?? ''}
                                    onChange={(value) => setAssignedTo(value ? Number(value) : null)}
                                    placeholder="Sin asignar"
                                />
                            </div>

                            <div className="w-48">
                                <SelectDropdown
                                    label="Estado"
                                    options={STATUS_OPTIONS}
                                    selectedValue={status}
                                    onChange={setStatus}
                                    placeholder="Seleccionar estado"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Root */}
                <div className="mb-4 flex items-center gap-2">
                    <span className="text-lg text-gray-700">Raíz: </span>
                    <span className="text-duech-blue font-semibold">
                        {editorMode ? (
                            <InlineEditable
                                value={word.root}
                                editing={isEditing('root')}
                                saveStrategy="manual"
                                onChange={(v) => {
                                    patchWordLocal({ root: v });
                                    setEditingKey(null);
                                }}
                                onCancel={() => setEditingKey(null)}
                                placeholder="+ Añadir raíz"
                            />
                        ) : word.root}
                    </span>
                    {editorMode && (
                        <Button
                            onClick={() => toggle('root')}
                            className="text-duech-blue inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-blue-100"
                            aria-label="Editar raíz"
                            title="Editar raíz"
                        >
                            <PencilIcon className="h-6 w-6" />
                        </Button>
                    )}
                </div>

                {/* Definitions */}
                <div className="space-y-16">
                    {hasDefinitions ? (
                        word.values.map((def, defIndex) => {
                            const exs = getExamples(def);
                            return (
                                <section
                                    key={defIndex}
                                    className={`relative rounded-2xl border-2 ${editorMode ? 'border-blue-300/70' : 'border-gray-200'} bg-white p-6 ${editorMode ? 'pb-16 pl-14 sm:pl-16' : ''} shadow-sm`}
                                >
                                    {/* Definition number and origin */}
                                    <div className="mt-1 mb-2 flex items-center gap-2">
                                        <span
                                            className={`bg-duech-blue ${editorMode ? 'absolute top-3 left-3' : ''} inline-flex h-10 w-10 ${editorMode ? '' : 'flex-shrink-0'} items-center justify-center rounded-full text-lg font-bold text-white`}
                                        >
                                            {def.number}
                                        </span>

                                        {/* Origin - Editor mode with inline editing, public mode read-only */}
                                        {editorMode ? (
                                            isEditing(`def:${defIndex}:origin`) ? (
                                                <InlineEditable
                                                    value={def.origin ?? ''}
                                                    editing
                                                    saveStrategy="manual"
                                                    onChange={(v) => {
                                                        patchDefLocal(defIndex, {
                                                            origin: v.trim() || null,
                                                        });
                                                        setEditingKey(null);
                                                    }}
                                                    onCancel={() => setEditingKey(null)}
                                                    placeholder="Origen de la palabra"
                                                />
                                            ) : def.origin ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-600">
                                                        <span className="font-medium">Origen:</span> {def.origin}
                                                    </span>
                                                    <Button
                                                        onClick={() => toggle(`def:${defIndex}:origin`)}
                                                        className="text-duech-blue inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-blue-100"
                                                        aria-label="Editar origen"
                                                        title="Editar origen"
                                                    >
                                                        <PencilIcon className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    onClick={() => toggle(`def:${defIndex}:origin`)}
                                                    className="text-gray-500 hover:text-duech-blue text-sm underline"
                                                >
                                                    + Añadir origen
                                                </Button>
                                            )
                                        ) : (
                                            def.origin && (
                                                <p className="text-sm text-gray-600">
                                                    <span className="font-medium">Origen:</span> {def.origin}
                                                </p>
                                            )
                                        )}
                                    </div>

                                    {/* Categories */}
                                    <div className="mb-3">
                                        {!def.categories || def.categories.length === 0 ? (
                                            editorMode && (
                                                <Button
                                                    onClick={() => setEditingCategories(defIndex)}
                                                    className="text-gray-500 hover:text-duech-blue text-sm underline"
                                                >
                                                    + Añadir categorías gramaticales
                                                </Button>
                                            )
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {def.categories.map((cat, catIndex) => (
                                                    <Chip
                                                        key={catIndex}
                                                        code={cat}
                                                        label={GRAMMATICAL_CATEGORIES[cat] || cat}
                                                        variant="category"
                                                        readOnly={!editorMode}
                                                        onRemove={
                                                            editorMode
                                                                ? () => {
                                                                    const updated = def.categories.filter(
                                                                        (_, i) => i !== catIndex
                                                                    );
                                                                    patchDefLocal(defIndex, {
                                                                        categories: updated,
                                                                    });
                                                                }
                                                                : undefined
                                                        }
                                                    />
                                                ))}
                                                {editorMode && (
                                                    <Button
                                                        onClick={() => setEditingCategories(defIndex)}
                                                        className="text-gray-500 hover:text-duech-blue text-sm underline"
                                                    >
                                                        + Añadir
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Remission */}
                                    <div className="mb-2 flex items-center gap-2">
                                        {editorMode ? (
                                            isEditing(`def:${defIndex}:remission`) ? (
                                                <InlineEditable
                                                    value={def.remission ?? ''}
                                                    editing
                                                    saveStrategy="manual"
                                                    onChange={(v) => {
                                                        patchDefLocal(defIndex, {
                                                            remission: v.trim() || null,
                                                        });
                                                        setEditingKey(null);
                                                    }}
                                                    onCancel={() => setEditingKey(null)}
                                                    placeholder="Artículo de remisión"
                                                />
                                            ) : def.remission ? (
                                                <div className="flex items-center gap-2">
                                                    <p className="text-lg text-gray-800">
                                                        Ver:{' '}
                                                        <Link
                                                            href={`/ver/${encodeURIComponent(def.remission)}`}
                                                            className="text-duech-blue hover:text-duech-gold font-bold transition-colors"
                                                        >
                                                            {def.remission}
                                                        </Link>
                                                    </p>
                                                    <Button
                                                        onClick={() => toggle(`def:${defIndex}:remission`)}
                                                        className="text-duech-blue inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-blue-100"
                                                        aria-label="Editar remisión"
                                                        title="Editar remisión"
                                                    >
                                                        <PencilIcon className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    onClick={() => toggle(`def:${defIndex}:remission`)}
                                                    className="text-gray-500 hover:text-duech-blue text-sm underline"
                                                >
                                                    + Añadir remisión
                                                </Button>
                                            )
                                        ) : (
                                            def.remission && (
                                                <div className="mb-4">
                                                    <p className="text-lg text-gray-800">
                                                        Ver:{' '}
                                                        <Link
                                                            href={`/ver/${encodeURIComponent(def.remission)}`}
                                                            className="text-duech-blue hover:text-duech-gold font-bold transition-colors"
                                                        >
                                                            {def.remission}
                                                        </Link>
                                                    </p>
                                                </div>
                                            )
                                        )}
                                    </div>

                                    {/* Meaning */}
                                    <div className="mb-4">
                                        {editorMode ? (
                                            isEditing(`def:${defIndex}:meaning`) ? (
                                                <InlineEditable
                                                    as="textarea"
                                                    value={def.meaning}
                                                    editing
                                                    saveStrategy="manual"
                                                    onChange={(v) => {
                                                        patchDefLocal(defIndex, { meaning: v });
                                                        setEditingKey(null);
                                                    }}
                                                    onCancel={() => setEditingKey(null)}
                                                />
                                            ) : (
                                                <div className="flex items-start gap-2">
                                                    <div className="text-xl leading-relaxed text-gray-900 flex-1">
                                                        <MarkdownRenderer content={def.meaning} />
                                                    </div>
                                                    <Button
                                                        onClick={() => toggle(`def:${defIndex}:meaning`)}
                                                        className="text-duech-blue inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg hover:bg-blue-100"
                                                        aria-label="Editar significado"
                                                        title="Editar significado"
                                                    >
                                                        <PencilIcon className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            )
                                        ) : (
                                            <div className="text-xl leading-relaxed text-gray-900">
                                                <MarkdownRenderer content={def.meaning} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Styles */}
                                    <div className="mb-3">
                                        {!def.styles || def.styles.length === 0 ? (
                                            editorMode && (
                                                <Button
                                                    onClick={() => setEditingStyles(defIndex)}
                                                    className="text-gray-500 hover:text-duech-blue text-sm underline"
                                                >
                                                    + Añadir estilos de uso
                                                </Button>
                                            )
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {def.styles.map((style, styleIndex) => (
                                                    <Chip
                                                        key={styleIndex}
                                                        code={style}
                                                        label={USAGE_STYLES[style] || style}
                                                        variant="style"
                                                        readOnly={!editorMode}
                                                        onRemove={
                                                            editorMode
                                                                ? () => {
                                                                    const updated = def.styles!.filter(
                                                                        (_, i) => i !== styleIndex
                                                                    );
                                                                    patchDefLocal(defIndex, {
                                                                        styles: updated.length ? updated : null,
                                                                    });
                                                                }
                                                                : undefined
                                                        }
                                                    />
                                                ))}
                                                {editorMode && (
                                                    <Button
                                                        onClick={() => setEditingStyles(defIndex)}
                                                        className="text-gray-500 hover:text-duech-blue text-sm underline"
                                                    >
                                                        + Añadir
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Observation */}
                                    {(def.observation || editorMode) && (
                                        <div className="mb-3">
                                            {editorMode ? (
                                                isEditing(`def:${defIndex}:observation`) ? (
                                                    <InlineEditable
                                                        as="textarea"
                                                        value={def.observation ?? ''}
                                                        editing
                                                        saveStrategy="manual"
                                                        onChange={(v) => {
                                                            patchDefLocal(defIndex, {
                                                                observation: v.trim() || null,
                                                            });
                                                            setEditingKey(null);
                                                        }}
                                                        onCancel={() => setEditingKey(null)}
                                                        placeholder="Observación sobre la definición"
                                                    />
                                                ) : def.observation ? (
                                                    <div className="rounded-lg bg-blue-50 p-3">
                                                        <div className="flex items-start gap-2">
                                                            <p className="flex-1 text-sm text-blue-900">
                                                                <span className="font-medium">Observación:</span>{' '}
                                                                {def.observation}
                                                            </p>
                                                            <Button
                                                                onClick={() => toggle(`def:${defIndex}:observation`)}
                                                                className="text-blue-600 hover:text-blue-800 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg hover:bg-blue-100"
                                                                aria-label="Editar observación"
                                                                title="Editar observación"
                                                            >
                                                                <PencilIcon className="h-5 w-5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        onClick={() => toggle(`def:${defIndex}:observation`)}
                                                        className="text-gray-500 hover:text-duech-blue text-sm underline"
                                                    >
                                                        + Añadir observación
                                                    </Button>
                                                )
                                            ) : (
                                                def.observation && (
                                                    <div className="rounded-lg bg-blue-50 p-3">
                                                        <p className="text-sm text-blue-900">
                                                            <span className="font-medium">Observación:</span>{' '}
                                                            {def.observation}
                                                        </p>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}

                                    {/* Examples */}
                                    {def.example && (
                                        <div className="mt-4">
                                            <div className="mb-2 flex items-center gap-3">
                                                <h3 className="text-sm font-medium text-gray-900">
                                                    Ejemplo{Array.isArray(def.example) && def.example.length > 1 ? 's' : ''}:
                                                </h3>
                                                {editorMode && (
                                                    <Button
                                                        onClick={() => handleAddExample(defIndex)}
                                                        className="text-duech-blue hover:text-blue-800 text-sm underline"
                                                    >
                                                        + Añadir ejemplo
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                {renderExample(def.example, defIndex, editorMode)}
                                            </div>
                                        </div>
                                    )}

                                    {/* Variant */}
                                    {(def.variant || editorMode) && (
                                        <div className="mt-4">
                                            <span className="text-sm font-medium text-gray-900">Variante: </span>
                                            {editorMode ? (
                                                isEditing(`def:${defIndex}:variant`) ? (
                                                    <InlineEditable
                                                        value={def.variant ?? ''}
                                                        editing
                                                        saveStrategy="manual"
                                                        onChange={(v) => {
                                                            patchDefLocal(defIndex, {
                                                                variant: v.trim() || null,
                                                            });
                                                            setEditingKey(null);
                                                        }}
                                                        onCancel={() => setEditingKey(null)}
                                                        placeholder="Variante de la palabra"
                                                    />
                                                ) : def.variant ? (
                                                    <div className="inline-flex items-center gap-2">
                                                        <span className="font-bold">{def.variant}</span>
                                                        <Button
                                                            onClick={() => toggle(`def:${defIndex}:variant`)}
                                                            className="text-duech-blue inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-blue-100"
                                                            aria-label="Editar variante"
                                                            title="Editar variante"
                                                        >
                                                            <PencilIcon className="h-5 w-5" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        onClick={() => toggle(`def:${defIndex}:variant`)}
                                                        className="text-gray-500 hover:text-duech-blue text-sm underline"
                                                    >
                                                        + Añadir variante
                                                    </Button>
                                                )
                                            ) : (
                                                def.variant && <span className="font-bold">{def.variant}</span>
                                            )}
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

                                    {/* Add/Delete definition buttons (editor mode) */}
                                    {editorMode && (
                                        <div className="pointer-events-none absolute bottom-0 left-1/2 flex -translate-x-1/2 translate-y-1/2 items-center gap-4">
                                            <Button
                                                onClick={() => handleAddDefinition(defIndex)}
                                                aria-label="Agregar definición"
                                                title="Agregar definición"
                                                className="pointer-events-auto inline-flex size-14 items-center justify-center rounded-full border-2 border-dashed border-blue-400 bg-white text-blue-600 shadow hover:bg-blue-50 focus:ring-2 focus:ring-blue-300 focus:outline-none"
                                            >
                                                <PlusIcon className="h-7 w-7" />
                                            </Button>

                                            <Button
                                                onClick={() => handleDeleteDefinition(defIndex)}
                                                aria-label="Eliminar definición"
                                                title="Eliminar definición"
                                                className="pointer-events-auto inline-flex size-14 items-center justify-center rounded-full border-2 border-dashed border-red-300 bg-white text-red-600 shadow hover:bg-red-50 focus:ring-2 focus:ring-red-300 focus:outline-none"
                                            >
                                                <TrashIcon className="h-7 w-7" />
                                            </Button>
                                        </div>
                                    )}
                                </section>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 px-6 py-10 text-center text-gray-600">
                            <p>Esta palabra aún no tiene definiciones.</p>
                            {editorMode && (
                                <Button
                                    type="button"
                                    onClick={() => handleAddDefinition()}
                                    className="bg-duech-blue rounded-full px-6 py-2 text-sm text-white hover:bg-blue-800"
                                >
                                    Añadir definición
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Multi-select modals (editor mode only) */}
            {editorMode && editingCategories !== null && (
                <MultiSelector
                    isOpen
                    onClose={() => setEditingCategories(null)}
                    onSave={(cats: string[]) => {
                        patchDefLocal(editingCategories, { categories: cats });
                    }}
                    selectedItems={word.values[editingCategories].categories}
                    title="Seleccionar categorías gramaticales"
                    options={GRAMMATICAL_CATEGORIES}
                    maxWidth="2xl"
                    columns={3}
                />
            )}

            {editorMode && editingStyles !== null && (
                <MultiSelector
                    isOpen
                    onClose={() => setEditingStyles(null)}
                    onSave={(styles: string[]) => {
                        patchDefLocal(editingStyles, { styles: styles.length ? styles : null });
                    }}
                    selectedItems={word.values[editingStyles].styles || []}
                    title="Seleccionar estilos de uso"
                    options={USAGE_STYLES}
                    maxWidth="lg"
                    columns={2}
                />
            )}

            {/* Example editor modal */}
            {editorMode && activeExample && exampleDraft && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4">
                            {activeExample.isNew ? 'Nuevo ejemplo' : 'Editar ejemplo'}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Ejemplo *</label>
                                <textarea
                                    value={exampleDraft.value}
                                    onChange={(e) =>
                                        setExampleDraft({ ...exampleDraft, value: e.target.value })
                                    }
                                    className="w-full border rounded p-2 min-h-[100px]"
                                    placeholder="Texto del ejemplo"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Autor</label>
                                <input
                                    type="text"
                                    value={exampleDraft.author}
                                    onChange={(e) =>
                                        setExampleDraft({ ...exampleDraft, author: e.target.value })
                                    }
                                    className="w-full border rounded p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Título</label>
                                <input
                                    type="text"
                                    value={exampleDraft.title}
                                    onChange={(e) =>
                                        setExampleDraft({ ...exampleDraft, title: e.target.value })
                                    }
                                    className="w-full border rounded p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Fuente</label>
                                <input
                                    type="text"
                                    value={exampleDraft.source}
                                    onChange={(e) =>
                                        setExampleDraft({ ...exampleDraft, source: e.target.value })
                                    }
                                    className="w-full border rounded p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Fecha</label>
                                <input
                                    type="text"
                                    value={exampleDraft.date}
                                    onChange={(e) =>
                                        setExampleDraft({ ...exampleDraft, date: e.target.value })
                                    }
                                    className="w-full border rounded p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Página</label>
                                <input
                                    type="text"
                                    value={exampleDraft.page}
                                    onChange={(e) =>
                                        setExampleDraft({ ...exampleDraft, page: e.target.value })
                                    }
                                    className="w-full border rounded p-2"
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex gap-3 justify-end">
                            <Button
                                onClick={() => closeExampleEditor(activeExample.isNew)}
                                className="px-4 py-2 border rounded hover:bg-gray-50"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={saveExampleDraft}
                                className="bg-duech-blue text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                Guardar
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Back to search button */}
            <div className="mt-8 rounded-xl bg-white p-6 shadow-xl">
                <Link
                    href={searchPath}
                    className="inline-flex items-center font-medium text-blue-600 hover:text-blue-800"
                >
                    <BackIcon className="mr-2 h-5 w-5" />
                    Volver a búsqueda
                </Link>
            </div>
        </div>
    );
}
