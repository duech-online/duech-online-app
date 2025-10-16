import { headers } from 'next/headers';
import { EDITOR_CONFIG, isEditorPathname } from '@/app/lib/editor-mode';

/**
 * Check if current request is in editor mode (server components).
 * Relies on the middleware adding the x-editor-mode header.
 */
export async function isEditorMode(): Promise<boolean> {
  const headersList = await headers();
  const editorModeHeader = headersList.get('x-editor-mode');
  const isEditor = editorModeHeader === 'true';

  console.log(
    '[isEditorMode] Header value:',
    editorModeHeader,
    'Result:',
    isEditor,
    'Hostname config:',
    EDITOR_CONFIG.hostname
  );

  return isEditor;
}

export { isEditorPathname };
