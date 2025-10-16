const EDITOR_HOSTNAME = 'editor.localhost';

/**
 * Utility to determine if the current route is in editor mode
 * Editor mode is active when accessing via editor.localhost subdomain
 */

/**
 * Check if the current context is in editor mode (client components)
 * @param pathname - The pathname (not used anymore, kept for backward compatibility)
 * @returns true if accessing via editor.localhost, false otherwise
 */
export function isEditorModeClient(pathname?: string | null | undefined): boolean {
  // For client components, check if hostname is editor.localhost
  if (typeof window !== 'undefined') {
    return window.location.hostname === EDITOR_HOSTNAME;
  }
  return false;
}
