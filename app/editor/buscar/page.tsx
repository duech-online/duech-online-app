import { SearchPage } from '@/app/ui/search-page';
import { getUsers } from '@/app/lib/queries';

export default async function EditorSearchPage() {
  const users = await getUsers();

  return (
    <SearchPage
      editorMode
      title="Editor de Diccionario"
      placeholder="Buscar palabra en el diccionario..."
      initialUsers={users}
    />
  );
}
