/**
 * EditableInput
 * A small reusable input component that encapsulates local draft state and common handlers.
 */

import React, { useEffect, useRef, useState } from 'react';

export type EditableInputProps = {
    value: string;
    onChange: (v: string) => void;
    onBlur?: () => void;
    placeholder?: string;
    className?: string;
    autoFocus?: boolean;
};

export default function EditableInput({
    value,
    onChange,
    onBlur,
    placeholder = '',
    className = '',
    autoFocus = false,
}: EditableInputProps) {
    const [draft, setDraft] = useState(value ?? '');
    const ref = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        setDraft(value ?? '');
    }, [value]);

    useEffect(() => {
        if (autoFocus) ref.current?.focus();
    }, [autoFocus]);

    const handleChange = (v: string) => {
        setDraft(v);
    };

    const commit = () => {
        onChange(draft.trim());
        onBlur?.();
    };

    const cancel = () => {
        setDraft(value ?? '');
        onBlur?.();
    };

    return (
        <input
            ref={ref}
            value={draft}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') cancel();
            }}
            placeholder={placeholder}
            className={`rounded border border-gray-300 px-2 py-1 ${className}`}
        />
    );
}
