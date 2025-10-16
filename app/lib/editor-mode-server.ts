import { headers } from 'next/headers';
import { isEditorPathname } from '@/app/lib/editor-mode';

/**
 * Check if current request is in editor mode (server components).
 * Relies on the middleware adding the x-editor-mode header.
 */
export async function isEditorMode(): Promise<boolean> {
  const headersList = await headers();
  const editorModeHeader = headersList.get('x-editor-mode');
  const isEditor = editorModeHeader === 'true';
  return isEditor;
}

export { isEditorPathname };
