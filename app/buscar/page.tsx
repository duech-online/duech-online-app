import { isEditorMode } from '@/app/lib/editor-mode-server';
import { getUsers } from '@/app/lib/queries';
import { SearchPage } from '@/app/components/search/search-page';

export default async function SearchPageRoute() {
  const editorMode = await isEditorMode();
  const users = editorMode ? await getUsers() : [];
  const title = editorMode ? 'Editor de Diccionario' : 'Diccionario';

  return (
    <SearchPage
      editorMode={editorMode}
      title={title}
      placeholder="Buscar palabra en el diccionario..."
      initialUsers={users}
    />
  );
}
