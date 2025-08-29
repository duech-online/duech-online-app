'use client';
import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode };

export function Button({ children, className = '', ...rest }: Props) {
  return (
    <button
      {...rest}
      className={`bg-duech-blue rounded-md px-4 py-2 font-medium text-white hover:bg-blue-800 disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}
