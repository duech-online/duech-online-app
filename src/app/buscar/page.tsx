import { isEditorMode } from '@/lib/editor-mode-server';
import { getUsers } from '@/lib/queries';
import { SearchPage } from '@/components/search/search-page';

export default async function SearchPageRoute() {
  const editorMode = await isEditorMode();
  const users = editorMode ? await getUsers() : [];

  return (
    <SearchPage
      placeholder="Buscar palabra en el diccionario..."
      initialUsers={users}
    />
  );
}
