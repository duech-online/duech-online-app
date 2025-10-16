const EDITOR_HOSTNAME = 'editor.localhost';
const EDITOR_PATH_PREFIX = '/editor';

function isEditorPath(pathname: string | null | undefined): boolean {
    if (!pathname) return false;
    if (pathname === EDITOR_PATH_PREFIX) return true;
    return pathname.startsWith(`${EDITOR_PATH_PREFIX}/`);
}

/**
 * Utility to determine if the current route is in editor mode
 * Editor mode is active when:
 * 1. Accessing via editor.localhost subdomain
 * 2. The x-editor-mode header is set by middleware
 */

/**
 * Check if a pathname represents an editor route (client components)
 * @param pathname - The pathname to check (e.g., from usePathname())
 * @returns true if the route is in editor mode, false otherwise
 */
export function isEditorModeClient(pathname: string | null | undefined): boolean {
    // For client components, check if hostname is editor.localhost
    if (typeof window !== 'undefined') {
        const hostIsEditor = window.location.hostname === EDITOR_HOSTNAME;
        const pathIsEditor = isEditorPath(pathname);
        return hostIsEditor || pathIsEditor;
    }
    return isEditorPath(pathname);
}

export function isEditorPathname(pathname: string | null | undefined): boolean {
    return isEditorPath(pathname);
}

export const EDITOR_CONFIG = {
    hostname: EDITOR_HOSTNAME,
    pathPrefix: EDITOR_PATH_PREFIX,
};
