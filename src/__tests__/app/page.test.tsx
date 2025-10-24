import { vi } from 'vitest';
vi.mock('@/components/word-of-the-day', () => {
  return { default: () => React.createElement('div', { 'data-testid': 'word-of-the-day' }) };
});
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));
import React from 'react';
import Page from '@/app/page';
import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

test('renders main heading with correct text', () => {
  render(<Page />);
  expect(
    screen.getByRole('heading', {
      level: 1,
      name: /Diccionario de uso del[\s\S]*español de Chile/i,
    })
  ).toBeInTheDocument();
});
